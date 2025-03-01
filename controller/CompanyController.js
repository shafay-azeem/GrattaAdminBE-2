const PointsTransaction = require("../models/PointsTransactionModel");
const User = require("../models/UserModel");
const Company = require("../models/CompanyModel");

exports.getCompanyTransactions = async (req, res) => {
  try {
    const companyId = req.user.company.toString(); // Extracting company ID from req.user

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    // Fetch transactions related to this company
    const transactions = await PointsTransaction.find({ company: companyId })
      .populate("sender", "firstName lastName _id") // Get sender details
      .populate("receiver", "firstName lastName _id") // Get receiver details
      .populate("company", "name _id") // Get company name
      .sort({ updatedAt: -1 }); // Sort by latest transactions

    // If no transactions, return a 200 response with an empty array
    if (!transactions.length) {
      return res.status(200).json({ message: "No transactions found", transactions: [] });
    }

    // Format the response
    const formattedTransactions = transactions.map((txn) => ({
      _id: txn._id,
      type: txn.type,
      points: txn.points,
      sender:
        txn.sender && txn.type === "user_transfer"
          ? {
              id: txn.sender._id,
              name: `${txn.sender.firstName} ${txn.sender.lastName}`,
            }
          : { id: "Company", name: txn.company.name }, // Company allocation
      receiver: {
        id: txn.receiver._id,
        name: `${txn.receiver.firstName} ${txn.receiver.lastName}`,
      },
      createdAt: txn.createdAt,
    }));

    res.status(200).json({ transactions: formattedTransactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
