const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Company = require("../models/CompanyModel"); // or User if stripeCustomerId is stored there

exports.getStripeCardDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get company linked to the user
    const company = await Company.findById(req.user.company);

    if (!company || !company.stripeCustomerId) {
      return res.status(404).json({ message: "Stripe customer not found." });
    }

    // Get customer’s saved payment methods (only card type)
    const paymentMethods = await stripe.paymentMethods.list({
      customer: company.stripeCustomerId,
      type: "card",
    });

    if (!paymentMethods.data.length) {
      return res.status(200).json({ message: "No card found.", cards: [] });
    }

    // Return card details (masked, safe info)
    const cards = paymentMethods.data.map((card) => ({
      id: card.id,
      brand: card.card.brand,
      last4: card.card.last4,
      exp_month: card.card.exp_month,
      exp_year: card.card.exp_year,
      name: card.billing_details.name,
    }));

    return res.status(200).json({ success: true, cards });
  } catch (error) {
    console.error("Error fetching card details:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.updateStripeCard = async (req, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.body; // This is the new card token from Stripe.js
  
      if (!token) {
        return res.status(400).json({ message: "Card token is required." });
      }
  
      // Get company linked to the user
      const company = await Company.findById(req.user.company);
      if (!company || !company.stripeCustomerId) {
        return res.status(404).json({ message: "Stripe customer not found." });
      }
  
      const customerId = company.stripeCustomerId;
  
      // 🔁 1. Remove all old card payment methods
      const oldMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });
  
      for (const method of oldMethods.data) {
        await stripe.paymentMethods.detach(method.id);
      }
  
      // ➕ 2. Add the new card
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token },
      });
  
      // 🔗 3. Attach the new card to the customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });
  
      // ⭐ 4. Set it as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
  
      res.status(200).json({ message: "Card updated successfully." });
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ message: "Failed to update card.", error });
    }
  };
