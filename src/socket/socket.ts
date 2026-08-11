import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { env } from '@/config/env.js';
import { registerStudyGroupHandlers } from './study-group.socket.js';

let io: Server;

// Mirror the Express CORS logic: support wildcard OR comma-separated origins
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
const socketCorsOrigin =
  allowedOrigins.includes('*') || allowedOrigins[0] === '*'
    ? true
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      };

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: socketCorsOrigin, credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    registerStudyGroupHandlers(io, socket);
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
