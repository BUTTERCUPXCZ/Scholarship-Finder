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
import scholarRoutes from './routes/scholar.routes'


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
app.use(helmet());
app.use(morgan('combined'));

// CORS configuration to allow credentials (cookies)
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174' // Allow both development ports
    ],
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser()); // Parse cookies
app.use(express.json());

app.use('/users', userRoutes);
app.use('/scholar', scholarRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

