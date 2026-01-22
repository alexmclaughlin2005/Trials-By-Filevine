import { Server, Socket } from 'socket.io';
import { CollaborationManager } from '../services/collaboration-manager';
import { PresenceTracker } from '../services/presence-tracker';
import {
  CollaborationEventType,
  JoinRoomSchema,
  TypingIndicatorSchema,
  UserPresence,
} from '../types/events';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    organizationId: string;
    userName: string;
    userEmail: string;
  };
}

export function setupSocketHandlers(
  io: Server,
  collaborationManager: CollaborationManager,
  presenceTracker: PresenceTracker
) {
  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // TODO: Verify JWT token and extract user info
      // For now, we'll extract from the token payload (you'll need to implement JWT verification)
      const decoded = extractUserFromToken(token);

      socket.data.userId = decoded.userId;
      socket.data.organizationId = decoded.organizationId;
      socket.data.userName = decoded.userName;
      socket.data.userEmail = decoded.userEmail;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const { userId, organizationId, userName, userEmail } = socket.data;

    console.log(`User connected: ${userId} (${userName})`);

    // Set user presence
    const presence: UserPresence = {
      userId,
      userName,
      userEmail,
      status: 'online',
      lastActive: new Date().toISOString(),
    };
    await presenceTracker.setUserPresence(userId, presence);

    // Join organization-wide room
    socket.join(`org:${organizationId}`);

    // Handle joining resource-specific rooms
    socket.on('join:room', async (data) => {
      try {
        const { resourceType, resourceId } = JoinRoomSchema.parse(data);
        const roomName = collaborationManager.getRoomName(resourceType, resourceId);

        socket.join(roomName);
        await presenceTracker.trackResourceView(userId, resourceType, resourceId);

        // Notify others in the room
        socket.to(roomName).emit('user:joined', {
          userId,
          userName,
          resourceType,
          resourceId,
          timestamp: new Date().toISOString(),
        });

        // Send current viewers to the joining user
        const viewers = await presenceTracker.getUsersViewingResource(resourceType, resourceId);
        socket.emit('room:viewers', {
          resourceType,
          resourceId,
          viewers,
        });

        console.log(`User ${userId} joined room: ${roomName}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving resource-specific rooms
    socket.on('leave:room', async (data) => {
      try {
        const { resourceType, resourceId } = JoinRoomSchema.parse(data);
        const roomName = collaborationManager.getRoomName(resourceType, resourceId);

        socket.leave(roomName);
        await presenceTracker.stopTrackingResourceView(userId, resourceType, resourceId);

        // Notify others in the room
        socket.to(roomName).emit('user:left', {
          userId,
          userName,
          resourceType,
          resourceId,
          timestamp: new Date().toISOString(),
        });

        console.log(`User ${userId} left room: ${roomName}`);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing:start', async (data) => {
      try {
        const validated = TypingIndicatorSchema.parse(data);
        await presenceTracker.setTypingIndicator(
          userId,
          validated.resourceType,
          validated.resourceId,
          true
        );
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });

    socket.on('typing:stop', async (data) => {
      try {
        const validated = TypingIndicatorSchema.parse(data);
        await presenceTracker.setTypingIndicator(
          userId,
          validated.resourceType,
          validated.resourceId,
          false
        );
      } catch (error) {
        console.error('Error handling typing indicator:', error);
      }
    });

    // Handle heartbeat for presence
    socket.on('heartbeat', async () => {
      await presenceTracker.updateLastActive(userId);
      socket.emit('heartbeat:ack');
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId} (${userName})`);

      // Update presence to offline
      presence.status = 'offline';
      presence.lastActive = new Date().toISOString();
      await presenceTracker.setUserPresence(userId, presence);

      // Cleanup presence data
      await presenceTracker.cleanupUserPresence(userId);

      // Notify organization
      io.to(`org:${organizationId}`).emit('user:disconnected', {
        userId,
        userName,
        timestamp: new Date().toISOString(),
      });
    });
  });
}

/**
 * Extract user info from JWT token
 * TODO: Implement proper JWT verification with @fastify/jwt
 */
function extractUserFromToken(token: string): {
  userId: string;
  organizationId: string;
  userName: string;
  userEmail: string;
} {
  // This is a placeholder - implement proper JWT verification
  // For development, you might decode the payload
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      userId: payload.userId || payload.sub || 'unknown',
      organizationId: payload.organizationId || payload.org_id || 'unknown',
      userName: payload.name || payload.userName || payload.email?.split('@')[0] || 'Anonymous',
      userEmail: payload.email || payload.userEmail || 'unknown@example.com',
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    throw new Error('Invalid token format');
  }
}
