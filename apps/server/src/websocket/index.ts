import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../middleware/auth.js';
import { env } from '../config/env.js';
import type { ServerToClientEvents, ClientToServerEvents, JWTPayload } from '../types/index.js';

// Extended socket with user data
interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  user?: JWTPayload;
}

// Store active connections by user ID
const userConnections = new Map<string, Set<string>>();

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, 'http://localhost:3000'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.user = payload;
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user!.user_id;
    console.log(`WebSocket connected: ${userId}`);

    // Track connection
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socket.id);

    // Join user's room
    socket.join(`user:${userId}`);

    // Handle subscription to user updates
    socket.on('subscribe:user', (targetUserId: string) => {
      // Only allow subscribing to own updates (for now)
      if (targetUserId === userId) {
        socket.join(`user:${targetUserId}`);
      }
    });

    socket.on('unsubscribe:user', (targetUserId: string) => {
      socket.leave(`user:${targetUserId}`);
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket disconnected: ${userId}`);

      const connections = userConnections.get(userId);
      if (connections) {
        connections.delete(socket.id);
        if (connections.size === 0) {
          userConnections.delete(userId);
        }
      }
    });
  });

  return io;
}

// Helper to emit events to a specific user
export function emitToUser(
  io: SocketIOServer,
  userId: string,
  event: keyof ServerToClientEvents,
  data: any
): void {
  io.to(`user:${userId}`).emit(event, data);
}

// Helper to check if user is online
export function isUserOnline(userId: string): boolean {
  return userConnections.has(userId) && userConnections.get(userId)!.size > 0;
}

// Helper to get online user count
export function getOnlineUserCount(): number {
  return userConnections.size;
}
