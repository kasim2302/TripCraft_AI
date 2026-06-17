import nodemailer from 'nodemailer';

/**
 * Sends an OTP email to the user if SMTP is configured.
 * Otherwise, falls back to logging the OTP to the server console.
 * @param {string} email - Destination email address
 * @param {string} otpCode - 6-digit OTP code
 */
export const sendOTPEmail = async (email, otpCode) => {
  console.log(`\n==================================================`);
  console.log(`[OTP VERIFICATION] code for user ${email}: ${otpCode}`);
  console.log(`==================================================\n`);

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: port == 465, // true for port 465, false for 587 or others
        auth: {
          user,
          pass,
        },
      });

      const mailOptions = {
        from: `"TripCraft AI" <${user}>`,
        to: email,
        subject: `${otpCode} is your TripCraft AI verification code`,
        html: `
          <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">TripCraft AI</h2>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Verify your login</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-bottom: 24px;">
              Hello,
            </p>
            <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-bottom: 24px;">
              We received a request to log in to your TripCraft AI account. Use the code below to complete your sign-in. This code will expire in 10 minutes:
            </p>
            
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace; display: inline-block; padding-left: 8px;">${otpCode}</span>
            </div>
            
            <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 24px;">
              If you didn't request this code, you can safely ignore this email. Someone else might have entered your email address by mistake.
            </p>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
              This is an automated message, please do not reply to this email.
              <br />
              © 2026 TripCraft AI. All rights reserved.
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Verification email successfully sent to ${email}`);
    } catch (error) {
      console.error(`[SMTP] Failed to send email via nodemailer:`, error.message);
    }
  } else {
    console.log(`[SMTP] SMTP credentials not set in server/.env file. Skipping email dispatch.`);
  }
};
