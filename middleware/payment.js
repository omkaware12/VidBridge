const transporter = require("./mailConfig");

const sendReceiptEmail = async (email, paymentData) => {
  try {
    const mailOptions = {
      from: '"VidBridge" <vidbridge7@gmail.com>',
      to: email,
      subject: `VidBridge Payment Receipt - ${paymentData.plan} Plan ✔`,
      html: `
        <p>Hi ${paymentData.name},</p>
        <p>Thank you for your payment. Your receipt is attached as a PDF.</p>
        <p>Plan: ${paymentData.plan} <br/>
           Amount: $${(paymentData.amount / 100).toFixed(2)} <br/>
           Payment Method: ${paymentData.paymentMethod} <br/>
           Status: ${paymentData.status} <br/>
           Transaction ID: ${paymentData.stripeSessionId} <br/>
           Date: ${new Date(paymentData.createdAt).toLocaleString()}
        </p>
        <p>🎬 Your subscription is now active!</p>
      `,
      attachments: [
        {
          filename: "VidBridge_Receipt.pdf",
          content: paymentData.pdfBuffer,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ PDF receipt email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Error sending PDF receipt email:", err);
  }
};

module.exports = sendReceiptEmail;
