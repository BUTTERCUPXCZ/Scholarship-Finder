"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        if (err.message === 'Only PDF, DOC, DOCX, and image files are allowed') {
            return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    next();
};
// Upload files endpoint
router.post('/files', auth_1.authenticate, upload_controller_1.uploadMiddleware, handleMulterError, upload_controller_1.uploadFiles);
// Download file endpoint - using POST to handle complex paths in request body
router.post('/download', auth_1.authenticate, upload_controller_1.downloadFile);
exports.default = router;
