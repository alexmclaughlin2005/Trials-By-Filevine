/**
 * Case-Filevine Integration API Routes
 *
 * Endpoints for linking cases to Filevine projects and importing documents
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createFilevineService } from '../services/filevine.js';

// Request body schemas
const linkProjectSchema = z.object({
  filevineProjectId: z.string(),
  projectName: z.string(),
  projectTypeName: z.string().optional(),
  clientName: z.string().optional(),
  autoSyncDocuments: z.boolean().optional(),
});

const importDocumentSchema = z.object({
  filevineDocumentId: z.string(),
  fivevineFolderId: z.string(),
  filename: z.string(),
  folderName: z.string().optional(),
  currentVersion: z.string().optional(),
  uploadDate: z.string().optional(),
  uploaderFullname: z.string().optional(),
  size: z.number().optional(),
  documentCategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * Register case-Filevine routes
 */
export async function caseFilevineRoutes(server: FastifyInstance) {
  /**
   * POST /api/cases/:caseId/filevine/link
   * Link a case to a Filevine project
   */
  server.post('/:caseId/filevine/link', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user || !user.userId) {
        console.error('Invalid user from JWT:', user);
        reply.code(401);
        return { error: 'Unauthorized - missing user ID' };
      }

      // @ts-ignore
      const { caseId } = request.params;
      const body = linkProjectSchema.parse(request.body);

      console.log('Linking case:', { caseId, userId: user.userId, orgId: user.organizationId });

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId: user.organizationId },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Check if already linked
      const existing = await server.prisma.caseFilevineProject.findUnique({
        where: { caseId },
      });

      if (existing) {
        reply.code(400);
        return { error: 'Case already linked to a Filevine project' };
      }

      // Create link
      const link = await server.prisma.caseFilevineProject.create({
        data: {
          caseId,
          organizationId: user.organizationId,
          filevineProjectId: body.filevineProjectId,
          projectName: body.projectName,
          projectTypeName: body.projectTypeName || null,
          clientName: body.clientName || null,
          linkedBy: user.userId,
          autoSyncDocuments: body.autoSyncDocuments || false,
        },
      });

      return { link };
    } catch (error: any) {
      console.error('Error linking case to Filevine project:', error);

      if (error instanceof z.ZodError) {
        reply.code(400);
        return { error: 'Invalid input', details: error.errors };
      }

      reply.code(500);
      return { error: error.message || 'Failed to link project' };
    }
  });

  /**
   * GET /api/cases/:caseId/filevine/link
   * Get Filevine project link for a case
   */
  server.get('/:caseId/filevine/link', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { caseId } = request.params;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId: user.organizationId },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const link = await server.prisma.caseFilevineProject.findUnique({
        where: { caseId },
      });

      if (!link) {
        return { linked: false };
      }

      return { linked: true, link };
    } catch (error: any) {
      console.error('Error getting case Filevine link:', error);
      reply.code(500);
      return { error: error.message || 'Failed to get link status' };
    }
  });

  /**
   * DELETE /api/cases/:caseId/filevine/link
   * Unlink case from Filevine project
   */
  server.delete('/:caseId/filevine/link', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { caseId } = request.params;

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId: user.organizationId },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      await server.prisma.caseFilevineProject.delete({
        where: { caseId },
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error unlinking case from Filevine:', error);
      reply.code(500);
      return { error: error.message || 'Failed to unlink project' };
    }
  });

  /**
   * GET /api/cases/:caseId/filevine/folders
   * Get folder structure for linked Filevine project
   */
  server.get('/:caseId/filevine/folders', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { caseId } = request.params;

      const link = await server.prisma.caseFilevineProject.findFirst({
        where: { caseId, organizationId: user.organizationId },
      });

      if (!link) {
        reply.code(404);
        return { error: 'Case not linked to a Filevine project' };
      }

      const filevineService = createFilevineService(user.organizationId);
      const folders = await filevineService.getProjectFolders(link.filevineProjectId);

      return folders;
    } catch (error: any) {
      console.error('Error fetching Filevine folders:', error);
      reply.code(500);
      return { error: error.message || 'Failed to fetch folders' };
    }
  });

  /**
   * GET /api/cases/:caseId/filevine/folders/:folderId/documents
   * Get documents in a folder
   */
  server.get('/:caseId/filevine/folders/:folderId/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { caseId, folderId } = request.params;
      // @ts-ignore
      const { limit, offset } = request.query;

      const link = await server.prisma.caseFilevineProject.findFirst({
        where: { caseId, organizationId: user.organizationId },
      });

      if (!link) {
        reply.code(404);
        return { error: 'Case not linked to a Filevine project' };
      }

      const filevineService = createFilevineService(user.organizationId);
      const documents = await filevineService.getFolderDocuments(
        link.filevineProjectId,
        folderId,
        {
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
        }
      );

      return documents;
    } catch (error: any) {
      console.error('Error fetching Filevine documents:', error);
      reply.code(500);
      return { error: error.message || 'Failed to fetch documents' };
    }
  });

  /**
   * POST /api/cases/:caseId/filevine/documents/import
   * Import a document from Filevine
   */
  server.post('/:caseId/filevine/documents/import', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { caseId } = request.params;
      const body = importDocumentSchema.parse(request.body);

      const link = await server.prisma.caseFilevineProject.findFirst({
        where: { caseId, organizationId: user.organizationId },
      });

      if (!link) {
        reply.code(404);
        return { error: 'Case not linked to a Filevine project' };
      }

      // Create import record
      const importedDoc = await server.prisma.importedDocument.create({
        data: {
          caseFilevineProjectId: link.id,
          filevineDocumentId: body.filevineDocumentId,
          fivevineFolderId: body.fivevineFolderId,
          filename: body.filename,
          folderName: body.folderName || null,
          currentVersion: body.currentVersion || null,
          uploadDate: body.uploadDate ? new Date(body.uploadDate) : null,
          uploaderFullname: body.uploaderFullname || null,
          size: body.size ? BigInt(body.size) : null,
          documentCategory: body.documentCategory || null,
          tags: body.tags || [],
          notes: body.notes || null,
          importedBy: user.userId,
          status: 'pending',
        },
      });

      // TODO: Trigger async document download job
      // This would be handled by a background worker that:
      // 1. Gets download URL from Filevine
      // 2. Downloads the file
      // 3. Uploads to Vercel Blob or S3
      // 4. Updates the ImportedDocument record with localFileUrl and status

      return { document: importedDoc };
    } catch (error: any) {
      console.error('Error importing Filevine document:', error);

      if (error instanceof z.ZodError) {
        reply.code(400);
        return { error: 'Invalid input', details: error.errors };
      }

      reply.code(500);
      return { error: error.message || 'Failed to import document' };
    }
  });

  /**
   * GET /api/cases/:caseId/filevine/documents
   * List imported documents for a case
   */
  server.get('/:caseId/filevine/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user) {
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { caseId } = request.params;

      const link = await server.prisma.caseFilevineProject.findFirst({
        where: { caseId, organizationId: user.organizationId },
        include: {
          documents: {
            orderBy: { importedAt: 'desc' },
          },
        },
      });

      if (!link) {
        return { documents: [] };
      }

      // Convert BigInt to string for JSON serialization
      const documents = link.documents.map((doc) => ({
        ...doc,
        size: doc.size ? doc.size.toString() : null,
      }));

      return { documents };
    } catch (error: any) {
      console.error('Error fetching imported documents:', error);
      reply.code(500);
      return { error: error.message || 'Failed to fetch documents' };
    }
  });
}
