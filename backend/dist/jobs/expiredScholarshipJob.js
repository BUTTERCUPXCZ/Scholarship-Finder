"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopExpiredScholarshipJob = exports.startExpiredScholarshipJob = void 0;
const scholar_controller_1 = require("../controllers/scholar.controller");
const EXPIRED_SCHOLARSHIP_CHECK_INTERVAL = 60 * 60 * 1000;
let scheduledJobRunning = false;
const startExpiredScholarshipJob = () => {
    if (scheduledJobRunning) {
        console.log('Expired scholarship job is already running');
        return;
    }
    console.log('Starting expired scholarship background job...');
    scheduledJobRunning = true;
    (0, scholar_controller_1.updateExpiredScholarships)().catch(error => {
        console.error('Error in initial expired scholarship update:', error);
    });
    const intervalId = setInterval(async () => {
        try {
            console.log('Running scheduled expired scholarship check...');
            await (0, scholar_controller_1.updateExpiredScholarships)();
        }
        catch (error) {
            console.error('Error in scheduled expired scholarship update:', error);
        }
    }, EXPIRED_SCHOLARSHIP_CHECK_INTERVAL);
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
exports.startExpiredScholarshipJob = startExpiredScholarshipJob;
const stopExpiredScholarshipJob = () => {
    scheduledJobRunning = false;
};
exports.stopExpiredScholarshipJob = stopExpiredScholarshipJob;
