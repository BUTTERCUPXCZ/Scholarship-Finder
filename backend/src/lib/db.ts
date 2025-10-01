import type { PrismaClient as PrismaClientType } from '@prisma/client'
import { PrismaClient as PrismaClientClass } from '@prisma/client'

type PrismaClientConstructor = new (...args: unknown[]) => PrismaClientType

// Assign synchronously using a static import (package is a project dependency)
const PrismaClient: PrismaClientConstructor = PrismaClientClass as unknown as PrismaClientConstructor
const prismaClientAvailable = true

const globalForPrisma = globalThis as unknown as {
    prisma: InstanceType<typeof PrismaClient> | undefined
}

// Enhanced Prisma configuration for better connectivity
// Build Prisma client options dynamically so we don't pass `undefined`
// for the datasource URL (Prisma throws if url is undefined).

type IsolationLevel = 'ReadCommitted' | 'RepeatableRead' | 'Serializable' | 'ReadUncommitted'

interface LocalTransactionOptions {
    timeout?: number
    isolationLevel?: IsolationLevel
}

interface LocalPrismaOptions {
    log?: Array<'query' | 'info' | 'warn' | 'error'>
    transactionOptions?: LocalTransactionOptions
    datasources?: Record<string, { url?: string }>
    // custom helper used in this module
    datasourceUrl?: string
    [key: string]: unknown
}

const prismaOptions: LocalPrismaOptions = {
    log:
        process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    transactionOptions: {
        timeout: 30000, // 30 seconds
        isolationLevel: 'ReadCommitted'
    }
}

// Enhanced connection pool settings via URL parameters
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);

    // Add connection pool parameters if not already present
    if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '50');
    }
    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30');
    }
    if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '30');
    }
    if (!url.searchParams.has('socket_timeout')) {
        url.searchParams.set('socket_timeout', '30');
    }

    prismaOptions.datasourceUrl = url.toString();
}

// Use datasourceUrl if configured, otherwise fall back to datasources
if (!prismaOptions.datasourceUrl && process.env.DATABASE_URL) {
    // Only attach datasources if DATABASE_URL is set and datasourceUrl wasn't already configured.
    // This prevents PrismaClientConstructorValidationError  test runs
    // where DATABASE_URL may intentionally be unset.
    prismaOptions.datasources = {
        db: { url: process.env.DATABASE_URL }
    }
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient(prismaOptions)

// Enhanced connection handling with retry logic
async function connectWithRetry(retries = 5, delay = 2000): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await prisma.$connect()
            console.log('✅ Database connected successfully')
            return
        } catch (error) {
            console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error)

            if (i === retries - 1) {
                console.error('💥 All database connection attempts failed')
                throw error
            }

            console.log(`⏳ Retrying in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            delay *= 1.5 // Exponential backoff
        }
    }
}

// ✅ Only connect if not running tests and if Prisma client is available
if (process.env.NODE_ENV !== 'test' && prismaClientAvailable) {
    connectWithRetry().catch(error => {
        console.error('💥 Critical: Could not establish database connection:', error)
        // Don't exit the process, let the app handle gracefully
    })
}

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🔄 Gracefully disconnecting from database...')
    await prisma.$disconnect()
    console.log('✅ Database disconnected')
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
process.on('beforeExit', gracefulShutdown)

// Prevent multiple instances in dev (hot-reloading)
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// Optional: handle graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect()
})
