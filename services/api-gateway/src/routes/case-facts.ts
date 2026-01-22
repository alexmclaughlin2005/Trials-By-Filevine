import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createFactSchema = z.object({
  content: z.string().min(1),
  factType: z.enum(['background', 'disputed', 'undisputed']),
  source: z.string().optional(),
});

const updateFactSchema = createFactSchema.partial();

export async function caseFactsRoutes(server: FastifyInstance) {
  // Create a fact
  server.post('/:caseId/facts', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId } = request.params;
      const body = createFactSchema.parse(request.body);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get current max sort order
      const maxSortOrder = await server.prisma.caseFact.findFirst({
        where: { caseId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      const fact = await server.prisma.caseFact.create({
        data: {
          ...body,
          caseId,
          sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
        },
      });

      reply.code(201);
      return { fact };
    },
  });

  // Update a fact
  server.put('/:caseId/facts/:factId', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId, factId } = request.params;
      const body = updateFactSchema.parse(request.body);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Verify fact belongs to case
      const existingFact = await server.prisma.caseFact.findFirst({
        where: { id: factId, caseId },
      });

      if (!existingFact) {
        reply.code(404);
        return { error: 'Fact not found' };
      }

      const fact = await server.prisma.caseFact.update({
        where: { id: factId },
        data: body,
      });

      return { fact };
    },
  });

  // Delete a fact
  server.delete('/:caseId/facts/:factId', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId, factId } = request.params;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Verify fact belongs to case
      const existingFact = await server.prisma.caseFact.findFirst({
        where: { id: factId, caseId },
      });

      if (!existingFact) {
        reply.code(404);
        return { error: 'Fact not found' };
      }

      await server.prisma.caseFact.delete({
        where: { id: factId },
      });

      reply.code(204);
      return;
    },
  });

  // Reorder facts
  server.patch('/:caseId/facts/reorder', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId } = request.params;
      const { factIds } = request.body as { factIds: string[] };

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Update sort order for each fact
      await Promise.all(
        factIds.map((factId, index) =>
          server.prisma.caseFact.updateMany({
            where: { id: factId, caseId },
            data: { sortOrder: index },
          })
        )
      );

      return { success: true };
    },
  });
}
