"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const application_controller_1 = require("../controllers/application.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/submit', auth_1.authenticate, application_controller_1.submitApplication);
router.get('/my-applications', auth_1.authenticate, application_controller_1.getUserApplications);
router.get('/:id', auth_1.authenticate, application_controller_1.getApplicationById);
router.delete('/:id/withdraw', auth_1.authenticate, application_controller_1.withdrawApplication);
router.get('/scholarship/:scholarshipId', auth_1.authenticate, application_controller_1.getScholarshipApplications);
router.patch('/:id/status', auth_1.authenticate, application_controller_1.updateApplicationStatus);
exports.default = router;
