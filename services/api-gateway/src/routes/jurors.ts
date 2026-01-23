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
  status: z.string().optional(),
  boxRow: z.number().int().positive().nullable().optional(),
  boxSeat: z.number().int().positive().nullable().optional(),
  boxOrder: z.number().int().positive().nullable().optional(),
});

const updateJurorSchema = createJurorSchema.partial().omit({ panelId: true });

const updateJurorPositionSchema = z.object({
  boxRow: z.number().int().positive().optional().nullable(),
  boxSeat: z.number().int().positive().optional().nullable(),
  boxOrder: z.number().int().positive().optional().nullable(),
});

const updateJuryBoxConfigSchema = z.object({
  juryBoxSize: z.number().int().positive().min(1).max(20).optional(),
  juryBoxRows: z.number().int().positive().min(1).max(2).optional(),
  juryBoxLayout: z.record(z.any()).optional(),
});

export async function jurorsRoutes(server: FastifyInstance) {
  // Get all jurors for a jury panel
  server.get('/panel/:panelId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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

      // If status is changed to struck, remove from box
      if (body.status && (body.status === 'struck_for_cause' || body.status === 'peremptory_strike')) {
        body.boxRow = null;
        body.boxSeat = null;
        body.boxOrder = null;
      }

      const juror = await server.prisma.juror.update({
        where: { id },
        data: body,
      });

      // If juror was struck and auto-fill is enabled, trigger auto-fill
      // Note: Auto-fill logic would need to be configured per panel
      // For now, we'll just return the updated juror

      return { juror };
    },
  });

  // Delete a juror
  server.delete('/:id', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
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

  // ============================================
  // JURY BOX ROUTES
  // ============================================

  // Get jury box state for a panel
  server.get('/panel/:panelId/jury-box', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { panelId } = request.params as any;

      // Verify panel belongs to organization
      const panel = await server.prisma.juryPanel.findFirst({
        where: {
          id: panelId,
          case: { organizationId },
        },
        include: {
          jurors: {
            orderBy: [
              { boxRow: 'asc' },
              { boxSeat: 'asc' },
              { boxOrder: 'asc' },
            ],
          },
        },
      });

      if (!panel) {
        reply.code(404);
        return { error: 'Jury panel not found' };
      }

      // Separate jurors into box positions and pool
      const jurorsInBox = panel.jurors.filter(
        (j) => j.boxRow !== null && j.boxSeat !== null
      );
      const jurorsInPool = panel.jurors.filter(
        (j) => j.boxRow === null || j.boxSeat === null
      );

      // Sort pool by juror number or creation date
      jurorsInPool.sort((a, b) => {
        if (a.jurorNumber && b.jurorNumber) {
          return a.jurorNumber.localeCompare(b.jurorNumber);
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return {
        panel: {
          id: panel.id,
          juryBoxSize: panel.juryBoxSize,
          juryBoxRows: panel.juryBoxRows,
          juryBoxLayout: panel.juryBoxLayout,
        },
        jurorsInBox,
        jurorsInPool,
      };
    },
  });

  // Update jury box configuration
  server.put('/panel/:panelId/jury-box/config', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { panelId } = request.params as any;
      const body = updateJuryBoxConfigSchema.parse(request.body as any);

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

      // If box size is reduced, remove jurors from positions that exceed the new size
      if (body.juryBoxSize && body.juryBoxSize < panel.juryBoxSize) {
        const seatsPerRow = Math.ceil(body.juryBoxSize / (body.juryBoxRows || panel.juryBoxRows));
        
        await server.prisma.juror.updateMany({
          where: {
            panelId,
            OR: [
              { boxSeat: { gt: seatsPerRow } },
              { boxRow: { gt: (body.juryBoxRows || panel.juryBoxRows) } },
            ],
          },
          data: {
            boxRow: null,
            boxSeat: null,
            boxOrder: null,
          },
        });
      }

      const updatedPanel = await server.prisma.juryPanel.update({
        where: { id: panelId },
        data: body,
      });

      return { panel: updatedPanel };
    },
  });

  // Update juror position in jury box
  server.put('/:jurorId/position', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { jurorId } = request.params as any;
      const body = updateJurorPositionSchema.parse(request.body as any);

      // Verify juror belongs to organization
      const existingJuror = await server.prisma.juror.findFirst({
        where: {
          id: jurorId,
          panel: {
            case: { organizationId },
          },
        },
        include: {
          panel: true,
        },
      });

      if (!existingJuror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      // Validate position against box size
      if (body.boxRow !== null && body.boxRow !== undefined) {
        const seatsPerRow = Math.ceil(
          existingJuror.panel.juryBoxSize / existingJuror.panel.juryBoxRows
        );
        
        if (body.boxRow > existingJuror.panel.juryBoxRows) {
          reply.code(400);
          return { error: `Box row exceeds maximum rows (${existingJuror.panel.juryBoxRows})` };
        }
        
        if (body.boxSeat !== null && body.boxSeat !== undefined && body.boxSeat > seatsPerRow) {
          reply.code(400);
          return { error: `Box seat exceeds maximum seats per row (${seatsPerRow})` };
        }
      }

      // If moving to a position, check if position is already occupied
      if (body.boxRow !== null && body.boxSeat !== null) {
        const existingOccupant = await server.prisma.juror.findFirst({
          where: {
            panelId: existingJuror.panelId,
            boxRow: body.boxRow,
            boxSeat: body.boxSeat,
            id: { not: jurorId },
          },
        });

        if (existingOccupant) {
          reply.code(409);
          return { error: 'Position already occupied' };
        }
      }

      const updatedJuror = await server.prisma.juror.update({
        where: { id: jurorId },
        data: body,
      });

      return { juror: updatedJuror };
    },
  });

  // Auto-fill empty positions in jury box
  server.put('/panel/:panelId/jury-box/auto-fill', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<{ Params: { panelId: string } }>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { panelId } = request.params;
      
      try {
        console.log('[Auto-fill] Request received:', { 
          panelId,
          method: request.method,
          url: request.url,
        });

        
        if (!panelId) {
          reply.code(400);
          return { error: 'Panel ID is required' };
        }

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

        // Get all jurors (excluding struck/dismissed)
        const allJurors = await server.prisma.juror.findMany({
          where: {
            panelId,
            status: {
              notIn: ['struck_for_cause', 'peremptory_strike', 'dismissed'],
            },
          },
          orderBy: [
            { jurorNumber: 'asc' },
            { createdAt: 'asc' },
          ],
        });

        // Get occupied positions
        const occupiedPositions = new Set<string>();
        allJurors.forEach((juror) => {
          if (juror.boxRow !== null && juror.boxSeat !== null) {
            occupiedPositions.add(`${juror.boxRow}-${juror.boxSeat}`);
          }
        });

        // Get available jurors (not in box)
        const availableJurors = allJurors.filter(
          (j) => j.boxRow === null || j.boxSeat === null
        );

        if (availableJurors.length === 0) {
          return { 
            message: 'No available jurors to fill positions',
            jurors: allJurors,
          };
        }

        // Calculate seats per row
        const seatsPerRow = Math.ceil(panel.juryBoxSize / panel.juryBoxRows);
        let availableIndex = 0;
        const updates: Array<{ id: string; boxRow: number; boxSeat: number; boxOrder: number }> = [];

        // Fill empty positions (only up to juryBoxSize)
        for (let row = 1; row <= panel.juryBoxRows; row++) {
          for (let seat = 1; seat <= seatsPerRow; seat++) {
            // Stop if we've filled all available seats or run out of jurors
            if (updates.length >= panel.juryBoxSize || availableIndex >= availableJurors.length) {
              break;
            }

            const positionKey = `${row}-${seat}`;
            
            if (!occupiedPositions.has(positionKey) && availableIndex < availableJurors.length) {
              const juror = availableJurors[availableIndex];
              const boxOrder = (row - 1) * seatsPerRow + seat;
              
              // Only fill positions within the jury box size
              if (boxOrder <= panel.juryBoxSize) {
                updates.push({
                  id: juror.id,
                  boxRow: row,
                  boxSeat: seat,
                  boxOrder,
                });
                
                availableIndex++;
              }
            }
          }
          
          // Break outer loop if we've filled all available seats
          if (updates.length >= panel.juryBoxSize || availableIndex >= availableJurors.length) {
            break;
          }
        }

        // Apply updates
        if (updates.length > 0) {
          await Promise.all(
            updates.map((update) =>
              server.prisma.juror.update({
                where: { id: update.id },
                data: {
                  boxRow: update.boxRow,
                  boxSeat: update.boxSeat,
                  boxOrder: update.boxOrder,
                  status: 'seated',
                },
              })
            )
          );
        }

        // Get updated jurors
        const updatedJurors = await server.prisma.juror.findMany({
          where: { panelId },
          orderBy: [
            { boxRow: 'asc' },
            { boxSeat: 'asc' },
          ],
        });

        return { 
          message: `Filled ${updates.length} position(s)`,
          jurors: updatedJurors,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('[Auto-fill] Error caught:', error);
        console.error('[Auto-fill] Error message:', errorMessage);
        console.error('[Auto-fill] Error stack:', errorStack);
        console.error('[Auto-fill] Panel ID:', panelId);
        reply.code(400);
        const errorResponse: { error: string; details: string; stack?: string } = { 
          error: 'Failed to auto-fill positions',
          details: errorMessage,
        };
        if (process.env.NODE_ENV === 'development' && errorStack) {
          errorResponse.stack = errorStack;
        }
        return errorResponse;
      }
    },
  });
}
