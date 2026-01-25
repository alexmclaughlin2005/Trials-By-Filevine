import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || !socket.connected) {
    const url = process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL || 'http://localhost:3003';

    // Don't attempt connection if URL is not configured in production
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL) {
      console.warn('Collaboration service URL not configured, skipping Socket.IO connection');
      // Return a mock socket that won't try to connect
      return {
        connected: false,
        on: () => {},
        emit: () => {},
        off: () => {},
        disconnect: () => {},
      } as any;
    }

    socket = io(url, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    // Error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('connect_timeout', () => {
      console.error('Socket connection timeout');
    });

    // Heartbeat to keep connection alive
    setInterval(() => {
      if (socket?.connected) {
        socket.emit('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, 30000);
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
