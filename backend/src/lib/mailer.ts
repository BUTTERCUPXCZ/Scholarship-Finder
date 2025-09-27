import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const warmUpTransport = async () => {
    try {
        // SendGrid doesn't have an explicit verify; just send a dummy request
        console.log("SendGrid mailer initialized with API key.");
    } catch (err) {
        console.error("Failed to initialize SendGrid:", err);
    }
};

export const sendEmail = async (
    to: string,
    subject: string,
    content: { html: string; text: string }
) => {
    try {
        const [response] = await sgMail.send({
            to,
            from: process.env.FROM_EMAIL!, // must match verified sender/domain
            subject,
            text: content.text,
            html: content.html,
        });

        console.log("✅ Email sent to:", to, "status:", response.statusCode);
        return response;
    } catch (err) {
        console.error("❌ Failed to send email:", err);
        throw err;
    }
};
