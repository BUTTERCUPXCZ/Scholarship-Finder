import { updateExpiredScholarships } from '../controllers/scholar.controller';

// Run every hour (3600000 ms)
const EXPIRED_SCHOLARSHIP_CHECK_INTERVAL = 60 * 60 * 1000;

let scheduledJobRunning = false;

export const startExpiredScholarshipJob = () => {
    if (scheduledJobRunning) {
        console.log('Expired scholarship job is already running');
        return;
    }

    console.log('Starting expired scholarship background job...');
    scheduledJobRunning = true;

    // Run immediately on startup
    updateExpiredScholarships().catch(error => {
        console.error('Error in initial expired scholarship update:', error);
    });

    // Then run every hour
    const intervalId = setInterval(async () => {
        try {
            console.log('Running scheduled expired scholarship check...');
            await updateExpiredScholarships();
        } catch (error) {
            console.error('Error in scheduled expired scholarship update:', error);
        }
    }, EXPIRED_SCHOLARSHIP_CHECK_INTERVAL);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Shutting down expired scholarship job...');
        clearInterval(intervalId);
        scheduledJobRunning = false;
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('Shutting down expired scholarship job...');
        clearInterval(intervalId);
        scheduledJobRunning = false;
        process.exit(0);
    });
};

export const stopExpiredScholarshipJob = () => {
    scheduledJobRunning = false;
};