"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const scholarshipJobs_1 = require("./controllers/job/scholarshipJobs");
const expiredScholarshipJob_1 = require("./jobs/expiredScholarshipJob");
const scholar_routes_1 = __importDefault(require("./routes/scholar.routes"));
const application_routes_1 = __importDefault(require("./routes/application.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const socketService_1 = require("./services/socketService");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
(0, scholarshipJobs_1.startScholarshipJobs)();
(0, expiredScholarshipJob_1.startExpiredScholarshipJob)();
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use((0, cors_1.default)({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5174' // Allow both development ports
    ],
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, cookie_parser_1.default)()); // Parse cookies
app.use(express_1.default.json());
app.use('/users', user_routes_1.default);
app.use('/scholar', scholar_routes_1.default);
app.use('/applications', application_routes_1.default);
app.use('/upload', upload_routes_1.default);
app.use('/notifications', notification_routes_1.default);
const server = http_1.default.createServer(app);
// Initialize Socket.IO with authentication
const io = (0, socketService_1.initializeSocket)(server);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Socket.IO server initialized for real-time notifications');
});
