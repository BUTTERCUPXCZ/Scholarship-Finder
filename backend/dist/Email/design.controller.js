"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPasswordResetEmail = exports.buildVerificationEmail = void 0;
const buildVerificationEmail = (fullname, verifyUrl) => {
    const preheader = 'Verify your email to activate your account';
    const safeName = fullname || 'there';
    const html = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your email</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;">
        <!-- Preheader: hidden in most email clients but visible in inbox preview -->
        <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f7fb;padding:24px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
                        <tr>
                            <td style="padding:24px 32px;background:linear-gradient(90deg,#4f46e5,#06b6d4);color:#fff;">
                                <h1 style="margin:0;font-size:20px;letter-spacing:-0.5px;">ScholarSphere</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px;">
                                <p style="margin:0 0 12px 0;color:#111827;font-size:16px;">Hi ${safeName},</p>
                                <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;">Thanks for registering. Please verify your email address by clicking the button below. This helps us keep your account secure.</p>

                                <!-- Button (use table for better email client support) -->
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 28px 0;">
                                    <tr>
                                        <td align="center" bgcolor="#4f46e5" style="border-radius:6px;">
                                            <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:600;border-radius:6px;">Verify Email</a>
                                        </td>
                                    </tr>
                                </table>


                                <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
                                <p style="margin:0;color:#9ca3af;font-size:12px;">If you didn't sign up for an account, you can safely ignore this email.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px 32px;background:#fbfafc;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ScholarSphere — <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color:inherit;text-decoration:underline;">Visit site</a></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
    const text = `Hello ${fullname},\n\nPlease verify your email by visiting the following link:\n${verifyUrl}\n\nIf you didn't create an account, you can ignore this message.`;
    return { html, text };
};
exports.buildVerificationEmail = buildVerificationEmail;
const buildPasswordResetEmail = (fullname, otp, minutes = 10) => {
    const safeName = fullname || 'there';
    const preheader = `Your password reset code (expires in ${minutes} minutes)`;
    const html = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password reset code</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f6f7fb;font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;">
        <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f6f7fb;padding:24px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
                        <tr>
                            <td style="padding:24px 32px;background:linear-gradient(90deg,#4f46e5,#06b6d4);color:#fff;">
                                <h1 style="margin:0;font-size:20px;letter-spacing:-0.5px;">ScholarSphere</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px;">
                                <p style="margin:0 0 12px 0;color:#111827;font-size:16px;">Hi ${safeName},</p>
                                <p style="margin:0 0 20px 0;color:#6b7280;font-size:14px;">We received a request to reset your password. Use the one-time code below to complete the reset. The code expires in ${minutes} minutes.</p>

                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 28px 0;">
                                    <tr>
                                        <td align="center" style="border-radius:8px;background:#f3f4f6;padding:16px 22px;">
                                            <p style="margin:0;font-size:22px;letter-spacing:4px;font-weight:700;color:#111827;">${otp}</p>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin:0 0 12px 0;color:#9ca3af;font-size:12px;">If you didn't request a password reset, you can safely ignore this email. For security, do not share this code with anyone.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:16px 32px;background:#fbfafc;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ScholarSphere — <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color:inherit;text-decoration:underline;">Visit site</a></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
    const text = `Hello ${fullname},\n\nYour password reset code is: ${otp}\nIt expires in ${minutes} minutes.\n\nIf you didn't request a password reset, ignore this message.`;
    return { html, text };
};
exports.buildPasswordResetEmail = buildPasswordResetEmail;
