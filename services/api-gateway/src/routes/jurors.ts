import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SearchOrchestrator } from '../services/search-orchestrator';
import { MockDataSourceAdapter } from '../adapters/mock-data-source';
import { VoterRecordAdapter } from '../adapters/voter-record-adapter';
import { FECLocalAdapter } from '../adapters/fec-local-adapter';
import { FECAPIAdapter } from '../adapters/fec-api-adapter';
import { PeopleSearchAdapter } from '../adapters/people-search-adapter';
import { DataSourceAdapter } from '../adapters/data-source-adapter';
import { PrismaClient } from '@juries/database';

// Initialize data source adapters
const prisma = new PrismaClient();

// Phase 1: Mock data (always available)
const mockDataSource = new MockDataSourceAdapter();

// Phase 2: Real data sources
const dataSources: DataSourceAdapter[] = [mockDataSource]; // Start with mock

// Voter records (Tier 1 - local database)
const voterRecordAdapter = new VoterRecordAdapter(prisma);
dataSources.push(voterRecordAdapter);

// FEC local database (Tier 1 - local database)
const fecLocalAdapter = new FECLocalAdapter(prisma);
dataSources.push(fecLocalAdapter);

// FEC API (Tier 2 - external API, only if API key configured)
const fecApiKey = process.env.FEC_API_KEY;
if (fecApiKey && fecApiKey !== 'your_fec_api_key_here') {
  const fecApiAdapter = new FECAPIAdapter(fecApiKey);
  dataSources.push(fecApiAdapter);
  console.log('[Juror Research] FEC API adapter enabled');
}

// People Search API (Tier 2 - external API, only if configured)
const peopleSearchProvider = process.env.PEOPLE_SEARCH_PROVIDER as 'pipl' | 'fullcontact' | 'whitepages';
const peopleSearchApiKey = peopleSearchProvider
  ? process.env[`${peopleSearchProvider.toUpperCase()}_API_KEY`]
  : null;

if (peopleSearchProvider && peopleSearchApiKey && peopleSearchApiKey !== 'your_key_here') {
  const peopleSearchAdapter = new PeopleSearchAdapter({
    provider: peopleSearchProvider,
    apiKey: peopleSearchApiKey,
  });
  dataSources.push(peopleSearchAdapter);
  console.log(`[Juror Research] People Search adapter enabled (${peopleSearchProvider})`);
}

console.log(`[Juror Research] Initialized with ${dataSources.length} data sources: ${dataSources.map(d => d.name).join(', ')}`);

// Initialize search orchestrator with all data sources
const searchOrchestrator = new SearchOrchestrator(dataSources);

