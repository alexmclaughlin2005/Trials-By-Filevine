/**
 * Filevine API Integration Service
 *
 * Implements complete OAuth 2.0 authentication flow for Filevine API v2
 * Based on: FILEVINE_API_IMPLEMENTATION_GUIDE.md
 *
 * Critical Requirements:
 * 1. Base URL: https://api.filevineapp.com/fv-app/v2
 * 2. Three required headers: x-fv-userid, x-fv-orgid, x-fv-sessionid
 * 3. Numeric user ID from GetUserOrgsWithToken (NOT JWT UUID)
 * 4. PascalCase endpoints (/Projects, /Documents)
 */

import crypto from 'crypto';
import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();

// Filevine API configuration
const FILEVINE_IDENTITY_URL = 'https://identity.filevine.com';
const FILEVINE_API_BASE_URL = 'https://api.filevineapp.com/fv-app/v2';
const FILEVINE_OAUTH_SCOPE = 'fv.api.gateway.access tenant filevine.v2.api.* email openid fv.auth.tenant.read';

// Token expiration buffer (refresh 60 seconds before actual expiry)
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.FILEVINE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.warn('⚠️  FILEVINE_ENCRYPTION_KEY not properly configured. Generate with: openssl rand -hex 32');
}

/**
 * Encryption utilities for storing sensitive Filevine credentials
 */
class EncryptionService {
  private key: Buffer;

