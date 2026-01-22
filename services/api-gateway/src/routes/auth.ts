import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  organizationName: z.string().min(1).optional(),
});

export async function authRoutes(server: FastifyInstance) {
  // Login endpoint
  server.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // Find user by email
    const user = await server.prisma.user.findUnique({
      where: { email: body.email },
      include: { organization: true },
    });

    if (!user) {
      reply.code(401);
      return { error: 'Invalid credentials' };
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValidPassword) {
      reply.code(401);
      return { error: 'Invalid credentials' };
    }

    // Generate JWT token
    const token = server.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      },
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
    };
  });

  // Signup endpoint
  server.post('/signup', async (request, reply) => {
    const body = signupSchema.parse(request.body);

    // Check if user already exists
    const existingUser = await server.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      reply.code(409);
      return { error: 'User already exists' };
    }

    // Create organization if provided
    let organizationId: string;
    if (body.organizationName) {
      const organization = await server.prisma.organization.create({
        data: {
          name: body.organizationName,
          slug: body.organizationName.toLowerCase().replace(/\s+/g, '-'),
        },
      });
      organizationId = organization.id;
    } else {
      // For demo purposes, use a default organization
      // In production, this should require an organization
      const defaultOrg = await server.prisma.organization.findFirst();
      if (!defaultOrg) {
        reply.code(500);
        return { error: 'No default organization found' };
      }
      organizationId = defaultOrg.id;
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(body.password, 10);

    // Create user
    const user = await server.prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role: 'attorney',
        organizationId,
      },
      include: { organization: true },
    });

    // Generate JWT token
    const token = server.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      },
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
    };
  });

  // Get current user
  server.get('/me', {
    onRequest: [server.authenticate],
    handler: async (request: FastifyRequest<any>, reply: FastifyReply) => {
      const userId = (request.user as any).userId;

      const user = await server.prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });

      if (!user) {
        reply.code(404);
        return { error: 'User not found' };
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      };
    },
  });
}
