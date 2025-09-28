let PrismaClient: any
let prismaClientAvailable = true

try {
    // Try to require the generated Prisma client. In test environments where
    // `prisma generate` hasn't been run, this can throw. We catch and fall
    // back to a lightweight stub so unit tests can run without the generated
    // client present.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    PrismaClient = require('@prisma/client').PrismaClient
} catch (err) {
    prismaClientAvailable = false
    // Provide a minimal stub implementation that throws if any method is used
    // (so tests that don't mock the service will still see clear failures),
    // but allows modules to import `prisma` without triggering the "generate"
    // error during require time.
    PrismaClient = class {
        constructor() { }
        $connect() {
            return Promise.resolve()
        }
        $disconnect() {
            return Promise.resolve()
        }
    }
}

const globalForPrisma = globalThis as unknown as {
    prisma: InstanceType<typeof PrismaClient> | undefined
}

// Enhanced Prisma configuration for better connectivity
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
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
    })

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
