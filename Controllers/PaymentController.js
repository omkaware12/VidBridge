const Payment  = require("../models/Payment");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECERET_KEY);



module.exports.createCheckoutSession = async (req, res) =>{
    try {
    const { plan, price , userId } = req.body; 

    if (!plan || !price || !userId) {
      return res.status(400).json({ error: "Plan and price are required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${plan} Plan` },
            unit_amount: price * 100, 
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/cancel",
    });

    const newPayment = new Payment({
      user: userId,
      stripeSessionId: session.id,
      amount: price * 100, 
      plan,
      paymentMethod: "card",
      status: "pending", 
    });
    await newPayment.save();

    res.json({ url: session.url , sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};



module.exports.verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {

      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: "paid" },
        { new: true }
      );
      return res.json({ success: true, message: "Payment verified successfully" });
    }

    res.json({ success: false, message: "Payment not completed" });
  } catch (error) {
    console.error("Verify payment error:", error.message);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};