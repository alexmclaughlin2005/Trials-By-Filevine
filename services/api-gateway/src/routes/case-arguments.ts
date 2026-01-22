import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

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

export async function caseArgumentsRoutes(server: FastifyInstance) {
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
}
