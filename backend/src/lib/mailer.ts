import nodemailer from "nodemailer";

// Use connection pooling to reduce latency for the first email and reuse connections
export const transporter = nodemailer.createTransport({
    pool: true,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // sensible defaults for pool
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS) || 5,
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES) || 100,
    rateDelta: Number(process.env.SMTP_RATE_DELTA) || 2000,
    rateLimit: Number(process.env.SMTP_RATE_LIMIT) || 5,
});

export const warmUpTransport = async () => {
    try {
        // verify will establish a connection and authenticate; this helps avoid first-email latency
        await transporter.verify();
        console.log('SMTP transporter verified and warmed up');
    } catch (err) {
        console.error('Failed to warm up SMTP transporter:', err);
        // Don't throw: we want the app to still start; log for investigation
    }
};

export const sendEmail = async (to: string, subject: string, content: { html: string, text: string }) => {
    try {
        await transporter.sendMail({
            from: `"ScholarSphere" <${process.env.FROM_EMAIL}>`, // Sender name + email
            to,
            subject,
            text: content.text,
            html: content.html,
        });
        console.log("✅ Email sent to:", to);
    } catch (err) {
        console.error("❌ Failed to send email:", err);
        throw err;
    }
};
