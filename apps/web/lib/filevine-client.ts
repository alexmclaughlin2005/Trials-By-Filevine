/**
 * Filevine API Client
 * Frontend client for Filevine integration endpoints
 */

import { apiClient } from './api-client';

// Types
export interface FilevineConnectionSetup {
  clientId: string;
  clientSecret: string;
  personalAccessToken: string;
  connectionName?: string;
}

export interface FilevineConnectionStatus {
  connected: boolean;
  id?: string;
  connectionName?: string;
  isActive?: boolean;
  lastSyncedAt?: string;
  lastTestSuccessful?: boolean;
  lastTestAt?: string;
  lastErrorMessage?: string;
  tokenExpiresAt?: string;
  hasValidToken?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilevineConnectionSetupResponse {
  success: boolean;
  connectionId?: string;
  testPassed: boolean;
  testError?: string;
  error?: string;
}

export interface FilevineTestResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export interface FilevineProject {
  projectId: {
    native: number;
  };
  projectName: string;
  projectTypeId: number;
  projectTypeName?: string;
  clientName?: string;
  isDeleted?: boolean;
  phaseId?: number;
  phaseName?: string;
  createDate?: string;
  [key: string]: unknown;
}

export interface FilevineProjectsResponse {
  items: FilevineProject[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Setup a new Filevine connection
 */
export async function setupFilevineConnection(
  credentials: FilevineConnectionSetup
): Promise<FilevineConnectionSetupResponse> {
  return apiClient.post<FilevineConnectionSetupResponse>(
    '/filevine/connections',
    credentials
  );
}

/**
 * Get current Filevine connection status
 */
export async function getFilevineConnectionStatus(): Promise<FilevineConnectionStatus> {
  return apiClient.get<FilevineConnectionStatus>('/filevine/connections');
}

/**
 * Update Filevine connection
 */
export async function updateFilevineConnection(
  connectionId: string,
  updates: Partial<FilevineConnectionSetup> & { isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  return apiClient.put<{ success: boolean; error?: string }>(
    `/filevine/connections/${connectionId}`,
    updates
  );
}

/**
 * Remove Filevine connection
 */
export async function removeFilevineConnection(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  return apiClient.delete<{ success: boolean; error?: string }>(
    `/filevine/connections/${connectionId}`
  );
}

/**
 * Test Filevine connection
 */
export async function testFilevineConnection(
  connectionId: string
): Promise<FilevineTestResponse> {
  return apiClient.post<FilevineTestResponse>(
    `/filevine/connections/${connectionId}/test`
  );
}

/**
 * List Filevine projects
 */
export async function listFilevineProjects(params?: {
  limit?: number;
  offset?: number;
}): Promise<FilevineProjectsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  return apiClient.get<FilevineProjectsResponse>(
    `/filevine/projects${query ? `?${query}` : ''}`
  );
}

/**
 * Get specific Filevine project
 */
export async function getFilevineProject(projectId: string): Promise<FilevineProject> {
  return apiClient.get<FilevineProject>(`/filevine/projects/${projectId}`);
}
