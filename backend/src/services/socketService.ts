import { Server as SocketIOServer, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { Server as HTTPServer } from 'http';

dotenv.config();

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
    ].filter(Boolean);

    io = new SocketIOServer(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true); // allow no-origin (mobile, curl)
                if (allowedOrigins.includes(origin)) return callback(null, true);
                console.warn(`🚫 Socket.IO CORS blocked origin: ${origin}`);
                return callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
        },
    });

    // 🔐 Authentication middleware
    io.use((socket: Socket, next: (err?: Error) => void) => {
        const getHeaderValue = (headers: unknown, key: string): string | undefined => {
            if (typeof headers === 'object' && headers !== null) {
                const val = (headers as Record<string, unknown>)[key];
                return typeof val === 'string' ? val : undefined;
            }
            return undefined;
        };
        try {
            const token =
                // prefer handshake auth token
                socket.handshake.auth?.token ||
                // fallback to authorization header
                getHeaderValue(socket.handshake.headers, 'authorization')?.replace('Bearer ', '') ||
                // fallback to cookie parsing (best-effort)
                getHeaderValue(socket.handshake.headers, 'cookie')
                    ?.split('authToken=')[1]
                    ?.split(';')[0];

            if (!token) {
                console.log('❌ Socket auth failed: No token provided');
                return next(new Error('Authentication error: No token provided'));
            }

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error('❌ JWT_SECRET not configured');
                return next(new Error('Server configuration error'));
            }

            const decoded = jwt.verify(token, secret) as { userId?: string } | undefined;
            if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
                console.log('❌ Socket auth failed: Invalid token payload');
                return next(new Error('Authentication error: Invalid token'));
            }

            // store userId in socket.data (typed) rather than attaching arbitrary props
            socket.data.userId = decoded.userId;
            console.log(`✅ Socket authenticated: user ${decoded.userId}`);
            next();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.log('❌ Socket auth failed:', message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 User ${socket.data.userId} connected`);

        // Join personal notification room
        socket.join(`user_${socket.data.userId}`);

        socket.on('ping', () => {
            socket.emit('pong');
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User ${socket.data.userId} disconnected`);
        });
    });

    return io;
};

export const getSocketIO = (): SocketIOServer | null => io;

export const emitNotificationToUser = (userId: string, notification: unknown) => {
    if (!io) return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit new notification → user ${userId}`);
    io.to(`user_${userId}`).emit('new_notification', notification);
};

export const emitNotificationUpdate = (userId: string, notification: unknown) => {
    if (!io) return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit notification update → user ${userId}`);
    io.to(`user_${userId}`).emit('notification_updated', notification);
};

export const emitNotificationDeleted = (userId: string, notificationId: string) => {
    if (!io) return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit notification deletion → user ${userId}`);
    io.to(`user_${userId}`).emit('notification_deleted', { notificationId });
};
