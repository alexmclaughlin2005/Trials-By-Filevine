/**
 * Filevine Integration API Routes
 *
 * Endpoints for managing Filevine connections and accessing Filevine data
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createFilevineService } from '../services/filevine.js';

// Request body schemas
const setupConnectionSchema = z.object({
  clientId: z.string().uuid('Client ID must be a valid UUID'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  personalAccessToken: z.string().length(64, 'Personal Access Token must be exactly 64 characters'),
  connectionName: z.string().optional(),
});

const updateConnectionSchema = z.object({
  clientId: z.string().uuid().optional(),
  clientSecret: z.string().min(1).optional(),
  personalAccessToken: z.string().length(64).optional(),
  connectionName: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Query params for listing projects
const listProjectsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Register Filevine routes
 */
export async function filevineRoutes(server: FastifyInstance) {
  /**
   * POST /api/filevine/connections
   * Setup a new Filevine connection for the organization
   */
  server.post('/connections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore - JWT user added by auth middleware
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      const body = setupConnectionSchema.parse(request.body);

      const filevineService = createFilevineService(user.organizationId);
      const result = await filevineService.setupConnection({
        clientId: body.clientId,
        clientSecret: body.clientSecret,
        personalAccessToken: body.personalAccessToken,
        connectionName: body.connectionName,
      });

      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }

      // Test the connection immediately
      const testResult = await filevineService.testConnection();

      return {
        success: true,
        connectionId: result.connectionId,
        testPassed: testResult.success,
        testError: testResult.error,
      };
    } catch (error: any) {
      console.error('Error setting up Filevine connection:', error);

      if (error instanceof z.ZodError) {
        reply.code(400);
        return { error: 'Invalid input', details: error.errors };
      }

      reply.code(500);
      return { error: error.message || 'Failed to setup Filevine connection' };
    }
  });

  /**
   * GET /api/filevine/connections
   * Get the current Filevine connection status
   */
  server.get('/connections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      const filevineService = createFilevineService(user.organizationId);
      const status = await filevineService.getConnectionStatus();

      return status;
    } catch (error: any) {
      console.error('Error getting Filevine connection status:', error);
      reply.code(500);
      return { error: error.message || 'Failed to get connection status' };
    }
  });

  /**
   * PUT /api/filevine/connections/:id
   * Update Filevine connection credentials or settings
   */
  server.put('/connections/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      const body = updateConnectionSchema.parse(request.body);

      // Verify connection belongs to user's organization
      const connection = await server.prisma.filevineConnection.findUnique({
        // @ts-ignore
        where: { id: request.params.id },
      });

      if (!connection || connection.organizationId !== user.organizationId) {
        reply.code(404);
        return { error: 'Connection not found' };
      }

      // If updating credentials, re-setup the connection
      if (body.clientId || body.clientSecret || body.personalAccessToken) {
        const filevineService = createFilevineService(user.organizationId);

        // Get current credentials to fill in any missing ones
        const current = await server.prisma.filevineConnection.findUnique({
          // @ts-ignore
          where: { id: request.params.id },
        });

        if (!current) {
          reply.code(404);
          return { error: 'Connection not found' };
        }

        const result = await filevineService.setupConnection({
          clientId: body.clientId || current.clientId,
          clientSecret: body.clientSecret || current.clientSecret,
          personalAccessToken: body.personalAccessToken || current.personalAccessToken,
          connectionName: body.connectionName,
        });

        if (!result.success) {
          reply.code(400);
          return { error: result.error };
        }
      } else {
        // Just update non-credential fields
        await server.prisma.filevineConnection.update({
          // @ts-ignore
          where: { id: request.params.id },
          data: {
            connectionName: body.connectionName,
            isActive: body.isActive,
            updatedAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating Filevine connection:', error);

      if (error instanceof z.ZodError) {
        reply.code(400);
        return { error: 'Invalid input', details: error.errors };
      }

      reply.code(500);
      return { error: error.message || 'Failed to update connection' };
    }
  });

  /**
   * DELETE /api/filevine/connections/:id
   * Remove Filevine connection
   */
  server.delete('/connections/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // Verify connection belongs to user's organization
      const connection = await server.prisma.filevineConnection.findUnique({
        // @ts-ignore
        where: { id: request.params.id },
      });

      if (!connection || connection.organizationId !== user.organizationId) {
        reply.code(404);
        return { error: 'Connection not found' };
      }

      const filevineService = createFilevineService(user.organizationId);
      const result = await filevineService.removeConnection();

      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error removing Filevine connection:', error);
      reply.code(500);
      return { error: error.message || 'Failed to remove connection' };
    }
  });

  /**
   * POST /api/filevine/connections/:id/test
   * Test the Filevine connection
   */
  server.post('/connections/:id/test', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // Verify connection belongs to user's organization
      const connection = await server.prisma.filevineConnection.findUnique({
        // @ts-ignore
        where: { id: request.params.id },
      });

      if (!connection || connection.organizationId !== user.organizationId) {
        reply.code(404);
        return { error: 'Connection not found' };
      }

      const filevineService = createFilevineService(user.organizationId);
      const result = await filevineService.testConnection();

      if (!result.success) {
        reply.code(400);
        return { error: result.error };
      }

      return {
        success: true,
        message: 'Connection test successful',
        data: result.data,
      };
    } catch (error: any) {
      console.error('Error testing Filevine connection:', error);
      reply.code(500);
      return { error: error.message || 'Connection test failed' };
    }
  });

  /**
   * GET /api/filevine/projects
   * List Filevine projects (cases)
   * This endpoint will be expanded in Phase 2
   */
  server.get('/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      const query = listProjectsSchema.parse(request.query);

      const filevineService = createFilevineService(user.organizationId);

      // Check if connection exists
      const status = await filevineService.getConnectionStatus();
      if (!status.connected) {
        reply.code(400);
        return { error: 'Filevine connection not configured. Please setup a connection first.' };
      }

      // Make API call to Filevine
      const response = await filevineService.request('/Projects', {
        method: 'GET',
        params: {
          limit: query.limit,
          offset: query.offset,
        },
      });

      return {
        items: response.items || [],
        total: response.total || 0,
        limit: query.limit,
        offset: query.offset,
      };
    } catch (error: any) {
      console.error('Error fetching Filevine projects:', error);

      if (error instanceof z.ZodError) {
        reply.code(400);
        return { error: 'Invalid query parameters', details: error.errors };
      }

      reply.code(500);
      return { error: error.message || 'Failed to fetch projects' };
    }
  });

  /**
   * GET /api/filevine/projects/:projectId
   * Get details for a specific Filevine project
   */
  server.get('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { projectId } = request.params;

      const filevineService = createFilevineService(user.organizationId);

      const project = await filevineService.request(`/Projects/${projectId}`, {
        method: 'GET',
      });

      return project;
    } catch (error: any) {
      console.error('Error fetching Filevine project:', error);
      reply.code(500);
      return { error: error.message || 'Failed to fetch project' };
    }
  });
}
