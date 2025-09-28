"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.warmUpTransport = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const warmUpTransport = async () => {
    try {
        console.log("SendGrid mailer initialized with API key.");
    }
    catch (err) {
        console.error("Failed to initialize SendGrid:", err);
    }
};
exports.warmUpTransport = warmUpTransport;
const sendEmail = async (to, subject, content) => {
    try {
        const [response] = await mail_1.default.send({
            to,
            from: process.env.FROM_EMAIL,
            subject,
            text: content.text,
            html: content.html,
        });
        console.log("✅ Email sent to:", to, "status:", response.statusCode);
        return response;
    }
    catch (err) {
        console.error("❌ Failed to send email:", err);
        throw err;
    }
};
exports.sendEmail = sendEmail;
