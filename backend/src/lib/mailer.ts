import nodemailer from "nodemailer";


export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


export const sendEmail = async (to: string, subject: string, content: { html: string, text: string }) => {
    try {
        await transporter.sendMail({
            from: `"ScholarSphere" <${process.env.FROM_EMAIL}>`, // Sender name + email
            to,
            text: content.text,
            html: content.html,
        });
        console.log("✅ Email sent to:", to);
    } catch (err) {
        console.error("❌ Failed to send email:", err);
        throw err;
    }
};
