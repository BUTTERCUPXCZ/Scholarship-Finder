import { prisma } from './db';

export class DatabaseHealthCheck {
    private static isConnected = false;
    private static lastHealthCheck = 0;
    private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

    static async checkConnection(): Promise<boolean> {
        const now = Date.now();

        // Skip frequent health checks
        if (this.isConnected && (now - this.lastHealthCheck) < this.HEALTH_CHECK_INTERVAL) {
            return true;
        }

        try {
            // Simple query to test connection
            await prisma.$queryRaw`SELECT 1`;
            this.isConnected = true;
            this.lastHealthCheck = now;
            return true;
        } catch (error) {
            console.error('Database health check failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    static async ensureConnection(): Promise<void> {
        if (!await this.checkConnection()) {
            throw new Error('Database connection is not available');
        }
    }

    static async retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries = 3,
        delayMs = 1000
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.ensureConnection();
                return await operation();
            } catch (error) {
                lastError = error as Error;
                console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);

                if (attempt === maxRetries) {
                    break;
                }

                // Exponential backoff
                const delay = delayMs * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }

    static getConnectionStatus(): boolean {
        return this.isConnected;
    }
}


export async function withDatabaseRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    return DatabaseHealthCheck.retryOperation(operation, maxRetries);
}


export function handleDatabaseError(error: unknown, context: string) {
    // Narrow unknown to an object that may include Prisma error properties
    const isPrismaError = (err: unknown): err is { code?: string; message?: string } => {
        return typeof err === 'object' && err !== null && ('code' in err || 'message' in err);
    };

    if (isPrismaError(error)) {
        if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
            console.error(`${context}: Database connection failed`, error);
            return {
                error: 'DATABASE_CONNECTION_FAILED',
                message: 'Unable to connect to database. Please try again later.',
                retryable: true
            };
        }

        if (error.code === 'P2002') {
            console.error(`${context}: Unique constraint violation`, error);
            return {
                error: 'UNIQUE_CONSTRAINT_VIOLATION',
                message: 'A record with this information already exists.',
                retryable: false
            };
        }
    }

    console.error(`${context}: Unexpected database error`, error);
    return {
        error: 'DATABASE_ERROR',
        message: 'An unexpected database error occurred.',
        retryable: true
    };
}