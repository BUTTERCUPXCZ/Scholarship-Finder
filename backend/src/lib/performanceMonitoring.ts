import { AuthPerformanceMonitor } from "./authPerformanceMonitor";

// Function to be called from main app to start performance monitoring
export function startPerformanceMonitoring(): void {
    // Log performance report every 10 minutes
    setInterval(() => {
        AuthPerformanceMonitor.logPerformanceReport();
    }, 10 * 60 * 1000);

    console.log("🔍 Auth performance monitoring started");
}

export { AuthPerformanceMonitor };