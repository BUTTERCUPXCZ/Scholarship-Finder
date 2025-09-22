"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const router = express_1.default.Router();
router.get('/', auth_1.authenticate, notification_controller_1.fetchNotifications);
router.patch('/:id/read', auth_1.authenticate, notification_controller_1.readNotification);
router.patch('/mark-all-read', auth_1.authenticate, notification_controller_1.readAllNotifications);
router.delete('/:id', auth_1.authenticate, notification_controller_1.removeNotification);
exports.default = router;
