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


dotenv.config();

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string;
            JWT_SECRET: string;
            JWT_EXPIRES_IN?: string;
            DATABASE_URL?: string;
            FRONTEND_URL?: string;
            NODE_ENV?: "development" | "production" | "test";
        }
    }
}

const PORT = process.env.PORT || 3000;

const app = express();
startScholarshipJobs();
startExpiredScholarshipJob();
app.use(helmet());
app.use(morgan('combined'));


app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174' // Allow both development ports
    ],
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser()); // Parse cookies
app.use(express.json());

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

