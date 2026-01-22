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
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
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
