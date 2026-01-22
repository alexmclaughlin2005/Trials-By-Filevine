import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { JurorSynthesisService } from '../services/juror-synthesis';
import { PrismaClient } from '@juries/database';

const prisma = new PrismaClient();
const synthesisService = new JurorSynthesisService(prisma);

const synthesizeRequestSchema = z.object({
  case_context: z.object({
    case_type: z.string(),
    key_issues: z.array(z.string()),
    client_position: z.string(),
  }),
});

export async function synthesisRoutes(server: FastifyInstance) {
  // Start synthesis for a candidate
  server.post('/candidates/:candidateId/synthesize', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { candidateId } = request.params as any;
      const body = synthesizeRequestSchema.parse(request.body as any);

      // Verify candidate belongs to organization
      const candidate = await server.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          juror: {
            include: {
              panel: {
                include: {
                  case: true,
                },
              },
            },
          },
        },
      });

      if (!candidate || candidate.juror.panel.case.organizationId !== organizationId) {
        reply.code(404);
        return { error: 'Candidate not found' };
      }

      const caseId = candidate.juror.panel.case.id;

      try {
        const job = await synthesisService.startSynthesis({
          candidateId,
          caseId,
          caseContext: body.case_context,
        });

        reply.code(202);
        return {
          job_id: job.id,
          status: job.status,
        };
      } catch (error: any) {
        console.error('[Synthesis API] Failed to start synthesis:', error);
        reply.code(500);
        return {
          error: 'Failed to start synthesis',
          message: error.message,
        };
      }
    },
  });

  // Get synthesis status
  server.get('/candidates/:candidateId/synthesis', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { candidateId } = request.params as any;

      // Verify candidate belongs to organization
      const candidate = await server.prisma.candidate.findUnique({
        where: { id: candidateId },
        include: {
          juror: {
            include: {
              panel: {
                include: {
                  case: true,
                },
              },
            },
          },
        },
      });

      if (!candidate || candidate.juror.panel.case.organizationId !== organizationId) {
        reply.code(404);
        return { error: 'Candidate not found' };
      }

      const job = await synthesisService.getSynthesisStatus(candidateId);

      if (!job) {
        reply.code(404);
        return { error: 'No synthesis found for this candidate' };
      }

      return {
        job_id: job.id,
        status: job.status,
        profile_id: job.profileId,
        error: job.error,
      };
    },
  });

  // Get synthesized profile by ID
  server.get('/synthesis/:profileId', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const { organizationId } = request.user as any;
      const { profileId } = request.params as any;

      const profile = await server.prisma.synthesizedProfile.findUnique({
        where: { id: profileId },
        include: {
          candidate: {
            include: {
              juror: {
                include: {
                  panel: {
                    include: {
                      case: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!profile || profile.candidate.juror.panel.case.organizationId !== organizationId) {
        reply.code(404);
        return { error: 'Profile not found' };
      }

      return {
        id: profile.id,
        candidate_id: profile.candidateId,
        case_id: profile.caseId,
        status: profile.status,
        profile: profile.profile,
        data_richness: profile.dataRichness,
        confidence_overall: profile.confidenceOverall,
        concerns_count: profile.concernsCount,
        favorable_count: profile.favorableCount,
        model: profile.model,
        input_tokens: profile.inputTokens,
        output_tokens: profile.outputTokens,
        web_search_count: profile.webSearchCount,
        processing_time_ms: profile.processingTimeMs,
        created_at: profile.createdAt,
        error_message: profile.errorMessage,
      };
    },
  });
}
