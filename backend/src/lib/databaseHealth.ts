import { prisma } from './db';
import { ConnectionMonitor } from './connectionMonitor';

export class DatabaseHealthCheck {
    private static isConnected = false;
    private static lastHealthCheck = 0;
    private static readonly HEALTH_CHECK_INTERVAL = 30000;
    private static connectionAttempts = 0;
    private static maxConnectionAttempts = 5;

    static async checkConnection(): Promise<boolean> {
        const now = Date.now();

        // Skip frequent health checks
        if (this.isConnected && (now - this.lastHealthCheck) < this.HEALTH_CHECK_INTERVAL) {
            return true;
        }

        try {
            // Simple query to test connection with timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Health check timeout')), 10000);
            });

            await Promise.race([
                prisma.$queryRaw`SELECT 1`,
                timeoutPromise
            ]);

            this.isConnected = true;
            this.lastHealthCheck = now;
            this.connectionAttempts = 0; // Reset on success
            return true;
        } catch (error) {
            console.error('Database health check failed:', error);
            this.isConnected = false;
            this.connectionAttempts++;

            // Log connection pool issues specifically
            if (error instanceof Error && error.message.includes('connection pool')) {
                console.error('🔴 Connection pool exhausted. Consider increasing pool size or investigating connection leaks.');
            }

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
                const result = await operation();

                // Log successful operation after retries
                if (attempt > 1) {
                    console.log(`✅ Database operation succeeded on attempt ${attempt}`);
                }

                return result;
            } catch (error) {
                lastError = error as Error;
                console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);

                // Handle specific Prisma connection pool errors
                if (error instanceof Error && error.message.includes('connection pool')) {
                    console.error(`🔴 Connection pool timeout on attempt ${attempt}. Active connections may not be properly released.`);
                }

                if (attempt === maxRetries) {
                    break;
                }

                // Exponential backoff with jitter
                const jitter = Math.random() * 1000;
                const delay = (delayMs * Math.pow(2, attempt - 1)) + jitter;
                console.log(`Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }

    static getConnectionStatus(): boolean {
        return this.isConnected;
    }

    static getConnectionAttempts(): number {
        return this.connectionAttempts;
    }

    static resetConnectionAttempts(): void {
        this.connectionAttempts = 0;
    }
}


export async function withDatabaseRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    operationName?: string,
    timeoutMs = 15000
): Promise<T> {
    return ConnectionMonitor.withTracking(
        async () => {
            // Add timeout wrapper for database operations
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs);
            });

            return Promise.race([
                DatabaseHealthCheck.retryOperation(operation, maxRetries),
                timeoutPromise
            ]);
        },
        operationName
    );
}

// Specialized function for authentication operations with shorter timeout
export async function withAuthRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 2,
    operationName?: string
): Promise<T> {
    return withDatabaseRetry(operation, maxRetries, operationName, 8000); // 8 second timeout for auth
}


export function handleDatabaseError(error: unknown, context: string) {
    // Narrow unknown to an object that may include Prisma error properties
    const isPrismaError = (err: unknown): err is { code?: string; message?: string; errorCode?: string } => {
        return typeof err === 'object' && err !== null && ('code' in err || 'message' in err || 'errorCode' in err);
    };

    if (isPrismaError(error)) {
        // Handle connection pool timeout errors (P2024)
        if (error.code === 'P2024' || error.errorCode === 'P2024' ||
            error.message?.includes('connection pool') ||
            error.message?.includes('Timed out fetching a new connection')) {
            console.error(`${context}: Connection pool timeout`, error);
            return {
                error: 'CONNECTION_POOL_TIMEOUT',
                message: 'Database is temporarily overloaded. Please try again in a moment.',
                retryable: true
            };
        }

        // Handle general connection failures
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