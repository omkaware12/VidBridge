const express = require("express");
const PaymentController = require("../Controllers/PaymentController");
const router = express.Router();


router.post("/checkout", PaymentController.createCheckoutSession);

router.get("/verify" , PaymentController.verifyPayment);

module.exports = router;
