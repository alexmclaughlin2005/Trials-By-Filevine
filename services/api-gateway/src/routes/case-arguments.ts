import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TextExtractionService } from '../services/text-extraction.js';

const createArgumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  argumentType: z.enum(['opening', 'closing', 'theme', 'rebuttal']),
});

const updateArgumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  argumentType: z.enum(['opening', 'closing', 'theme', 'rebuttal']),
  changeNotes: z.string().optional(),
});

const attachDocumentSchema = z.object({
  documentId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function caseArgumentsRoutes(server: FastifyInstance) {
  const textExtractionService = new TextExtractionService();
  // Create an argument
  server.post('/:caseId/arguments', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.params as any;
      const body = createArgumentSchema.parse(request.body as any);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const argument = await server.prisma.caseArgument.create({
        data: {
          ...body,
          caseId,
          version: 1,
          isCurrent: true,
        },
      });

      reply.code(201);
      return { argument };
    },
  });

  // Update an argument (creates new version)
  server.put('/:caseId/arguments/:argumentId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, argumentId } = request.params as any;
      const body = updateArgumentSchema.parse(request.body as any);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get existing argument
      const existingArgument = await server.prisma.caseArgument.findFirst({
        where: { id: argumentId, caseId },
      });

      if (!existingArgument) {
        reply.code(404);
        return { error: 'Argument not found' };
      }

      // Mark current version as not current
      await server.prisma.caseArgument.update({
        where: { id: argumentId },
        data: { isCurrent: false },
      });

      // Create new version
      const newVersion = await server.prisma.caseArgument.create({
        data: {
          title: body.title,
          content: body.content,
          argumentType: body.argumentType,
          changeNotes: body.changeNotes,
          caseId,
          version: existingArgument.version + 1,
          isCurrent: true,
          parentId: argumentId,
        },
      });

      return { argument: newVersion };
    },
  });

  // Delete an argument (and all its versions)
  server.delete('/:caseId/arguments/:argumentId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, argumentId } = request.params as any;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get the argument to find root
      const argument = await server.prisma.caseArgument.findFirst({
        where: { id: argumentId, caseId },
      });

      if (!argument) {
        reply.code(404);
        return { error: 'Argument not found' };
      }

      // Find root argument (if this is a version)
      const rootId = argument.parentId || argumentId;

      // Delete all versions (root + children)
      await server.prisma.caseArgument.deleteMany({
        where: {
          OR: [{ id: rootId }, { parentId: rootId }],
        },
      });

      reply.code(204);
      return;
    },
  });

  // Get argument version history
  server.get('/:caseId/arguments/:argumentId/versions', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, argumentId } = request.params as any;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get the argument to find root
      const argument = await server.prisma.caseArgument.findFirst({
        where: { id: argumentId, caseId },
      });

      if (!argument) {
        reply.code(404);
        return { error: 'Argument not found' };
      }

      // Find root argument
      const rootId = argument.parentId || argumentId;

      // Get all versions
      const versions = await server.prisma.caseArgument.findMany({
        where: {
          OR: [{ id: rootId }, { parentId: rootId }],
        },
        orderBy: { version: 'desc' },
      });

      return { versions };
    },
  });

  // ============================================
  // DOCUMENT ATTACHMENT ENDPOINTS
  // ============================================

  /**
   * POST /cases/:caseId/arguments/:argumentId/documents
   * Attach a document to an argument and extract its text
   */
  server.post('/:caseId/arguments/:argumentId/documents', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { caseId, argumentId } = request.params as any;
      const body = attachDocumentSchema.parse(request.body as any);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Verify argument exists and belongs to this case
      const argument = await server.prisma.caseArgument.findFirst({
        where: { id: argumentId, caseId },
      });

      if (!argument) {
        reply.code(404);
        return { error: 'Argument not found' };
      }

      // Verify document exists and belongs to this case
      const document = await server.prisma.importedDocument.findFirst({
        where: {
          id: body.documentId,
          caseFilevineProject: {
            caseId,
            organizationId,
          },
        },
      });

      if (!document) {
        reply.code(404);
        return { error: 'Document not found' };
      }

      // Check if document is already attached
      const existingAttachment = await server.prisma.argumentDocument.findUnique({
        where: {
          argumentId_documentId: {
            argumentId,
            documentId: body.documentId,
          },
        },
      });

      if (existingAttachment) {
        reply.code(409);
        return { error: 'Document is already attached to this argument' };
      }

      // Create the attachment
      const attachment = await server.prisma.argumentDocument.create({
        data: {
          argumentId,
          documentId: body.documentId,
          attachedBy: userId,
          notes: body.notes,
        },
      });

      // Log document status for debugging
      console.log(`[DOCUMENT_ATTACH] Document ${document.filename} (${document.id})`);
      console.log(`[DOCUMENT_ATTACH]   - status: ${document.status}`);
      console.log(`[DOCUMENT_ATTACH]   - textExtractionStatus: ${document.textExtractionStatus}`);
      console.log(`[DOCUMENT_ATTACH]   - has localFileUrl: ${!!document.localFileUrl}`);

      // Trigger text extraction if needed (pending or failed)
      const shouldExtract =
        document.localFileUrl &&
        (document.textExtractionStatus === 'pending' || document.textExtractionStatus === 'failed') &&
        document.status === 'completed';

      console.log(`[DOCUMENT_ATTACH]   - will trigger extraction: ${shouldExtract}`);

      if (shouldExtract) {
        // Run text extraction in the background
        console.log(`[DOCUMENT_ATTACH] Triggering text extraction for ${document.filename}`);
        extractTextInBackground(
          server,
          textExtractionService,
          document.id,
          document.localFileUrl || '',
          document.filename
        );
      } else {
        console.log(`[DOCUMENT_ATTACH] Skipping extraction - conditions not met`);
      }

      reply.code(201);
      return { attachment };
    },
  });

  /**
   * GET /cases/:caseId/arguments/:argumentId/documents
   * Get all documents attached to an argument
   */
  server.get('/:caseId/arguments/:argumentId/documents', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, argumentId } = request.params as any;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Verify argument exists
      const argument = await server.prisma.caseArgument.findFirst({
        where: { id: argumentId, caseId },
      });

      if (!argument) {
        reply.code(404);
        return { error: 'Argument not found' };
      }

      // Get all attachments with document details
      const attachments = await server.prisma.argumentDocument.findMany({
        where: { argumentId },
        include: {
          document: {
            select: {
              id: true,
              filename: true,
              folderName: true,
              localFileUrl: true,
              thumbnailUrl: true,
              size: true,
              extractedTextUrl: true,
              extractedTextChars: true,
              textExtractionStatus: true,
              importedAt: true,
            },
          },
        },
        orderBy: { attachedAt: 'desc' },
      });

      return {
        attachments: attachments.map((att) => ({
          id: att.id,
          attachedAt: att.attachedAt,
          attachedBy: att.attachedBy,
          notes: att.notes,
          documentId: att.documentId,
          document: {
            ...att.document,
            size: att.document.size ? att.document.size.toString() : null,
          },
        })),
      };
    },
  });

  /**
   * POST /cases/:caseId/arguments/:argumentId/documents/:attachmentId/extract
   * Manually trigger text extraction for a document
   */
  server.post('/:caseId/arguments/:argumentId/documents/:attachmentId/extract', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, argumentId, attachmentId } = request.params as any;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get attachment with document details
      const attachment = await server.prisma.argumentDocument.findFirst({
        where: {
          id: attachmentId,
          argumentId,
        },
        include: {
          document: true,
        },
      });

      if (!attachment) {
        reply.code(404);
        return { error: 'Attachment not found' };
      }

      const document = attachment.document;

      if (!document.localFileUrl) {
        reply.code(400);
        return { error: 'Document has no file URL' };
      }

      if (document.status !== 'completed') {
        reply.code(400);
        return { error: 'Document is not ready for extraction' };
      }

      // Trigger extraction
      console.log(`[MANUAL_EXTRACT] Triggering extraction for ${document.filename}`);
      extractTextInBackground(
        server,
        textExtractionService,
        document.id,
        document.localFileUrl,
        document.filename
      );

      reply.code(202);
      return { message: 'Text extraction started' };
    },
  });

  /**
   * DELETE /cases/:caseId/arguments/:argumentId/documents/:attachmentId
   * Remove a document attachment from an argument
   */
  server.delete('/:caseId/arguments/:argumentId/documents/:attachmentId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId, argumentId, attachmentId } = request.params as any;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Verify attachment exists and belongs to this argument
      const attachment = await server.prisma.argumentDocument.findFirst({
        where: {
          id: attachmentId,
          argumentId,
        },
      });

      if (!attachment) {
        reply.code(404);
        return { error: 'Attachment not found' };
      }

      // Delete the attachment
      await server.prisma.argumentDocument.delete({
        where: { id: attachmentId },
      });

      reply.code(204);
      return;
    },
  });
}

/**
 * Background worker to extract text from a document and upload to Vercel Blob
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

    // Update status to processing
    await server.prisma.importedDocument.update({
      where: { id: documentId },
      data: { textExtractionStatus: 'processing' },
    });

    // Extract text and upload to Vercel Blob
    const result = await textExtractionService.extractAndUploadText(fileUrl, filename, documentId);

    if (result) {
      // Save extracted text URL and character count
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
      // Not a supported file type
      await server.prisma.importedDocument.update({
        where: { id: documentId },
        data: {
          textExtractionStatus: 'not_needed',
          textExtractedAt: new Date(),
        },
      });

      console.log(`[TEXT_EXTRACTION] No extraction needed for document ${documentId}`);
    }
  } catch (error: any) {
    console.error(`[TEXT_EXTRACTION] Failed to extract text from document ${documentId}:`, error);

    // Update status to failed
    await server.prisma.importedDocument.update({
      where: { id: documentId },
      data: {
        textExtractionStatus: 'failed',
        textExtractionError: error.message,
      },
    });
  }
}