const createJurorSchema = z.object({
  panelId: z.string(),
  jurorNumber: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  age: z.number().int().positive().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  questionnaireData: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const updateJurorSchema = createJurorSchema.partial().omit({ panelId: true });

export async function jurorsRoutes(server: FastifyInstance) {
  // Get all jurors for a jury panel
  server.get('/panel/:panelId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { panelId } = request.params as any;

      // Verify panel belongs to organization
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: panelId,
          case: { organizationId },
        },
      });

      if (!panel) {
        reply.code(404);
        return { error: 'Jury panel not found' };
      }

      const jurors = await server.prisma.juror.findMany({
        where: { panelId: panelId },
        include: {
          researchArtifacts: true,
          personaMappings: {
            include: {
              persona: true,
            },
          },
        },
        orderBy: { jurorNumber: 'asc' },
      });

      return { jurors };
    },
  });

  // Get a single juror
  server.get('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      const juror = await server.prisma.juror.findFirst({
        where: {
          id,
          panel: {
            case: { organizationId },
          },
        },
        include: {
          researchArtifacts: true,
          personaMappings: {
            include: {
              persona: true,
            },
          },
          panel: {
            include: {
              case: true,
            },
          },
          candidates: {
            where: { isRejected: false },
            orderBy: { confidenceScore: 'desc' },
            include: {
              sources: true,
            },
          },
          searchJobs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!juror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      return { juror };
    },
  });

  // Create a new juror
  server.post('/', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const body = createJurorSchema.parse(request.body as any);

      // Verify panel belongs to organization
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: body.panelId,
          case: { organizationId },
        },
      });

      if (!panel) {
        reply.code(404);
        return { error: 'Jury panel not found' };
      }

      const juror = await server.prisma.juror.create({
        data: body,
      });

      reply.code(201);
      return { juror };
    },
  });

  // Update a juror
  server.patch('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const body = updateJurorSchema.parse(request.body as any);

      // Verify juror belongs to organization
      const existingJuror = await server.prisma.juror.findFirst({
        where: {
          id,
          panel: {
            case: { organizationId },
          },
        },
      });

      if (!existingJuror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      const juror = await server.prisma.juror.update({
        where: { id },
        data: body,
      });

      return { juror };
    },
  });

  // Delete a juror
  server.delete('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      // Verify juror belongs to organization
      const existingJuror = await server.prisma.juror.findFirst({
        where: {
          id,
          panel: {
            case: { organizationId },
          },
        },
      });

      if (!existingJuror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      await server.prisma.juror.delete({
        where: { id },
      });

      reply.code(204);
      return;
    },
  });

  // Add research artifact to juror
  server.post('/:id/research', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const { sourceType, sourceName, rawContent, sourceUrl, matchConfidence } = request.body as any;

      // Verify juror belongs to organization
      const existingJuror = await server.prisma.juror.findFirst({
        where: {
          id,
          panel: {
            case: { organizationId },
          },
        },
      });

      if (!existingJuror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      const artifact = await server.prisma.researchArtifact.create({
        data: {
          sourceType,
          sourceName,
          rawContent,
          sourceUrl,
          matchConfidence: matchConfidence || 0.5,
          retrievedAt: new Date(),
          jurorId: id,
        },
      });

      reply.code(201);
      return { artifact };
    },
  });

  // Map juror to persona
  server.post('/:id/persona-mapping', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;
      const { personaId, confidence, rationale, mappingType, source } = request.body as any;

      // Verify juror belongs to organization
      const existingJuror = await server.prisma.juror.findFirst({
        where: {
          id,
          panel: {
            case: { organizationId },
          },
        },
      });

      if (!existingJuror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      // Verify persona belongs to organization
      const persona = await server.prisma.persona.findFirst({
        where: {
          id: personaId,
          OR: [{ organizationId }, { sourceType: 'system' }],
        },
      });

      if (!persona) {
        reply.code(404);
        return { error: 'Persona not found' };
      }

      const mapping = await server.prisma.jurorPersonaMapping.create({
        data: {
          jurorId: id,
          personaId,
          mappingType: mappingType || 'primary',
          source: source || 'user_assigned',
          confidence: confidence || 0.5,
          rationale,
        },
        include: {
          persona: true,
        },
      });

      reply.code(201);
      return { mapping };
    },
  });

  // Search for juror identity matches
  server.post('/:id/search', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { id } = request.params as any;

      // Verify juror belongs to organization
      const juror = await server.prisma.juror.findFirst({
        where: {
          id,
          panel: {
            case: { organizationId },
          },
        },
      });

      if (!juror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      // Build search query
      const searchQuery = {
        firstName: juror.firstName,
        lastName: juror.lastName,
        fullName: `${juror.firstName} ${juror.lastName}`,
        age: juror.age || undefined,
        city: juror.city || undefined,
        zipCode: juror.zipCode || undefined,
        occupation: juror.occupation || undefined,
      };

      // Execute search
      const result = await searchOrchestrator.searchJuror(id, searchQuery);

      return result;
    },
  });

  // Confirm a candidate match
  server.post('/candidates/:candidateId/confirm', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { candidateId } = request.params as any;
      const { userId } = request.user as any;

      // Verify candidate's juror belongs to organization
      const candidate = await server.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          juror: {
            include: {
              panel: {
                include: { case: true },
              },
            },
          },
        },
      });

      if (!candidate || candidate.juror.panel.case.organizationId !== organizationId) {
        reply.code(404);
        return { error: 'Candidate not found' };
      }

      await searchOrchestrator.confirmCandidate(candidateId, userId);

      const updatedCandidate = await server.prisma.candidate.findUnique({
        where: { id: candidateId },
      });

      return { candidate: updatedCandidate };
    },
  });

  // Reject a candidate match
  server.post('/candidates/:candidateId/reject', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { candidateId } = request.params as any;
      const { userId } = request.user as any;

      // Verify candidate's juror belongs to organization
      const candidate = await server.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          juror: {
            include: {
              panel: {
                include: { case: true },
              },
            },
          },
        },
      });

      if (!candidate || candidate.juror.panel.case.organizationId !== organizationId) {
        reply.code(404);
        return { error: 'Candidate not found' };
      }

      await searchOrchestrator.rejectCandidate(candidateId, userId);

      const updatedCandidate = await server.prisma.candidate.findUnique({
        where: { id: candidateId },
      });

      return { candidate: updatedCandidate };
    },
  });

  // ============================================
  // BATCH IMPORT ROUTES
  // ============================================

  // Import jurors from CSV (Phase 3)
  server.post('/panel/:panelId/batch', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId, userId } = request.user as any;
      const { panelId } = request.params as any;
      const { csvContent, fileName, autoSearch, venueId, columnMapping } = request.body as any as any;

      // Verify panel belongs to organization
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: panelId,
          case: { organizationId },
        },
      });

      if (!panel) {
        reply.code(404);
        return { error: 'Jury panel not found' };
      }

      // Import jurors from CSV
      const { BatchImportService } = await import('../services/batch-import');
      const batchImportService = new BatchImportService(server.prisma, searchOrchestrator);

      try {
        const result = await batchImportService.importFromCSV({
          panelId,
          uploadedBy: userId,
          fileName: fileName || 'upload.csv',
          csvContent,
          autoSearch: autoSearch || false,
          venueId,
          columnMapping,
        });

        reply.code(201);
        return result;
      } catch (error) {
        console.error('[BatchImport] Import failed:', error);
        reply.code(400);
        return {
          error: 'Batch import failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });

  // Get batch import status
  server.get('/batch/:batchId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { batchId } = request.params as any;

      const batch = await server.prisma.batchImport.findFirst({
        where: {
          id: batchId,
          panel: {
            case: { organizationId },
          },
        },
        include: {
          panel: {
            select: {
              id: true,
              caseId: true,
              panelDate: true,
            },
          },
        },
      });

      if (!batch) {
        reply.code(404);
        return { error: 'Batch import not found' };
      }

      return { batch };
    },
  });

  // Get all batch imports for a panel
  server.get('/panel/:panelId/batches', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { panelId } = request.params as any;

      // Verify panel belongs to organization
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: panelId,
          case: { organizationId },
        },
      });

      if (!panel) {
        reply.code(404);
        return { error: 'Jury panel not found' };
      }

      const batches = await server.prisma.batchImport.findMany({
        where: { panelId },
        orderBy: { createdAt: 'desc' },
      });

      return { batches };
    },
  });
}
