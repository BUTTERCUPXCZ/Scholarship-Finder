"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scholar_controller_1 = require("../controllers/scholar.controller");
const auth_1 = require("../middleware/auth");
const scholar_controller_2 = require("../controllers/scholar.controller");
const router = express_1.default.Router();
router.post('/create-scholar', auth_1.authenticate, scholar_controller_1.createScholar);
router.get('/get-scholars', scholar_controller_1.getAllScholars); // Remove authentication - allow public access
router.get('/get-scholarship/:id', auth_1.authenticate, scholar_controller_1.getScholarshipById);
router.put('/update-scholar/:id', auth_1.authenticate, scholar_controller_1.updateScholar);
router.delete('/delete-scholar/:id', auth_1.authenticate, scholar_controller_2.deleteScholarship);
router.post('/archive-scholar/:id', auth_1.authenticate, scholar_controller_1.ArchiveScholarship);
router.post('/update-expired', auth_1.authenticate, scholar_controller_1.updateExpiredScholarships);
router.post('/get-archived', auth_1.authenticate, scholar_controller_1.getArchivedScholarships);
exports.default = router;
