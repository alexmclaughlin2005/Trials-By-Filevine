import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@juries/database';
import { OCRService } from '../services/ocr-service';

const prisma = new PrismaClient();
const ocrService = new OCRService(prisma);

const createCaptureSchema = z.object({
  caseId: z.string(),
  documentType: z.enum(['questionnaire', 'panel_list', 'jury_card', 'other']),
  imageData: z.string(), // base64 encoded image
});

const confirmJurorsSchema = z.object({
  panelId: z.string(),
  jurors: z.array(
    z.object({
      jurorNumber: z.string().optional(),
      firstName: z.string(),
      lastName: z.string(),
      age: z.number().optional(),
      city: z.string().optional(),
      zipCode: z.string().optional(),
      occupation: z.string().optional(),
      employer: z.string().optional(),
    })
  ),
});

export async function capturesRoutes(server: FastifyInstance) {
  // Create a new capture and upload image
  server.post('/cases/:caseId/captures', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { caseId } = (request.params as any);
      const body = createCaptureSchema.parse(request.body as any);

      // Verify case belongs to organization
      const caseExists = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

      if (!caseExists) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Save image to temporary location
      // In production, this would upload to S3/Vercel Blob
      // For now, we'll store base64 in the database (not ideal for prod)
      const imageData = body.imageData;

      // Create capture record
      const capture = await server.prisma.capture.create({
        data: {
          caseId,
          documentType: body.documentType,
          uploadedBy: userId,
          fileUrl: `data:image/jpeg;base64,${imageData}`, // Temporary storage
          status: 'pending',
        },
      });

      reply.code(201);
      return { capture };
    },
  });

  // Trigger OCR processing for a capture
  server.post('/captures/:captureId/process', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { captureId } = (request.params as any);

      // Verify capture belongs to organization
      const capture = await server.prisma.capture.findFirst({
        where: {
          id: captureId,
        },
      });

      if (capture) {
        const caseRecord = await server.prisma.case.findFirst({
          where: { id: capture.caseId, organizationId }
        });
        if (!caseRecord) {
          reply.code(404);
          return { error: 'Capture not found' };
        }
      }

      if (!capture) {
        reply.code(404);
        return { error: 'Capture not found' };
      }

      if (capture.status !== 'pending') {
        reply.code(400);
        return { error: 'Capture has already been processed' };
      }

      // Update status to processing
      await server.prisma.capture.update({
        where: { id: captureId },
        data: { status: 'processing' },
      });

      // Process in background (don't await)
      ocrService
        .processImage(captureId, capture.fileUrl, capture.documentType)
        .then((result) => ocrService.updateCapture(captureId, result))
        .catch((error) => {
          console.error(`[Capture] OCR failed for ${captureId}:`, error);
          server.prisma.capture.update({
            where: { id: captureId },
            data: {
              status: 'failed',
              errorMessage: error.message,
            },
          });
        });

      return {
        message: 'Processing started',
        captureId,
      };
    },
  });

  // Get capture status and results
  server.get('/captures/:captureId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { captureId } = (request.params as any);

      const capture = await server.prisma.capture.findFirst({
        where: {
          id: captureId,
          caseId: { not: undefined },
        },
      });

      if (!capture) {
        reply.code(404);
        return { error: 'Capture not found' };
      }

      // Verify the case belongs to the organization
      const caseRecord = await server.prisma.case.findFirst({
        where: {
          id: capture.caseId,
          organizationId,
        },
      });

      if (!caseRecord) {
        reply.code(404);
        return { error: 'Capture not found' };
      }

      return { capture };
    },
  });

  // Confirm extracted jurors and create juror records
  server.post('/captures/:captureId/confirm', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { captureId } = request.params as any;
      const body = confirmJurorsSchema.parse(request.body as any);

      // Verify capture belongs to organization
      const capture = await server.prisma.capture.findUnique({
        where: { id: captureId },
      });

      if (!capture) {
        reply.code(404);
        return { error: 'Capture not found' };
      }

      // Verify the case belongs to the organization
      const caseRecord = await server.prisma.case.findFirst({
        where: {
          id: capture.caseId,
          organizationId,
        },
      });

      if (!caseRecord) {
        reply.code(404);
        return { error: 'Capture not found' };
      }

      // Verify panel belongs to the same case
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: body.panelId,
          caseId: capture.caseId,
        },
      });

      if (!panel) {
        reply.code(404);
        return { error: 'Jury panel not found' };
      }

      // Create jurors from confirmed extractions
      const createdJurors = [];
      for (const juror of body.jurors) {
        const created = await server.prisma.juror.create({
          data: {
            panelId: body.panelId,
            captureId,
            jurorNumber: juror.jurorNumber,
            firstName: juror.firstName,
            lastName: juror.lastName,
            age: juror.age,
            city: juror.city,
            zipCode: juror.zipCode,
            occupation: juror.occupation,
            employer: juror.employer,
            source: 'ocr_capture',
            status: 'available',
          },
        });
        createdJurors.push(created);
      }

      // Mark capture as reviewed
      await server.prisma.capture.update({
        where: { id: captureId },
        data: {
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      return {
        message: 'Jurors created successfully',
        count: createdJurors.length,
        jurors: createdJurors,
      };
    },
  });

  // Get all captures for a case
  server.get('/cases/:caseId/captures', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { caseId } = request.params as any;

      // Verify case belongs to organization
      const caseExists = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

      if (!caseExists) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      const captures = await server.prisma.capture.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
      });

      return { captures };
    },
  });
}
