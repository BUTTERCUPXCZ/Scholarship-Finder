interface AuthMetrics {
    timestamp: number;
    email: string;
    operation: string;
    duration: number;
    success: boolean;
    errorType?: string;
}

class AuthPerformanceMonitor {
    private static metrics: AuthMetrics[] = [];
    private static readonly MAX_METRICS = 1000;
    private static readonly PERFORMANCE_THRESHOLD_MS = 2000;

    static recordMetric(
        email: string,
        operation: string,
        duration: number,
        success: boolean,
        errorType?: string
    ): void {
        const metric: AuthMetrics = {
            timestamp: Date.now(),
            email: email.replace(/(.{3}).*@/, '$1***@'), // Partially mask email for privacy
            operation,
            duration,
            success,
            errorType
        };

        this.metrics.push(metric);

        // Keep only recent metrics
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }

        // Log slow operations
        if (duration > this.PERFORMANCE_THRESHOLD_MS) {
            console.warn(`⚠️  Slow ${operation}: ${duration}ms for ${metric.email}`);
        }

        // Log successful fast operations
        if (success && duration < 500) {
            console.log(`🚀 Fast ${operation}: ${duration}ms for ${metric.email}`);
        }
    }

    static getAverageResponseTime(operation?: string, timeWindowMs = 3600000): number {
        const cutoff = Date.now() - timeWindowMs;
        const relevantMetrics = this.metrics.filter(m =>
            m.timestamp > cutoff &&
            (operation ? m.operation === operation : true)
        );

        if (relevantMetrics.length === 0) return 0;

        const totalDuration = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
        return Math.round(totalDuration / relevantMetrics.length);
    }

    static getSuccessRate(operation?: string, timeWindowMs = 3600000): number {
        const cutoff = Date.now() - timeWindowMs;
        const relevantMetrics = this.metrics.filter(m =>
            m.timestamp > cutoff &&
            (operation ? m.operation === operation : true)
        );

        if (relevantMetrics.length === 0) return 0;

        const successCount = relevantMetrics.filter(m => m.success).length;
        return Math.round((successCount / relevantMetrics.length) * 100);
    }

    static getPerformanceReport(): string {
        const loginAvg = this.getAverageResponseTime('login');
        const loginSuccess = this.getSuccessRate('login');
        const passwordResetAvg = this.getAverageResponseTime('password-reset');

        return `
📊 Auth Performance Report (Last Hour):
├─ Login: ${loginAvg}ms avg, ${loginSuccess}% success rate
├─ Password Reset: ${passwordResetAvg}ms avg
└─ Total Operations: ${this.metrics.filter(m => m.timestamp > Date.now() - 3600000).length}
        `.trim();
    }

    static logPerformanceReport(): void {
        console.log(this.getPerformanceReport());
    }
}

export { AuthPerformanceMonitor };