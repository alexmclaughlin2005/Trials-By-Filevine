import { Server } from 'socket.io';
import Redis from 'ioredis';
import { UserPresence } from '../types/events';

export class PresenceTracker {
  private io: Server;
  private redis: Redis;
  private readonly PRESENCE_TTL = 300; // 5 minutes
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor(io: Server, redis: Redis) {
    this.io = io;
    this.redis = redis;
  }

  /**
   * Track user presence
   */
  async setUserPresence(userId: string, presence: UserPresence): Promise<void> {
    const key = `presence:${userId}`;
    await this.redis.setex(key, this.PRESENCE_TTL, JSON.stringify(presence));

    // Publish presence update
    await this.redis.publish('presence:updates', JSON.stringify({
      userId,
      presence,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    const key = `presence:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Track user viewing a resource
   */
  async trackResourceView(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    const key = `viewing:${resourceType}:${resourceId}`;
    await this.redis.sadd(key, userId);
    await this.redis.expire(key, this.PRESENCE_TTL);

    // Also track reverse mapping (user -> resources)
    const userKey = `user:viewing:${userId}`;
    await this.redis.sadd(userKey, `${resourceType}:${resourceId}`);
    await this.redis.expire(userKey, this.PRESENCE_TTL);
  }

  /**
   * Stop tracking user viewing a resource
   */
  async stopTrackingResourceView(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    const key = `viewing:${resourceType}:${resourceId}`;
    await this.redis.srem(key, userId);

    const userKey = `user:viewing:${userId}`;
    await this.redis.srem(userKey, `${resourceType}:${resourceId}`);
  }

  /**
   * Get all users viewing a resource
   */
  async getUsersViewingResource(
    resourceType: string,
    resourceId: string
  ): Promise<string[]> {
    const key = `viewing:${resourceType}:${resourceId}`;
    return await this.redis.smembers(key);
  }

  /**
   * Get all resources a user is viewing
   */
  async getResourcesUserIsViewing(userId: string): Promise<string[]> {
    const key = `user:viewing:${userId}`;
    return await this.redis.smembers(key);
  }

  /**
   * Track typing indicator
   */
  async setTypingIndicator(
    userId: string,
    resourceType: string,
    resourceId: string,
    isTyping: boolean
  ): Promise<void> {
    const key = `typing:${resourceType}:${resourceId}`;

    if (isTyping) {
      await this.redis.sadd(key, userId);
      await this.redis.expire(key, 10); // 10 seconds TTL
    } else {
      await this.redis.srem(key, userId);
    }

    // Broadcast to room
    const roomName = `${resourceType}:${resourceId}`;
    this.io.to(roomName).emit('typing:indicator', {
      userId,
      resourceType,
      resourceId,
      isTyping,
    });
  }

  /**
   * Get users currently typing in a resource
   */
  async getUsersTyping(resourceType: string, resourceId: string): Promise<string[]> {
    const key = `typing:${resourceType}:${resourceId}`;
    return await this.redis.smembers(key);
  }

  /**
   * Update user's last active timestamp
   */
  async updateLastActive(userId: string): Promise<void> {
    const key = `lastactive:${userId}`;
    const timestamp = new Date().toISOString();
    await this.redis.setex(key, this.PRESENCE_TTL, timestamp);
  }

  /**
   * Get user's last active timestamp
   */
  async getLastActive(userId: string): Promise<string | null> {
    const key = `lastactive:${userId}`;
    return await this.redis.get(key);
  }

  /**
   * Clean up user presence data
   */
  async cleanupUserPresence(userId: string): Promise<void> {
    // Remove from all resources they were viewing
    const resources = await this.getResourcesUserIsViewing(userId);
    for (const resource of resources) {
      const [resourceType, resourceId] = resource.split(':');
      await this.stopTrackingResourceView(userId, resourceType, resourceId);
    }

    // Remove presence data
    await this.redis.del(`presence:${userId}`);
    await this.redis.del(`user:viewing:${userId}`);
    await this.redis.del(`lastactive:${userId}`);
  }
}
