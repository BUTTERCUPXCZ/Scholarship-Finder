"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
// Enhanced Prisma configuration for better connectivity
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        transactionOptions: {
            timeout: 30000, // 30 seconds
            isolationLevel: 'ReadCommitted'
        }
    });
// Enhanced connection handling with retry logic
async function connectWithRetry(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            await exports.prisma.$connect();
            console.log('✅ Database connected successfully');
            return;
        }
        catch (error) {
            console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error);
            if (i === retries - 1) {
                console.error('💥 All database connection attempts failed');
                throw error;
            }
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5; // Exponential backoff
        }
    }
}
// Initialize connection with retry logic
connectWithRetry().catch(error => {
    console.error('💥 Critical: Could not establish database connection:', error);
    // Don't exit the process, let the app handle gracefully
});
// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🔄 Gracefully disconnecting from database...');
    await exports.prisma.$disconnect();
    console.log('✅ Database disconnected');
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);
// Prevent multiple instances in dev (hot-reloading)
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Optional: handle graceful shutdown
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
