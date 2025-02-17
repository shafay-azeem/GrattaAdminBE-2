const Stripe = require("stripe");
const mongoose = require("mongoose");
const Company = require("../models/CompanyModel");
const UserWallet = require("../models/UserWalletModel");
const PointsTransaction = require("../models/PointsTransactionModel"); // Added missing import
require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables.");
}

// Create Payment Intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, companyId, points } = req.body;

    // Validate company
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: { companyId, points }, // Store metadata for later use
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Handle Stripe Webhook
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const companyId = paymentIntent.metadata.companyId;
    const points = parseInt(paymentIntent.metadata.points, 10);

    try {
      const company = await Company.findById(companyId);
      if (!company) return res.status(404).json({ message: "Company not found" });

      // Update company's total allocated points
      company.totalAllocatedPoints += points;
      await company.save();

      // Find all users in the company
      const userWallets = await UserWallet.find({ company: companyId });

      if (userWallets.length > 0) {
        const pointsPerUser = Math.floor(points / userWallets.length);

        // Update user wallets and create transactions
        for (const wallet of userWallets) {
          wallet.companyPoints += pointsPerUser;
          await wallet.save();

          await PointsTransaction.create({
            sender: null,
            receiver: wallet.user,
            company: companyId,
            points: pointsPerUser,
            type: "company_allocation",
          });
        }
      }

      return res.status(200).json({ success: true, message: "Points allocated successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.json({ received: true });
};
