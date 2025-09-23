/// <reference path="./types/global.d.ts" />

import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import userRoutes from './routes/user.routes';
import { startScholarshipJobs } from './controllers/job/scholarshipJobs';
import { startExpiredScholarshipJob } from './jobs/expiredScholarshipJob';
import scholarRoutes from './routes/scholar.routes';
import applicationRoutes from './routes/application.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';
import rateLimit from 'express-rate-limit';
import { initializeSocket } from './services/socketService';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();


startScholarshipJobs();
startExpiredScholarshipJob();

app.use(helmet({
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));


app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));


if (NODE_ENV === 'production') {
    const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
}


// CORS configuration
const corsOrigins = NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS?.split(',') || [process.env.FRONTEND_URL || 'https://yourdomain.com'])
    : [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174' // Allow both development ports
    ];

app.use(cors({
    origin: corsOrigins,
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser()); // Parse cookies
app.use(express.json());

// Health check endpoint for Docker and monitoring
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0'
    });
});

// API routes
app.use('/users', userRoutes);
app.use('/scholar', scholarRoutes);
app.use('/applications', applicationRoutes);
app.use('/upload', uploadRoutes);
app.use('/notifications', notificationRoutes);

const server = http.createServer(app);

// Initialize Socket.IO with authentication
const io = initializeSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Socket.IO server initialized for real-time notifications');
});

