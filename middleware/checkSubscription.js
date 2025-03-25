const Company = require("../models/CompanyModel");

exports.checkSubscription = async (req, res, next) => {
  const company = await Company.findById(req.user.company);

  if (!company) return res.status(404).json({ message: "Company not found." });

  if (company.subscriptionStatus === "expired") {
    return res.status(403).json({ message: "Subscription expired. Please renew." });
  }

  next();
};
