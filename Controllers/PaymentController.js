const Payment = require("../models/Payment");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECERET_KEY);
const sendReceiptEmail = require("../middleware/payment");
const User = require("../models/UserSchema"); 
const generateReceiptPDF = require("../middleware/GenratePdf"); 

module.exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan, price, userId, email } = req.body;

    if (!plan || !price || !userId || !email) {
      return res.status(400).json({ error: "Plan and price are required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${plan} Plan` },
            unit_amount: price * 100, // convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/cancel",
    });

    const newPayment = new Payment({
      email,
      user: userId,
      stripeSessionId: session.id,
      amount: price * 100,
      plan,
      paymentMethod: "card",
      status: "pending",
    });
    await newPayment.save();

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};



module.exports.verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: "Session ID is required" });

    // Retrieve the Stripe Checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    // Update payment status in DB
    const payment = await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      { status: "paid", paidAt: new Date() },
      { new: true }
    );

    if (!payment) return res.status(404).json({ error: "Payment record not found" });

    
    const user = await User.findById(payment.user);
    const userName = user ? user.name : "Customer";

    
    const pdfBuffer = await generateReceiptPDF({
      name: userName,
      plan: payment.plan,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      stripeSessionId: payment.stripeSessionId,
      createdAt: payment.createdAt,
    });

    
    await sendReceiptEmail(payment.email, {
      name: userName,
      plan: payment.plan,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      stripeSessionId: payment.stripeSessionId,
      createdAt: payment.createdAt,
      pdfBuffer, 
    });

    res.json({ success: true, message: "Payment verified and PDF receipt emailed" });
  } catch (error) {
    console.error("Error verifying payment or sending receipt:", error.message);
    res.status(500).json({ error: "Failed to verify payment or send receipt" });
  }
};