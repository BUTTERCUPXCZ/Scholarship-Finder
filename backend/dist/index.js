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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socketService_1 = require("./services/socketService");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const app = (0, express_1.default)();
(0, scholarshipJobs_1.startScholarshipJobs)();
(0, expiredScholarshipJob_1.startExpiredScholarshipJob)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));
app.use((0, morgan_1.default)(NODE_ENV === 'production' ? 'combined' : 'dev'));
if (NODE_ENV === 'production') {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
}
const corsOrigins = NODE_ENV === "production"
    ? [process.env.FRONTEND_URL]
    : ["http://localhost:5173", "http://    localhost:5174"];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (corsOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn("CORS blocked:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
}));
app.options("*", (0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0',
    });
});
app.use('/users', user_routes_1.default);
app.use('/scholar', scholar_routes_1.default);
app.use('/applications', application_routes_1.default);
app.use('/upload', upload_routes_1.default);
app.use('/notifications', notification_routes_1.default);
const server = http_1.default.createServer(app);
const io = (0, socketService_1.initializeSocket)(server);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Socket.IO server initialized for real-time notifications');
});
