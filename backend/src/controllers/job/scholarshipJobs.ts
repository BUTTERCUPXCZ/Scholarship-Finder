import cron from 'node-cron';
import { updateExpiredScholarships } from '../scholar.controller';

// Run every day at midnight to check for expired scholarships
export const startScholarshipJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running scholarship expiration check...');
        await updateExpiredScholarships();
    });
};