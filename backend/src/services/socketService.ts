import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface AuthenticatedSocket extends SocketIOServer {
    userId?: string;
}

let io: SocketIOServer | null = null;

export const initializeSocket = (server: any) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true
        }
    });

    // Socket authentication middleware
    io.use((socket: any, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: any) => {
        console.log(`User ${socket.userId} connected to notifications`);

        // Join user to their personal notification room
        socket.join(`user_${socket.userId}`);

        // Handle ping for connection health
        socket.on('ping', () => {
            socket.emit('pong');
        });

        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected from notifications`);
        });
    });

    return io;
};

export const getSocketIO = (): SocketIOServer | null => {
    return io;
};

export const emitNotificationToUser = (userId: string, notification: any) => {
    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }

    console.log(`Emitting notification to user ${userId}`);
    io.to(`user_${userId}`).emit('new_notification', notification);
};

export const emitNotificationUpdate = (userId: string, notification: any) => {
    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }

    console.log(`Emitting notification update to user ${userId}`);
    io.to(`user_${userId}`).emit('notification_updated', notification);
};

export const emitNotificationDeleted = (userId: string, notificationId: string) => {
    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }

    console.log(`Emitting notification deletion to user ${userId}`);
    io.to(`user_${userId}`).emit('notification_deleted', { notificationId });
};