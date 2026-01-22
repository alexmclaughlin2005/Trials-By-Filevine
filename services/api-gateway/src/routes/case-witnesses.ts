import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createWitnessSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['fact', 'expert', 'character']),
  affiliation: z.enum(['plaintiff', 'defendant', 'neutral']),
  summary: z.string().optional(),
  directOutline: z.string().optional(),
  crossOutline: z.string().optional(),
});

const updateWitnessSchema = createWitnessSchema.partial();

export async function caseWitnessesRoutes(server: FastifyInstance) {
  // Create a witness
  server.post('/:caseId/witnesses', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId } = request.params;
      const body = createWitnessSchema.parse(request.body);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Get current max sort order
      const maxSortOrder = await server.prisma.caseWitness.findFirst({
        where: { caseId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      const witness = await server.prisma.caseWitness.create({
        data: {
          ...body,
          caseId,
          sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
        },
      });

      reply.code(201);
      return { witness };
    },
  });

  // Update a witness
  server.put('/:caseId/witnesses/:witnessId', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId, witnessId } = request.params;
      const body = updateWitnessSchema.parse(request.body);

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Verify witness belongs to case
      const existingWitness = await server.prisma.caseWitness.findFirst({
        where: { id: witnessId, caseId },
      });

      if (!existingWitness) {
        reply.code(404);
        return { error: 'Witness not found' };
      }

      const witness = await server.prisma.caseWitness.update({
        where: { id: witnessId },
        data: body,
      });

      return { witness };
    },
  });

  // Delete a witness
  server.delete('/:caseId/witnesses/:witnessId', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId, witnessId } = request.params;

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Verify witness belongs to case
      const existingWitness = await server.prisma.caseWitness.findFirst({
        where: { id: witnessId, caseId },
      });

      if (!existingWitness) {
        reply.code(404);
        return { error: 'Witness not found' };
      }

      await server.prisma.caseWitness.delete({
        where: { id: witnessId },
      });

      reply.code(204);
      return;
    },
  });

  // Reorder witnesses
  server.patch('/:caseId/witnesses/reorder', {
    onRequest: [server.authenticate],
    handler: async (request: any, reply) => {
      const { organizationId } = request.user;
      const { caseId } = request.params;
      const { witnessIds } = request.body as { witnessIds: string[] };

      // Verify case belongs to organization
      const existingCase = await server.prisma.case.findFirst({
        where: { id: caseId, organizationId },
      });

      if (!existingCase) {
        reply.code(404);
        return { error: 'Case not found' };
      }

      // Update sort order for each witness
      await Promise.all(
        witnessIds.map((witnessId, index) =>
          server.prisma.caseWitness.updateMany({
            where: { id: witnessId, caseId },
            data: { sortOrder: index },
          })
        )
      );

      return { success: true };
    },
  });
}
