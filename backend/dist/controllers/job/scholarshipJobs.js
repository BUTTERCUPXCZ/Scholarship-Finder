"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScholarshipJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const scholar_controller_1 = require("../scholar.controller");
const startScholarshipJobs = () => {
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('Running scholarship expiration check...');
        await (0, scholar_controller_1.updateExpiredScholarships)();
    });
};
exports.startScholarshipJobs = startScholarshipJobs;
