"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
let PrismaClient;
let prismaClientAvailable = true;
try {
    const pkg = require('@prisma/client');
    PrismaClient = pkg.PrismaClient;
}
catch (err) {
    prismaClientAvailable = false;
    console.debug('Prisma client not available at require time:', err);
    PrismaClient = class {
        constructor() { }
        $connect() {
            return Promise.resolve();
        }
        $disconnect() {
            return Promise.resolve();
        }
    };
}
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        transactionOptions: {
            timeout: 30000,
            isolationLevel: 'ReadCommitted'
        }
    });
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
            delay *= 1.5;
        }
    }
}
if (process.env.NODE_ENV !== 'test' && prismaClientAvailable) {
    connectWithRetry().catch(error => {
        console.error('💥 Critical: Could not establish database connection:', error);
    });
}
const gracefulShutdown = async () => {
    console.log('🔄 Gracefully disconnecting from database...');
    await exports.prisma.$disconnect();
    console.log('✅ Database disconnected');
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
