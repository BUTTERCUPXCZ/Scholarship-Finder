"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseHealthCheck = void 0;
exports.withDatabaseRetry = withDatabaseRetry;
exports.handleDatabaseError = handleDatabaseError;
const db_1 = require("./db");
class DatabaseHealthCheck {
    static isConnected = false;
    static lastHealthCheck = 0;
    static HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
    static async checkConnection() {
        const now = Date.now();
        // Skip frequent health checks
        if (this.isConnected && (now - this.lastHealthCheck) < this.HEALTH_CHECK_INTERVAL) {
            return true;
        }
        try {
            // Simple query to test connection
            await db_1.prisma.$queryRaw `SELECT 1`;
            this.isConnected = true;
            this.lastHealthCheck = now;
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            this.isConnected = false;
            return false;
        }
    }
    static async ensureConnection() {
        if (!await this.checkConnection()) {
            throw new Error('Database connection is not available');
        }
    }
    static async retryOperation(operation, maxRetries = 3, delayMs = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.ensureConnection();
                return await operation();
            }
            catch (error) {
                lastError = error;
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
        throw lastError;
    }
    static getConnectionStatus() {
        return this.isConnected;
    }
}
exports.DatabaseHealthCheck = DatabaseHealthCheck;
// Wrapper function for database operations with retry logic
async function withDatabaseRetry(operation, maxRetries = 3) {
    return DatabaseHealthCheck.retryOperation(operation, maxRetries);
}
// Helper for handling database errors
function handleDatabaseError(error, context) {
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
    console.error(`${context}: Unexpected database error`, error);
    return {
        error: 'DATABASE_ERROR',
        message: 'An unexpected database error occurred.',
        retryable: true
    };
}
