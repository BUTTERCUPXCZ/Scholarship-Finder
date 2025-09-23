import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

let io: SocketIOServer | null = null;

export const initializeSocket = (server: any) => {
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
    io.use((socket: any, next) => {
        try {
            const token =
                socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.replace('Bearer ', '') ||
                socket.handshake.headers.cookie
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

            const decoded = jwt.verify(token, secret) as any;
            (socket as any).userId = decoded.userId;
            console.log(`✅ Socket authenticated: user ${decoded.userId}`);
            next();
        } catch (err: any) {
            console.log('❌ Socket auth failed:', err.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: any) => {
        console.log(`🔌 User ${socket.userId} connected`);

        // Join personal notification room
        socket.join(`user_${socket.userId}`);

        socket.on('ping', () => {
            socket.emit('pong');
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User ${socket.userId} disconnected`);
        });
    });

    return io;
};

export const getSocketIO = (): SocketIOServer | null => io;

export const emitNotificationToUser = (userId: string, notification: any) => {
    if (!io) return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit new notification → user ${userId}`);
    io.to(`user_${userId}`).emit('new_notification', notification);
};

export const emitNotificationUpdate = (userId: string, notification: any) => {
    if (!io) return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit notification update → user ${userId}`);
    io.to(`user_${userId}`).emit('notification_updated', notification);
};

export const emitNotificationDeleted = (userId: string, notificationId: string) => {
    if (!io) return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit notification deletion → user ${userId}`);
    io.to(`user_${userId}`).emit('notification_deleted', { notificationId });
};
