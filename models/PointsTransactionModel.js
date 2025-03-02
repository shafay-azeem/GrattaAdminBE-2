const mongoose = require("mongoose");

const pointsTransactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Null if company allocation
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    points: { type: Number, required: true },
    type: {
      type: String,
      enum: ["company_allocation", "user_transfer"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 255, // Optional, limits note length
    },
  },
  { timestamps: true } // Ensures createdAt and updatedAt are auto-generated
);

module.exports = mongoose.model("PointsTransaction", pointsTransactionSchema);
