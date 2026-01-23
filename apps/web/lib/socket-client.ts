import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || !socket.connected) {
    const url = process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL || 'http://localhost:3003';

    socket = io(url, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3, // Reduced from 5 to 3
      timeout: 5000, // Add connection timeout
    });

    // Heartbeat to keep connection alive
    setInterval(() => {
      if (socket?.connected) {
        socket.emit('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, 30000); // Every 30 seconds
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
