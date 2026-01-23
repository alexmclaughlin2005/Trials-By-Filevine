'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket-client';

interface UserPresence {
  userId: string;
  userName?: string;
  resourceType: string;
  resourceId: string;
  lastActive: string;
}

interface CollaborationContextValue {
  socket: Socket | null;
  isConnected: boolean;
  activeViewers: UserPresence[];
  joinRoom: (resourceType: string, resourceId: string) => void;
  leaveRoom: (resourceType: string, resourceId: string) => void;
  startTyping: (resourceType: string, resourceId: string) => void;
  stopTyping: (resourceType: string, resourceId: string) => void;
  onCollaborationEvent: (event: string, handler: (data: unknown) => void) => void;
}

const CollaborationContext = createContext<CollaborationContextValue | undefined>(undefined);

interface CollaborationProviderProps {
  children: React.ReactNode;
  token: string | null;
  userId?: string;
  organizationId?: string;
}

export function CollaborationProvider({
  children,
  token,
  userId,
  organizationId,
}: CollaborationProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeViewers, setActiveViewers] = useState<UserPresence[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      return;
    }

    const newSocket = getSocket(token);
    setSocket(newSocket);

    // Connection status handlers
    const handleConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setActiveViewers([]);
    };

    const handleConnectError = (error: Error) => {
      console.warn('Collaboration service unavailable:', error.message);
      // Silently fail - collaboration features just won't be available
      setIsConnected(false);
    };

    // Collaboration event handlers
    const handleUserJoined = (data: UserPresence) => {
      console.log('User joined:', data);
      setActiveViewers((prev) => {
        // Don't add duplicates
        if (prev.some((v) => v.userId === data.userId && v.resourceId === data.resourceId)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    const handleUserLeft = (data: { userId: string; resourceType: string; resourceId: string }) => {
      console.log('User left:', data);
      setActiveViewers((prev) =>
        prev.filter((v) => !(v.userId === data.userId && v.resourceId === data.resourceId))
      );
    };

    const handleRoomViewers = (data: { viewers: UserPresence[] }) => {
      console.log('Room viewers:', data);
      setActiveViewers(data.viewers);
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('disconnect', handleDisconnect);
    newSocket.on('connect_error', handleConnectError);
    newSocket.on('user:joined', handleUserJoined);
    newSocket.on('user:left', handleUserLeft);
    newSocket.on('room:viewers', handleRoomViewers);

    // Check if already connected
    if (newSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('disconnect', handleDisconnect);
      newSocket.off('connect_error', handleConnectError);
      newSocket.off('user:joined', handleUserJoined);
      newSocket.off('user:left', handleUserLeft);
      newSocket.off('room:viewers', handleRoomViewers);
    };
  }, [token]);

  const joinRoom = useCallback(
    (resourceType: string, resourceId: string) => {
      if (socket && isConnected) {
        console.log('Joining room:', { resourceType, resourceId });
        socket.emit('join:room', {
          resourceType,
          resourceId,
          userId,
          organizationId,
        });
      }
    },
    [socket, isConnected, userId, organizationId]
  );

  const leaveRoom = useCallback(
    (resourceType: string, resourceId: string) => {
      if (socket && isConnected) {
        console.log('Leaving room:', { resourceType, resourceId });
        socket.emit('leave:room', {
          resourceType,
          resourceId,
        });
      }
    },
    [socket, isConnected]
  );

  const startTyping = useCallback(
    (resourceType: string, resourceId: string) => {
      if (socket && isConnected) {
        socket.emit('typing:start', {
          resourceType,
          resourceId,
        });
      }
    },
    [socket, isConnected]
  );

  const stopTyping = useCallback(
    (resourceType: string, resourceId: string) => {
      if (socket && isConnected) {
        socket.emit('typing:stop', {
          resourceType,
          resourceId,
        });
      }
    },
    [socket, isConnected]
  );

  const onCollaborationEvent = useCallback(
    (event: string, handler: (data: unknown) => void) => {
      if (socket) {
        socket.on(event, handler);
        return () => {
          socket.off(event, handler);
        };
      }
    },
    [socket]
  );

  const value: CollaborationContextValue = {
    socket,
    isConnected,
    activeViewers,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    onCollaborationEvent,
  };

  return <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>;
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}
