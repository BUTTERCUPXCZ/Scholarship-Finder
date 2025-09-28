"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNotificationDeleted = exports.emitNotificationUpdate = exports.emitNotificationToUser = exports.getSocketIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let io = null;
const initializeSocket = (server) => {
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
    ].filter(Boolean);
    io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.includes(origin))
                    return callback(null, true);
                console.warn(`🚫 Socket.IO CORS blocked origin: ${origin}`);
                return callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const getHeaderValue = (headers, key) => {
            if (typeof headers === 'object' && headers !== null) {
                const val = headers[key];
                return typeof val === 'string' ? val : undefined;
            }
            return undefined;
        };
        try {
            const token = socket.handshake.auth?.token ||
                getHeaderValue(socket.handshake.headers, 'authorization')?.replace('Bearer ', '') ||
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
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
                console.log('❌ Socket auth failed: Invalid token payload');
                return next(new Error('Authentication error: Invalid token'));
            }
            socket.data.userId = decoded.userId;
            console.log(`✅ Socket authenticated: user ${decoded.userId}`);
            next();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.log('❌ Socket auth failed:', message);
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`🔌 User ${socket.data.userId} connected`);
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
exports.initializeSocket = initializeSocket;
const getSocketIO = () => io;
exports.getSocketIO = getSocketIO;
const emitNotificationToUser = (userId, notification) => {
    if (!io)
        return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit new notification → user ${userId}`);
    io.to(`user_${userId}`).emit('new_notification', notification);
};
exports.emitNotificationToUser = emitNotificationToUser;
const emitNotificationUpdate = (userId, notification) => {
    if (!io)
        return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit notification update → user ${userId}`);
    io.to(`user_${userId}`).emit('notification_updated', notification);
};
exports.emitNotificationUpdate = emitNotificationUpdate;
const emitNotificationDeleted = (userId, notificationId) => {
    if (!io)
        return console.warn('⚠️ Socket.IO not initialized');
    console.log(`📢 Emit notification deletion → user ${userId}`);
    io.to(`user_${userId}`).emit('notification_deleted', { notificationId });
};
exports.emitNotificationDeleted = emitNotificationDeleted;
