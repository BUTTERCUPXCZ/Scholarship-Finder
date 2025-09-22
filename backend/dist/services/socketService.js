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
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true
        }
    });
    // Socket authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
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
exports.initializeSocket = initializeSocket;
const getSocketIO = () => {
    return io;
};
exports.getSocketIO = getSocketIO;
const emitNotificationToUser = (userId, notification) => {
    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }
    console.log(`Emitting notification to user ${userId}`);
    io.to(`user_${userId}`).emit('new_notification', notification);
};
exports.emitNotificationToUser = emitNotificationToUser;
const emitNotificationUpdate = (userId, notification) => {
    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }
    console.log(`Emitting notification update to user ${userId}`);
    io.to(`user_${userId}`).emit('notification_updated', notification);
};
exports.emitNotificationUpdate = emitNotificationUpdate;
const emitNotificationDeleted = (userId, notificationId) => {
    if (!io) {
        console.warn('Socket.IO not initialized');
        return;
    }
    console.log(`Emitting notification deletion to user ${userId}`);
    io.to(`user_${userId}`).emit('notification_deleted', { notificationId });
};
exports.emitNotificationDeleted = emitNotificationDeleted;
