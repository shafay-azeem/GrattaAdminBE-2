const express = require("express");
const {
  createPaymentIntent,
  handleStripeWebhook,
} = require("../controller/PaymentController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

// Route for creating payment intent (protected route)
router.route("/create-payment-intent").post(isAuthenticatedUser, createPaymentIntent);
router.use(express.json());
// Route for Stripe webhook (must use `bodyParser.raw`)
router.post("/stripe-webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

module.exports = router;
