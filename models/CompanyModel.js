const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  subscriptionStatus: { type: String, enum: ["trial", "active", "expired"], default: "trial" },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14-day free trial
  billingCycleDate: { type: Date }, // Next billing date after trial
  stripeCustomerId: { type: String }, // Stripe customer ID
  stripeSubscriptionId: { type: String }, // Stripe subscription ID
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Company", companySchema);
