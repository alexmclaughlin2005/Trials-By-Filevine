import { Server } from 'socket.io';
import Redis from 'ioredis';
import { CollaborationEvent, CollaborationEventType } from '../types/events';

export class CollaborationManager {
  private io: Server;
  private redis: Redis;

  constructor(io: Server, redis: Redis) {
    this.io = io;
    this.redis = redis;
    this.setupPubSub();
  }

  private setupPubSub() {
    // Subscribe to collaboration events channel
    const subscriber = this.redis.duplicate();
    subscriber.subscribe('collaboration:events');

    subscriber.on('message', (channel, message) => {
      if (channel === 'collaboration:events') {
        const event: CollaborationEvent = JSON.parse(message);
        this.broadcastEvent(event);
      }
    });
  }

  /**
   * Publish a collaboration event to Redis
   */
  async publishEvent(event: CollaborationEvent): Promise<void> {
    await this.redis.publish('collaboration:events', JSON.stringify(event));
  }

  /**
   * Broadcast event to specific room (resource)
   */
  private broadcastEvent(event: CollaborationEvent): void {
    const roomName = this.getRoomName(event.resource.resourceType, event.resource.resourceId);
    this.io.to(roomName).emit('collaboration:event', event);
  }

  /**
   * Broadcast to organization-wide room
   */
  async broadcastToOrganization(organizationId: string, event: CollaborationEvent): Promise<void> {
    const roomName = `org:${organizationId}`;
    this.io.to(roomName).emit('collaboration:event', event);
    await this.publishEvent(event);
  }

  /**
   * Broadcast to specific resource room (case, juror, etc.)
   */
  async broadcastToResource(
    resourceType: string,
    resourceId: string,
    event: CollaborationEvent
  ): Promise<void> {
    const roomName = this.getRoomName(resourceType, resourceId);
    this.io.to(roomName).emit('collaboration:event', event);
    await this.publishEvent(event);
  }

  /**
   * Get active users in a resource
   */
  async getActiveUsers(resourceType: string, resourceId: string): Promise<string[]> {
    const roomName = this.getRoomName(resourceType, resourceId);
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.map((socket) => socket.data.userId).filter(Boolean);
  }

  /**
   * Get active sessions count for a resource
   */
  async getActiveSessionsCount(resourceType: string, resourceId: string): Promise<number> {
    const roomName = this.getRoomName(resourceType, resourceId);
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.length;
  }

  /**
   * Store collaboration session metadata
   */
  async storeSessionMetadata(
    sessionId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.setex(key, 3600, JSON.stringify(metadata)); // 1 hour TTL
  }

  /**
   * Get collaboration session metadata
   */
  async getSessionMetadata(sessionId: string): Promise<Record<string, any> | null> {
    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Generate standardized room name
   */
  getRoomName(resourceType: string, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }
}