  constructor() {
    if (!ENCRYPTION_KEY) {
      throw new Error('FILEVINE_ENCRYPTION_KEY environment variable is required');
    }
    this.key = Buffer.from(ENCRYPTION_KEY, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

/**
 * JWT payload structure from Filevine OAuth token
 */
interface FilevineJwtPayload {
  jti: string; // Session ID - required for x-fv-sessionid header
  sub: string; // User UUID (NOT used for API calls)
  exp: number; // Expiration timestamp
  [key: string]: any;
}

/**
 * Response from GetUserOrgsWithToken endpoint
 */
interface UserOrgsResponse {
  user: {
    userId: {
      native: number; // This is the numeric ID we need!
      tenant: string;
    };
    [key: string]: any;
  };
  orgs: Array<{
    orgId: number;
    name: string;
    [key: string]: any;
  }>;
}

/**
 * Authentication result containing all required data
 */
interface AuthResult {
  accessToken: string;
  sessionId: string;
  numericUserId: string;
  filevineOrgId: string;
  expiresAt: Date;
}

/**
 * Filevine API request options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  data?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * Main Filevine service class
 */
export class FilevineService {
  private encryptionService: EncryptionService;
  private organizationId: string;
  private connectionId?: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.encryptionService = new EncryptionService();
  }

  /**
   * Initialize or update Filevine connection for an organization
   */
  async setupConnection(credentials: {
    clientId: string;
    clientSecret: string;
    personalAccessToken: string;
    connectionName?: string;
  }): Promise<{ success: boolean; error?: string; connectionId?: string }> {
    try {
      // Encrypt sensitive credentials
      const encryptedSecret = this.encryptionService.encrypt(credentials.clientSecret);
      const encryptedPAT = this.encryptionService.encrypt(credentials.personalAccessToken);

      // Check if connection already exists
      const existing = await prisma.filevineConnection.findUnique({
        where: { organizationId: this.organizationId },
      });

      if (existing) {
        // Update existing connection
        await prisma.filevineConnection.update({
          where: { id: existing.id },
          data: {
            clientId: credentials.clientId,
            clientSecret: encryptedSecret,
            personalAccessToken: encryptedPAT,
            connectionName: credentials.connectionName || existing.connectionName,
            isActive: true,
            // Clear cached tokens - force re-authentication
            accessToken: null,
            sessionId: null,
            numericUserId: null,
            filevineOrgId: null,
            tokenExpiresAt: null,
            updatedAt: new Date(),
          },
        });
        this.connectionId = existing.id;
      } else {
        // Create new connection
        const connection = await prisma.filevineConnection.create({
          data: {
            organizationId: this.organizationId,
            clientId: credentials.clientId,
            clientSecret: encryptedSecret,
            personalAccessToken: encryptedPAT,
            connectionName: credentials.connectionName || 'Filevine Integration',
            isActive: true,
          },
        });
        this.connectionId = connection.id;
      }

      return { success: true, connectionId: this.connectionId };
    } catch (error: any) {
      console.error('Failed to setup Filevine connection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test the Filevine connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Authenticate and make a simple API call
      await this.ensureValidToken();

      // Test with a simple Projects list call
      const response = await this.request('/Projects', {
        method: 'GET',
        params: { limit: 1 },
      });

      // Update connection test status
      if (this.connectionId) {
        await prisma.filevineConnection.update({
          where: { id: this.connectionId },
          data: {
            lastTestSuccessful: true,
            lastTestAt: new Date(),
            lastErrorMessage: null,
          },
        });
      }

      return { success: true, data: response };
    } catch (error: any) {
      console.error('Filevine connection test failed:', error);

      // Update connection test status
      if (this.connectionId) {
        await prisma.filevineConnection.update({
          where: { id: this.connectionId },
          data: {
            lastTestSuccessful: false,
            lastTestAt: new Date(),
            lastErrorMessage: error.message,
          },
        });
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus() {
    const connection = await prisma.filevineConnection.findUnique({
      where: { organizationId: this.organizationId },
      select: {
        id: true,
        connectionName: true,
        isActive: true,
        lastSyncedAt: true,
        lastTestSuccessful: true,
        lastTestAt: true,
        lastErrorMessage: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!connection) {
      return { connected: false };
    }

    return {
      connected: true,
      ...connection,
      hasValidToken: connection.tokenExpiresAt ? new Date() < connection.tokenExpiresAt : false,
    };
  }

  /**
   * Remove Filevine connection
   */
  async removeConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.filevineConnection.delete({
        where: { organizationId: this.organizationId },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Make an authenticated request to Filevine API
   */
  async request(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<any> {
    await this.ensureValidToken();

    const { method = 'GET', params, data, headers: customHeaders } = options;

    const headers = await this.getHeaders();
    Object.assign(headers, customHeaders);

    const url = new URL(`${FILEVINE_API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Filevine API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Ensure we have a valid authentication token
   */
  private async ensureValidToken(): Promise<void> {
    const connection = await this.getConnection();

    // Check if we have a cached token that's still valid
    if (
      connection.accessToken &&
      connection.sessionId &&
      connection.numericUserId &&
      connection.filevineOrgId &&
      connection.tokenExpiresAt &&
      new Date() < connection.tokenExpiresAt
    ) {
      this.connectionId = connection.id;
      return; // Token is still valid
    }

    // Need to authenticate
    await this.authenticate();
  }

  /**
   * Perform complete OAuth authentication flow
   *
   * Steps:
   * 1. Exchange credentials for OAuth access token
   * 2. Extract session ID from JWT payload
   * 3. Call GetUserOrgsWithToken to get numeric user/org IDs
   * 4. Cache tokens in database
   */
  private async authenticate(): Promise<AuthResult> {
    const connection = await this.getConnection();

    // Decrypt credentials
    const clientSecret = this.encryptionService.decrypt(connection.clientSecret);
    const personalAccessToken = this.encryptionService.decrypt(connection.personalAccessToken);

    // Step 1: OAuth Token Exchange
    const tokenResponse = await fetch(`${FILEVINE_IDENTITY_URL}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: connection.clientId,
        client_secret: clientSecret,
        grant_type: 'personal_access_token',
        token: personalAccessToken,
        scope: FILEVINE_OAUTH_SCOPE,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`OAuth token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string; expires_in?: number };
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 3600; // Default 1 hour

    // Step 2: Extract Session ID from JWT
    const jwtPayload = this.extractJwtPayload(accessToken);
    const sessionId = jwtPayload.jti;

    // Step 3: Get Numeric User/Org IDs
    const userOrgResponse = await fetch(`${FILEVINE_API_BASE_URL}/utils/GetUserOrgsWithToken`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userOrgResponse.ok) {
      const errorText = await userOrgResponse.text();
      throw new Error(`GetUserOrgsWithToken failed: ${errorText}`);
    }

    const userOrgData = await userOrgResponse.json() as UserOrgsResponse;
    const numericUserId = String(userOrgData.user.userId.native);
    const filevineOrgId = String(userOrgData.orgs[0].orgId);

    // Calculate token expiration (with buffer)
    const tokenExpiresAt = new Date(Date.now() + (expiresIn - TOKEN_EXPIRY_BUFFER_SECONDS) * 1000);

    // Step 4: Cache tokens in database
    await prisma.filevineConnection.update({
      where: { id: connection.id },
      data: {
        accessToken,
        sessionId,
        numericUserId,
        filevineOrgId,
        tokenExpiresAt,
        updatedAt: new Date(),
      },
    });

    this.connectionId = connection.id;

    return {
      accessToken,
      sessionId,
      numericUserId,
      filevineOrgId,
      expiresAt: tokenExpiresAt,
    };
  }

  /**
   * Extract JWT payload and decode it
   */
  private extractJwtPayload(jwtToken: string): FilevineJwtPayload {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    const payloadEncoded = parts[1];

    // Add padding if needed for base64 decoding
    const padding = 4 - (payloadEncoded.length % 4);
    const paddedPayload = padding !== 4 ? payloadEncoded + '='.repeat(padding) : payloadEncoded;

    const payloadJson = Buffer.from(paddedPayload, 'base64').toString('utf8');
    return JSON.parse(payloadJson);
  }

  /**
   * Build headers for Filevine API requests
   * Includes all three required custom headers
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const connection = await this.getConnection();

    if (!connection.accessToken || !connection.numericUserId || !connection.filevineOrgId || !connection.sessionId) {
      throw new Error('Not authenticated - missing required auth data');
    }

    return {
      'Authorization': `Bearer ${connection.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-fv-userid': connection.numericUserId,      // Numeric ID from GetUserOrgsWithToken
      'x-fv-orgid': connection.filevineOrgId,       // Organization ID
      'x-fv-sessionid': connection.sessionId,       // JWT jti claim
    };
  }

  /**
   * Get connection from database
   */
  private async getConnection() {
    const connection = await prisma.filevineConnection.findUnique({
      where: { organizationId: this.organizationId },
    });

    if (!connection) {
      throw new Error('Filevine connection not configured for this organization');
    }

    if (!connection.isActive) {
      throw new Error('Filevine connection is disabled');
    }

    return connection;
  }
}

/**
 * Factory function to create FilevineService instance
 */
export function createFilevineService(organizationId: string): FilevineService {
  return new FilevineService(organizationId);
}
