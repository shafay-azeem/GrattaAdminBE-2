const mongoose = require("mongoose");



const userWalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  companyPoints: { type: Number, default: 0 }, // Points given by the company
  personalPoints: { type: Number, default: 0 }, // Points received from users
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserWallet", userWalletSchema);
