const subscriptionSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    status: { type: String, enum: ["active", "failed", "expired"], required: true },
    amountPaid: { type: Number, required: true },
    transactionId: { type: String, required: true }, // Stripe transaction ID
    paymentMethod: { type: String, enum: ["stripe"], required: true },
    paidAt: { type: Date, default: Date.now },
    nextBillingDate: { type: Date, required: true },
  });
  
  module.exports = mongoose.model("Subscription", subscriptionSchema);
  