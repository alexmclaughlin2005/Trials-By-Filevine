import { FastifyInstance } from 'fastify';
import { ResearchSummarizerService } from '../services/research-summarizer';

export async function researchRoutes(server: FastifyInstance) {
  // Summarize research artifacts for a juror
  server.post('/summarize', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { jurorId, artifactIds } = request.body;

      if (!jurorId) {
        reply.code(400);
        return { error: 'jurorId is required' };
      }

      // Verify juror belongs to organization
      const juror = await server.prisma.juror.findFirst({
        where: {
          id: jurorId,
          juryPanel: {
            case: { organizationId },
          },
        },
        include: {
          researchArtifacts: {
            where: artifactIds ? { id: { in: artifactIds } } : undefined,
          },
          juryPanel: {
            include: {
              case: true,
            },
          },
        },
      });

      if (!juror) {
        reply.code(404);
        return { error: 'Juror not found' };
      }

      if (juror.researchArtifacts.length === 0) {
        return {
          summaries: [],
          message: 'No research artifacts found for this juror',
        };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      // Mock response if no API key
      if (!apiKey) {
        const mockSummaries = juror.researchArtifacts.map((artifact) => ({
          artifactId: artifact.id,
          summary: `Mock summary for ${artifact.sourceType} artifact from ${artifact.sourceName}`,
          personaSignals: [
            {
              category: 'values',
              signal: 'Community-focused based on nonprofit involvement',
              confidence: 0.75,
              evidence: ['Active in local community organizations'],
              relevance: 'May prioritize community welfare over individual interests',
            },
          ],
          extractedSnippets: [
            {
              text: 'Sample relevant content from the artifact',
              context: 'Found in profile description',
              relevance: 'high' as const,
            },
          ],
          sentiment: 'positive' as const,
          keyThemes: ['community', 'professional development'],
          warnings: undefined,
        }));

        return { summaries: mockSummaries };
      }

      // Use AI service
      const summarizer = new ResearchSummarizerService(apiKey);

      const artifacts = juror.researchArtifacts.map((artifact) => ({
        id: artifact.id,
        artifactType: artifact.sourceType,
        source: artifact.sourceName || artifact.sourceType,
        content: artifact.rawContent || '',
        url: artifact.sourceUrl || undefined,
      }));

      const summaries = await summarizer.summarizeResearch({
        artifacts,
        jurorContext: {
          name: `${juror.firstName} ${juror.lastName}`,
          occupation: juror.occupation || undefined,
          age: juror.age || undefined,
        },
        caseContext: {
          caseType: juror.juryPanel.case.caseType || 'unknown',
          keyIssues: [],
        },
      });

      // Update research artifacts with extracted data
      for (const summary of summaries) {
        await server.prisma.researchArtifact.update({
          where: { id: summary.artifactId },
          data: {
            extractedSnippets: summary.extractedSnippets,
            signals: summary.personaSignals,
            matchRationale: summary.summary,
          },
        });
      }

      return { summaries };
    },
  });

  // Batch summarize all pending research artifacts
  server.post('/batch-summarize', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId } = request.body;

      if (!caseId) {
        reply.code(400);
        return { error: 'caseId is required' };
      }

      // Verify case belongs to organization
      const caseData = await server.prisma.case.findFirst({
        where: {
          id: caseId,
          organizationId,
        },
      });

      if (!caseData) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get all pending research artifacts for jurors in this case
      const pendingArtifacts = await server.prisma.researchArtifact.findMany({
        where: {
          userAction: 'pending',
          juror: {
            juryPanel: {
              caseId,
            },
          },
        },
        include: {
          juror: {
            include: {
              juryPanel: true,
            },
          },
        },
        take: 20, // Process max 20 at a time
      });

      if (pendingArtifacts.length === 0) {
        return {
          processed: 0,
          message: 'No pending research artifacts found',
        };
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        reply.code(500);
        return {
          error: 'ANTHROPIC_API_KEY not configured',
          message: 'AI analysis requires an Anthropic API key',
        };
      }

      const summarizer = new ResearchSummarizerService(apiKey);

      // Group by juror for context
      const byJuror = new Map<string, typeof pendingArtifacts>();
      for (const artifact of pendingArtifacts) {
        const jurorId = artifact.jurorId;
        if (!byJuror.has(jurorId)) {
          byJuror.set(jurorId, []);
        }
        byJuror.get(jurorId)!.push(artifact);
      }

      let processed = 0;

      for (const [jurorId, artifacts] of byJuror.entries()) {
        const juror = artifacts[0].juror;

        const summaries = await summarizer.summarizeResearch({
          artifacts: artifacts.map((a) => ({
            id: a.id,
            artifactType: a.sourceType,
            source: a.sourceName || a.sourceType,
            content: a.rawContent || '',
            url: a.sourceUrl || undefined,
          })),
          jurorContext: {
            name: `${juror.firstName} ${juror.lastName}`,
            occupation: juror.occupation || undefined,
            age: juror.age || undefined,
          },
          caseContext: {
            caseType: caseData.caseType || 'unknown',
            keyIssues: [],
          },
        });

        // Update artifacts with extracted data
        for (const summary of summaries) {
          await server.prisma.researchArtifact.update({
            where: { id: summary.artifactId },
            data: {
              extractedSnippets: summary.extractedSnippets,
              signals: summary.personaSignals,
              matchRationale: summary.summary,
              userAction: 'pending_review', // Change status to indicate AI processing complete
            },
          });
          processed++;
        }
      }

      return {
        processed,
        message: `Successfully processed ${processed} research artifacts`,
      };
    },
  });
}
