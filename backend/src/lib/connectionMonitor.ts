import { prisma } from './db';

export class ConnectionMonitor {
    private static metrics = {
        activeQueries: 0,
        totalQueries: 0,
        connectionPoolTimeouts: 0,
        lastReset: Date.now()
    };

    static incrementActiveQueries(): void {
        this.metrics.activeQueries++;
        this.metrics.totalQueries++;
    }

    static decrementActiveQueries(): void {
        this.metrics.activeQueries = Math.max(0, this.metrics.activeQueries - 1);
    }

    static incrementConnectionTimeouts(): void {
        this.metrics.connectionPoolTimeouts++;
    }

    static getMetrics() {
        const now = Date.now();
        const uptimeMs = now - this.metrics.lastReset;
        const uptimeMinutes = Math.round(uptimeMs / 60000);

        return {
            ...this.metrics,
            uptimeMinutes,
            averageQueriesPerMinute: uptimeMinutes > 0 ? Math.round(this.metrics.totalQueries / uptimeMinutes) : 0
        };
    }

    static resetMetrics(): void {
        this.metrics = {
            activeQueries: 0,
            totalQueries: 0,
            connectionPoolTimeouts: 0,
            lastReset: Date.now()
        };
    }

    static logMetrics(): void {
        const metrics = this.getMetrics();
        console.log('📊 Database Connection Metrics:', {
            activeQueries: metrics.activeQueries,
            totalQueries: metrics.totalQueries,
            connectionPoolTimeouts: metrics.connectionPoolTimeouts,
            uptimeMinutes: metrics.uptimeMinutes,
            averageQueriesPerMinute: metrics.averageQueriesPerMinute
        });
    }

    // Wrap database operations to track metrics
    static async withTracking<T>(operation: () => Promise<T>, operationName?: string): Promise<T> {
        this.incrementActiveQueries();
        const startTime = Date.now();

        try {
            const result = await operation();
            const duration = Date.now() - startTime;

            if (duration > 5000) { // Log slow queries
                console.warn(`🐌 Slow database operation: ${operationName || 'unknown'} took ${duration}ms`);
            }

            return result;
        } catch (error) {
            // Track connection pool timeouts
            if (error instanceof Error && (
                error.message.includes('connection pool') ||
                error.message.includes('Timed out fetching')
            )) {
                this.incrementConnectionTimeouts();
            }
            throw error;
        } finally {
            this.decrementActiveQueries();
        }
    }

    // Monitor connection pool status
    static async checkConnectionPoolHealth(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        message: string;
        metrics: ReturnType<typeof ConnectionMonitor.getMetrics>;
    }> {
        const metrics = this.getMetrics();

        if (metrics.connectionPoolTimeouts > 10) {
            return {
                status: 'critical',
                message: `High number of connection pool timeouts: ${metrics.connectionPoolTimeouts}`,
                metrics
            };
        }

        if (metrics.activeQueries > 40) {
            return {
                status: 'warning',
                message: `High number of active queries: ${metrics.activeQueries}`,
                metrics
            };
        }

        return {
            status: 'healthy',
            message: 'Connection pool is healthy',
            metrics
        };
    }
}

// Start periodic logging in non-test environments
if (process.env.NODE_ENV !== 'test') {
    setInterval(() => {
        ConnectionMonitor.logMetrics();
    }, 60000); // Log every minute
}