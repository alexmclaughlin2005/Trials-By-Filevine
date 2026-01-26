/**
 * Case-Filevine Integration API Routes
 *
 * Endpoints for linking cases to Filevine projects and importing documents
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { createFilevineService } from '../services/filevine.js';
import { TextExtractionService } from '../services/text-extraction.js';

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
      console.log('[IMPORT] Starting document import request');

      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      console.log('[IMPORT] User from JWT:', { userId: user?.userId, orgId: user?.organizationId });

      if (!user || !user.userId) {
        console.error('[IMPORT] Unauthorized - missing user or userId');
        reply.code(401);
        return { error: 'Unauthorized' };
      }

      // @ts-ignore
      const { caseId } = request.params;
      console.log('[IMPORT] Case ID:', caseId);
      console.log('[IMPORT] Request body:', JSON.stringify(request.body, null, 2));

      const body = importDocumentSchema.parse(request.body);
      console.log('[IMPORT] Parsed body:', JSON.stringify(body, null, 2));

      const link = await server.prisma.caseFilevineProject.findFirst({
        where: { caseId, organizationId: user.organizationId },
      });
      console.log('[IMPORT] Found link:', link ? link.id : 'NOT FOUND');

      if (!link) {
        reply.code(404);
        return { error: 'Case not linked to a Filevine project' };
      }

      console.log('[IMPORT] Creating import record with data:', {
        caseFilevineProjectId: link.id,
        filevineDocumentId: body.filevineDocumentId,
        fivevineFolderId: body.fivevineFolderId,
        filename: body.filename,
        importedBy: user.userId,
      });

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

      console.log('[IMPORT] Successfully created import record:', importedDoc.id);

      // TODO: Trigger async document download job
      // This would be handled by a background worker that:
      // 1. Gets download URL from Filevine
      // 2. Downloads the file
      // 3. Uploads to Vercel Blob or S3
      // 4. Updates the ImportedDocument record with localFileUrl and status

      // Convert BigInt to string for JSON serialization
      const documentResponse = {
        ...importedDoc,
        size: importedDoc.size ? importedDoc.size.toString() : null,
      };

      return { document: documentResponse };
    } catch (error: any) {
      console.error('[IMPORT] Error importing Filevine document:', error);
      console.error('[IMPORT] Error stack:', error.stack);

      if (error instanceof z.ZodError) {
        console.error('[IMPORT] Zod validation error:', JSON.stringify(error.errors, null, 2));
        reply.code(400);
        return { error: 'Invalid input', details: error.errors };
      }

      reply.code(500);
      return { error: error.message || 'Failed to import document' };
    }
  });

  /**
   * POST /api/cases/:caseId/documents/upload
   * Manually upload a document (for users without Filevine)
   */
  server.post('/:caseId/documents/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('[MANUAL_UPLOAD] Starting document upload');

      // Verify JWT token
      await request.jwtVerify();

      // @ts-ignore - JWT user added by jwtVerify
      const user = request.user;
      if (!user || !user.userId) {
        console.error('[MANUAL_UPLOAD] Invalid user from JWT:', user);
        reply.code(401);
        return { error: 'Unauthorized - missing user ID' };
      }

      // @ts-ignore
      const { caseId } = request.params;
      console.log('[MANUAL_UPLOAD] Case ID:', caseId, 'User:', user.userId);

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId: user.organizationId },
      });

      if (!caseData) {
        console.error('[MANUAL_UPLOAD] Case not found:', caseId);
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get or create CaseFilevineProject (for manual uploads, we use a placeholder)
      let link = await server.prisma.caseFilevineProject.findFirst({
        where: { caseId, organizationId: user.organizationId },
      });

      if (!link) {
        // Create a placeholder link for manual uploads
        console.log('[MANUAL_UPLOAD] Creating placeholder Filevine link for manual uploads');
        link = await server.prisma.caseFilevineProject.create({
          data: {
            caseId,
            organizationId: user.organizationId,
            filevineProjectId: 'manual_uploads',
            projectName: 'Manual Uploads',
            linkedBy: user.userId,
            autoSyncDocuments: false,
          },
        });
      }

      // Get multipart data
      const parts = request.parts();
      const fields: Record<string, any> = {};
      let fileBuffer: Buffer | null = null;
      let filename = '';

      // Process all parts (file + fields)
      for await (const part of parts) {
        if (part.type === 'file') {
          filename = part.filename;
          fileBuffer = await part.toBuffer();
          console.log('[MANUAL_UPLOAD] File received:', { filename, size: fileBuffer.length });
        } else if (part.type === 'field') {
          fields[part.fieldname] = part.value;
        }
      }

      if (!fileBuffer || !filename) {
        console.error('[MANUAL_UPLOAD] No file provided');
        reply.code(400);
        return { error: 'No file provided' };
      }

      const fileSize = fileBuffer.length;

      // Validate file size (10MB max)
      if (fileSize > 10 * 1024 * 1024) {
        console.error('[MANUAL_UPLOAD] File too large:', fileSize);
        reply.code(400);
        return { error: 'File too large. Maximum size is 10MB.' };
      }

      console.log('[MANUAL_UPLOAD] Additional fields:', fields);

      // Upload to Vercel Blob
      console.log('[MANUAL_UPLOAD] Uploading to Vercel Blob...');
      const blobResult = await put(filename, fileBuffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      console.log('[MANUAL_UPLOAD] Uploaded to Vercel Blob:', blobResult.url);

      // Create import record with completed status
      const importedDoc = await server.prisma.importedDocument.create({
        data: {
          caseFilevineProjectId: link.id,
          filevineDocumentId: `manual_${Date.now()}`, // Unique ID for manual uploads
          fivevineFolderId: 'manual',
          filename,
          folderName: fields.folderName || 'Manual Uploads',
          size: BigInt(fileSize),
          documentCategory: fields.documentCategory || null,
          tags: fields.tags ? JSON.parse(fields.tags) : [],
          notes: fields.notes || null,
          importedBy: user.userId,
          status: 'completed', // Skip download worker
          localFileUrl: blobResult.url,
          textExtractionStatus: 'pending',
        },
      });

      console.log('[MANUAL_UPLOAD] Created import record:', importedDoc.id);

      // Trigger text extraction for supported document types immediately
      const textExtractionService = new TextExtractionService();
      if (textExtractionService.isPdfFile(filename) || textExtractionService.isWordFile(filename)) {
        console.log('[MANUAL_UPLOAD] Triggering text extraction for document');
        extractTextInBackground(server, textExtractionService, importedDoc.id, blobResult.url, filename);
      } else {
        // Mark as not needed if not a supported document type
        await server.prisma.importedDocument.update({
          where: { id: importedDoc.id },
          data: { textExtractionStatus: 'not_needed' },
        });
      }

      // Convert BigInt to string for JSON serialization
      const documentResponse = {
        ...importedDoc,
        size: importedDoc.size ? importedDoc.size.toString() : null,
      };

      return { document: documentResponse };
    } catch (error: any) {
      console.error('[MANUAL_UPLOAD] Error uploading document:', error);
      console.error('[MANUAL_UPLOAD] Error stack:', error.stack);
      reply.code(500);
      return { error: error.message || 'Failed to upload document' };
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

  /**
   * DELETE /api/cases/:caseId/filevine/documents/:documentId
   * Delete an imported document
   */
  server.delete('/:caseId/filevine/documents/:documentId', async (request: FastifyRequest, reply: FastifyReply) => {
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
      const { caseId, documentId } = request.params;

      // Verify the case belongs to the user's organization
      const caseRecord = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId: user.organizationId },
      });

      if (!caseRecord) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get the document to check if it exists and belongs to this case
      const document = await server.prisma.importedDocument.findFirst({
        where: {
          id: documentId,
          caseFilevineProject: {
            caseId,
            organizationId: user.organizationId,
          },
        },
      });

      if (!document) {
        reply.code(404);
        return { error: 'Document not found' };
      }

      // Delete the document
      // Note: We're not deleting from Vercel Blob here - that would require cleanup logic
      // The blob URLs will remain accessible but orphaned
      await server.prisma.importedDocument.delete({
        where: { id: documentId },
      });

      console.log(`[DELETE] Successfully deleted document ${documentId}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting document:', error);
      reply.code(500);
      return { error: error.message || 'Failed to delete document' };
    }
  });
}

/**
 * Background worker to extract text from a document
 * Runs asynchronously without blocking the upload
 */
async function extractTextInBackground(
  server: FastifyInstance,
  textExtractionService: TextExtractionService,
  documentId: string,
  fileUrl: string,
  filename: string
): Promise<void> {
  try {
    console.log(`[TEXT_EXTRACTION] Starting extraction for document ${documentId}`);

    await server.prisma.importedDocument.update({
      where: { id: documentId },
      data: { textExtractionStatus: 'processing' },
    });

    const result = await textExtractionService.extractAndUploadText(fileUrl, filename, documentId);

    if (result) {
      await server.prisma.importedDocument.update({
        where: { id: documentId },
        data: {
          extractedTextUrl: result.textUrl,
          extractedTextChars: result.charCount,
          textExtractionStatus: 'completed',
          textExtractedAt: new Date(),
        },
      });
      console.log(`[TEXT_EXTRACTION] Successfully extracted ${result.charCount} characters from document ${documentId}`);
      console.log(`[TEXT_EXTRACTION] Text stored at: ${result.textUrl}`);
    } else {
      await server.prisma.importedDocument.update({
        where: { id: documentId },
        data: {
          textExtractionStatus: 'not_needed',
          textExtractedAt: new Date(),
        },
      });
    }
  } catch (error: any) {
    console.error(`[TEXT_EXTRACTION] Failed to extract text from document ${documentId}:`, error);
    await server.prisma.importedDocument.update({
      where: { id: documentId },
      data: {
        textExtractionStatus: 'failed',
        textExtractionError: error.message,
      },
    });
  }
}
