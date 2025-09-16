"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const scholarshipJobs_1 = require("./controllers/job/scholarshipJobs");
const scholar_routes_1 = __importDefault(require("./routes/scholar.routes"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
(0, scholarshipJobs_1.startScholarshipJobs)();
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('combined'));
// CORS configuration to allow credentials (cookies)
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Your frontend URL
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, cookie_parser_1.default)()); // Parse cookies
app.use(express_1.default.json());
app.use('/users', user_routes_1.default);
app.use('/scholar', scholar_routes_1.default);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    }
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
