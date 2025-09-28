import type { PrismaClient as PrismaClientType } from '@prisma/client'

type PrismaClientConstructor = new (...args: unknown[]) => PrismaClientType

let PrismaClient: PrismaClientConstructor
let prismaClientAvailable = true

try {
    // Try to require the generated Prisma client at runtime. In test
    // environments where `prisma generate` hasn't been run the require may
    // throw; we catch and provide a minimal stub instance so imports succeed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('@prisma/client') as { PrismaClient: PrismaClientConstructor }
    PrismaClient = pkg.PrismaClient
} catch (err: unknown) {
    prismaClientAvailable = false
    // Use console.debug so this doesn't pollute normal logs. This also uses
    // the `err` variable so linters don't flag it as unused.
    // eslint-disable-next-line no-console
    console.debug('Prisma client not available at require time:', err)

    // Minimal stub that satisfies the runtime shape for connect/disconnect.
    // Tests should mock service functions and not call Prisma directly when
    // the generated client isn't present.
    PrismaClient = class {
        constructor() {
            // empty
        }
        async $connect(): Promise<void> {
            return Promise.resolve()
        }
        async $disconnect(): Promise<void> {
            return Promise.resolve()
        }
    } as unknown as PrismaClientConstructor
}

const globalForPrisma = globalThis as unknown as {
    prisma: InstanceType<typeof PrismaClient> | undefined
}

// Enhanced Prisma configuration for better connectivity
// Build Prisma client options dynamically so we don't pass `undefined`
// for the datasource URL (Prisma throws if url is undefined).
const prismaOptions: ConstructorParameters<PrismaClientConstructor>[0] = {
    log:
        process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    transactionOptions: {
        timeout: 30000, // 30 seconds
        isolationLevel: 'ReadCommitted'
    }
}

if (process.env.DATABASE_URL) {
    // Only attach datasources if DATABASE_URL is set.
    // This prevents PrismaClientConstructorValidationError in test runs
    // where DATABASE_URL may intentionally be unset.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - PrismaClient constructor accepts a `datasources` property
    prismaOptions['datasources'] = {
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
