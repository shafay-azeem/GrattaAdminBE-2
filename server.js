const express = require("express");
const dotenv = require("dotenv");
const cron = require("node-cron");
const connectDataBase = require("./db/Database");
const app = require("./app");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const Company = require("./models/CompanyModel");
const Subscription = require("./models/SubscriptionModel");


dotenv.config({ path: ".env" });
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
connectDataBase();




//------Deployment-----------------------------------------------
const __dirname1 = path.resolve();
// console.log(process.env.NODE_ENV, "process.env.NODE_ENV");
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/dine-in/build")));
//   app.get("*", (req, res) =>
//     res.sendFile(path.resolve(__dirname1, "dine-in", "build", "index.html"))
//   );
// } else {
app.get("/", (req, res) => {
  res.send("API is running..");
});
// }
//----------------------------------------------------------------

app.use(notFound);
app.use(errorHandler);

// cron.schedule("0 0 * * *", async () => {
//   console.log("Running daily subscription check...");

//   const now = new Date();
//   const expiredCompanies = await Company.find({
//     subscriptionStatus: "trial",
//     trialEndsAt: { $lte: now },
//   });

//   for (const company of expiredCompanies) {
//     try {
//       // Check if the company has a failed payment
//       const failedSubscription = await Subscription.findOne({
//         company: company._id,
//         status: "failed",
//       });

//       if (failedSubscription) {
//         console.log(`Skipping Company ID: ${company._id} due to failed payment`);
//         continue; // Skip failed subscriptions
//       }

//       // Create Stripe Subscription (if no failed record exists)
//       const subscription = await stripe.subscriptions.create({
//         customer: company.stripeCustomerId,
//         items: [{ price: "price_299_monthly_plan_id" }],
//         expand: ["latest_invoice.payment_intent"],
//       });

//       // Update Company & Subscription Models
//       company.subscriptionStatus = "active";
//       company.billingCycleDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
//       company.stripeSubscriptionId = subscription.id;
//       await company.save();

//       await Subscription.create({
//         company: company._id,
//         status: "active",
//         amountPaid: 299,
//         transactionId: subscription.latest_invoice.payment_intent.id,
//         paymentMethod: "stripe",
//         nextBillingDate: company.billingCycleDate,
//       });

//       console.log(`Subscription activated for Company ID: ${company._id}`);
//     } catch (error) {
//       console.error(`Failed to charge Company ID: ${company._id}`, error);
//     }
//   }
// });


cron.schedule("0 0 * * *", async () => {
  console.log("Running daily subscription check at 08:42 UTC...");

  const now = new Date();
  const expiredCompanies = await Company.find({
    subscriptionStatus: "trial",
    trialEndsAt: { $lte: now },
  });

  for (const company of expiredCompanies) {
    try {
      // Check if the company has a failed payment
      const failedSubscription = await Subscription.findOne({
        company: company._id,
        status: "failed",
      });

      if (failedSubscription) {
        console.log(`Skipping Company ID: ${company._id} due to failed payment`);
        continue; // Skip failed subscriptions
      }

      // Create Stripe Subscription (if no failed record exists)
      const subscription = await stripe.subscriptions.create({
        customer: company.stripeCustomerId,
        items: [{ price: "price_1R3kcv05uvznrjSmXLfBkeEf" }],
        expand: ["latest_invoice.payment_intent"],
      });

      // Update Company & Subscription Models
      company.subscriptionStatus = "active";
      company.billingCycleDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      company.stripeSubscriptionId = subscription.id;
      await company.save();

      await Subscription.create({
        company: company._id,
        status: "active",
        amountPaid: 299,
        transactionId: subscription.latest_invoice.payment_intent.id,
        paymentMethod: "stripe",
        nextBillingDate: company.billingCycleDate,
      });

      console.log(`Subscription activated for Company ID: ${company._id}`);
    } catch (error) {
      console.log(error,"===")
      console.error(`Failed to charge Company ID: ${company._id}`, error);
    }
  }
});

const server = app.listen(process.env.PORT, () => {
  console.log(`server is running on ${process.env.PORT}`);
});
