const transporter = require("./mailConfig");
const path = require("path");

const sendEmail = async (email, verificatiocode) => {
  try {
    const info = await transporter.sendMail({
      from: '"VidBridge" <vidbridge7@gmail.com>',
      to: email,
      subject: "VidBridge Email Verification ✔",
      html: `
        <div style="background:#f6f9fc; padding:30px; font-family:Arial, sans-serif; color:#333;">
          <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; padding:30px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
            
            <!-- Logo -->
            <div style="text-align:center; margin-bottom:25px;">
              <img src="cid:logo" alt="VidBridge Logo" style="max-width:160px; height:auto;" />
            </div>

            <!-- Title -->
            <h2 style="text-align:center; color:#2563eb; font-size:24px; margin-bottom:10px;">
              Email Verification
            </h2>

            <p style="font-size:15px; color:#444; text-align:center; line-height:1.6;">
              Thank you for joining <strong>VidBridge</strong> 🎬  
              Use the code below to verify your email:
            </p>

            <!-- OTP Box -->
            <div style="text-align:center; margin:30px 0;">
              <span style="display:inline-block; font-size:30px; font-weight:bold; letter-spacing:6px; background:linear-gradient(135deg,#2563eb,#1e40af); color:#fff; padding:16px 36px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.2);">
                ${verificatiocode}
              </span>
            </div>

            <p style="font-size:14px; text-align:center; color:#555;">
              This code will expire in <strong>10 minutes</strong>.
            </p>

            <p style="font-size:13px; text-align:center; color:#777;">
              If you didn’t request this, please ignore this email.
            </p>

            <hr style="margin:25px 0; border:none; border-top:1px solid #eee;" />

            <!-- Footer -->
            <p style="font-size:12px; text-align:center; color:#999;">
              © ${new Date().getFullYear()} <strong>VidBridge</strong> · All rights reserved  
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "Vidbridge.png",
          path: path.join(__dirname, "Vidbridge.png"),
          cid: "logo" // same as in HTML <img src="cid:logo">
        }
      ]
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

module.exports = sendEmail;
