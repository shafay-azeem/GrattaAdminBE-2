const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/UserModel");
const UserWallet = require("../models/UserWalletModel");
const PointsTransaction = require("../models/PointsTransactionModel");
const Company = require("../models/CompanyModel");

// exports.pointsDistributeByCompany = async (req, res) => {
//   try {
//     const { points } = req.body;
//     const companyId = req.user.company.toString(); // Extracting company ID from req.user

//     if (!points || points <= 0) {
//       return res.status(400).json({ message: "Points must be greater than 0" });
//     }

//     // Get all active users belonging to the company
//     const users = await User.find({ company: companyId, status: "active" });

//     if (!users.length) {
//       return res.status(404).json({ message: "No active users found for this company" });
//     }

//     // Start a session for transaction safety
//     const session = await UserWallet.startSession();
//     session.startTransaction();

//     try {
//       const transactionPromises = users.map(async (user) => {
//         // Create a new transaction for each active user
//         await PointsTransaction.create(
//           [
//             {
//               sender: null, // Company allocation, no sender
//               receiver: user._id,
//               company: companyId,
//               points: points, // Each user gets the full allocated points
//               type: "company_allocation",
//             },
//           ],
//           { session }
//         );

//         // Update the user wallet
//         await UserWallet.findOneAndUpdate(
//           { user: user._id, company: companyId },
//           { $inc: { companyPoints: points } },
//           { upsert: true, new: true, session }
//         );
//       });

//       await Promise.all(transactionPromises);

//       // Update the company's total allocated points
//       await Company.findByIdAndUpdate(
//         companyId,
//         { $inc: { totalAllocatedPoints: points * users?.length } },
//         { session }
//       );

//       // Commit the transaction
//       await session.commitTransaction();
//       session.endSession();

//       res.status(200).json({
//         message: `Successfully distributed ${points} points to ${users.length} active users`,
//       });
//     } catch (error) {
//       // Rollback in case of error
//       await session.abortTransaction();
//       session.endSession();
//       console.error(error);
//       res.status(500).json({ message: "Error distributing points", error });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };


// exports.pointsDistributeByCompany = async (req, res) => {
//   try {
//     const { points, carryForward = true } = req.body; // Default carryForward to true
//     const companyId = req.user.company.toString(); // Extracting company ID from req.user
//     console.log(carryForward,"===")
//     if (!points || points <= 0) {
//       return res.status(400).json({ message: "Points must be greater than 0" });
//     }

//     // Get all active users belonging to the company
//     const users = await User.find({ company: companyId, status: "active" });

//     if (!users.length) {
//       return res.status(404).json({ message: "No active users found for this company" });
//     }

//     // Start a session for transaction safety
//     const session = await UserWallet.startSession();
//     session.startTransaction();

//     try {
//       const transactionPromises = users.map(async (user) => {
//         // Create a new transaction for each active user
//         await PointsTransaction.create(
//           [
//             {
//               sender: null, // Company allocation, no sender
//               receiver: user._id,
//               company: companyId,
//               points: points, // Each user gets the full allocated points
//               type: "company_allocation",
//             },
//           ],
//           { session }
//         );

//         // Update user wallet
//         if (carryForward) {
//           // Add points to existing company points
//           await UserWallet.findOneAndUpdate(
//             { user: user._id, company: companyId },
//             { $inc: { companyPoints: points } },
//             { upsert: true, new: true, session }
//           );
//         } else {
//           // Reset company points and set new value
//           await UserWallet.findOneAndUpdate(
//             { user: user._id, company: companyId },
//             { companyPoints: points }, // Overwrite instead of incrementing
//             { upsert: true, new: true, session }
//           );
//         }
//       });

//       await Promise.all(transactionPromises);

//       // Update the company's total allocated points
//       await Company.findByIdAndUpdate(
//         companyId,
//         // { $inc: { totalAllocatedPoints: carryForward ? points * users.length : 0 } }, // Only add to total if carryForward is true
//         { $inc: { totalAllocatedPoints: points * users?.length } },
//         { session }
//       );

//       // Commit the transaction
//       await session.commitTransaction();
//       session.endSession();

//       res.status(200).json({
//         message: `Successfully distributed ${points} points to ${users.length} active users`,
//       });
//     } catch (error) {
//       // Rollback in case of error
//       await session.abortTransaction();
//       session.endSession();
//       console.error(error);
//       res.status(500).json({ message: "Error distributing points", error });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };


exports.pointsDistributeByCompany = async (req, res) => {
  try {
    const { points, carryForward = true } = req.body; // Default carryForward to true
    const companyId = req.user.company.toString(); // Extracting company ID from req.user

    if (!points || points <= 0) {
      return res.status(400).json({ message: "Points must be greater than 0" });
    }

    // Get all active users belonging to the company
    const users = await User.find({ company: companyId, status: "active" });

    if (!users.length) {
      return res.status(404).json({ message: "No active users found for this company" });
    }

    // Start a session for transaction safety
    const session = await UserWallet.startSession();
    session.startTransaction();

    try {
      // Ensure all operations inside the transaction use the session
      for (const user of users) {
        // Create a new transaction for each active user
        await PointsTransaction.create(
          [{
            sender: null, // Company allocation, no sender
            receiver: user._id,
            company: companyId,
            points: points, // Each user gets the full allocated points
            type: "company_allocation",
          }],
          { session } // Attach session
        );

        // Update user wallet
        if (carryForward) {
          // Add points to existing company points
          await UserWallet.findOneAndUpdate(
            { user: user._id, company: companyId },
            { $inc: { companyPoints: points } },
            { upsert: true, new: true, session }
          );
        } else {
          // Reset company points and set new value
          await UserWallet.findOneAndUpdate(
            { user: user._id, company: companyId },
            { companyPoints: points }, // Overwrite instead of incrementing
            { upsert: true, new: true, session }
          );
        }
      }

      // Update the company's total allocated points
      await Company.findByIdAndUpdate(
        companyId,
        { $inc: { totalAllocatedPoints: points * users.length } }, // Always increment
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
    } catch (error) {
      // Rollback in case of error
      await session.abortTransaction();
      console.error("Transaction Error:", error);
      return res.status(500).json({ message: "Error distributing points", error });
    } finally {
      session.endSession(); // Ensure session is always closed
    }

    res.status(200).json({
      message: `Successfully distributed ${points} points to ${users.length} active users`,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



// exports.userToUserTransaction = async (req, res) => {
//   try {
//     const senderId = req.user.id; // Extract sender ID from request
//     const companyId = req.user.company.toString(); // Extract company ID

//     const { users } = req.body; // Get the list of users to receive points

//     if (!users || users.length === 0) {
//       return res.status(400).json({ message: "Users list is required" });
//     }

//     // Extract points per user and calculate total points needed
//     const pointsPerUser = users[0].points;
//     const totalPointsNeeded = pointsPerUser * users.length;

//     // Fetch sender's wallet to check available personal points
//     const senderWallet = await UserWallet.findOne({ user: senderId, company: companyId });

//     if (!senderWallet) {
//       return res.status(400).json({ message: "Sender wallet not found" });
//     }
//     // console.log( senderWallet.personalPoints,"senderWallet.personalPoints")
//     // console.log( totalPointsNeeded,"totalPointsNeeded")
//     if (senderWallet.companyPoints < totalPointsNeeded) {
//       return res.status(400).json({ message: "Insufficient points in wallet" });
//     }

//     // Start MongoDB transaction
//     const session = await UserWallet.startSession();
//     session.startTransaction();

//     try {
//       const transactionPromises = users.map(async (user) => {
//         // Transfer points from sender to each receiver
//         await PointsTransaction.create(
//           [
//             {
//               sender: senderId,
//               receiver: user.id,
//               company: companyId,
//               points: pointsPerUser,
//               type: "user_transfer",
//               note: user.note || "", // Include note if provided
//             },
//           ],
//           { session }
//         );

//         // Deduct points from sender's personal points
//         await UserWallet.findOneAndUpdate(
//           { user: senderId, company: companyId },
//           { $inc: { companyPoints: -pointsPerUser } },
//           { session }
//         );

//         // Add points to receiver's personal points
//         await UserWallet.findOneAndUpdate(
//           { user: user.id, company: companyId },
//           { $inc: { personalPoints: pointsPerUser } },
//           { upsert: true, new: true, session }
//         );
//       });

//       await Promise.all(transactionPromises);

//       // Commit transaction
//       await session.commitTransaction();
//       session.endSession();

//       res.status(200).json({
//         message: `Successfully transferred ${totalPointsNeeded} points each to ${users.length} users.`,
//       });
//     } catch (error) {
//       await session.abortTransaction();
//       session.endSession();
//       console.error("Transaction Error:", error);
//       res.status(500).json({ message: "Error processing transactions", error });
//     }
//   } catch (error) {
//     console.error("Server Error:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };



exports.userToUserTransaction = async (req, res) => {
  const session = await mongoose.startSession(); // Start a session
  try {
    session.startTransaction(); // Start transaction

    const senderId = req.user.id; // Extract sender ID from request
    const companyId = req.user.company.toString(); // Extract company ID
    const { users } = req.body; // Get list of users to receive points

    if (!users || users.length === 0) {
      return res.status(400).json({ message: "Users list is required" });
    }

    // Extract points per user and calculate total points needed
    const pointsPerUser = users[0].points;
    const totalPointsNeeded = pointsPerUser * users.length;

    // Fetch sender's wallet to check available company points
    const senderWallet = await UserWallet.findOne({ user: senderId, company: companyId }).session(session);

    if (!senderWallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Sender wallet not found" });
    }

    if (senderWallet.companyPoints < totalPointsNeeded) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient points in wallet" });
    }

    // Process transactions sequentially to avoid transaction number mismatch
    for (const user of users) {
      // Create transaction record
      await PointsTransaction.create(
        [
          {
            sender: senderId,
            receiver: user.id,
            company: companyId,
            points: pointsPerUser,
            type: "user_transfer",
            note: user.note || "",
          },
        ],
        { session }
      );

      // Deduct points from sender's company points
      await UserWallet.findOneAndUpdate(
        { user: senderId, company: companyId },
        { $inc: { companyPoints: -pointsPerUser } },
        { session }
      );

      // Add points to receiver's personal points
      await UserWallet.findOneAndUpdate(
        { user: user.id, company: companyId },
        { $inc: { personalPoints: pointsPerUser } },
        { upsert: true, new: true, session }
      );
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `Successfully transferred ${totalPointsNeeded} points each to ${users.length} users.`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction Error:", error);
    res.status(500).json({ message: "Error processing transactions", error });
  }
};




exports.getUserPointHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Logged-in user ID

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch transactions where the user is sender or receiver
    const transactions = await PointsTransaction.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "firstName lastName _id") // Get sender details
      .populate("receiver", "firstName lastName _id") // Get receiver details
      .populate("company", "name _id") // Get company details
      .sort({ createdAt: -1 }); // Show latest transactions first

    if (!transactions.length) {
      return res.status(200).json({ message: "No transaction history found.", transactions: [] });
    }

    // Format response
    const formattedTransactions = transactions.map((txn) => {
      const isSender = txn.sender && txn.sender._id.toString() === userId;
      const isReceiver = txn.receiver && txn.receiver._id.toString() === userId;

      return {
        _id: txn._id,
        type: txn.type,
        points: isSender ? -txn.points : txn.points, // Negative points if sender
        note: txn.note || "",
        sender:
          txn.sender && txn.type === "user_transfer"
            ? {
                id: txn.sender._id, // Replace logged-in user ID with "You"
                name: isSender ? "You" : `${txn.sender.firstName} ${txn.sender.lastName}`,
              }
            : { id: "Company", name: txn.company.name }, // Company allocation
        receiver: {
          id: txn.receiver._id, // Replace logged-in user ID with "You"
          name: isReceiver ? "You" : `${txn.receiver.firstName} ${txn.receiver.lastName}`,
        },
        createdAt: txn.createdAt,
      };
    });

    res.status(200).json({ transactions: formattedTransactions });
  } catch (error) {
    console.error("Error fetching user transaction history:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


exports.getReceivedUserTransfers = async (req, res) => {
  try {
    const userId = req.user.id; // Extract logged-in user ID
    const companyId = req.user.company.toString(); // Extract company ID

    if (!userId || !companyId) {
      return res.status(400).json({ message: "User ID and Company ID are required." });
    }

    // Fetch personal points from UserWallet
    const userWallet = await UserWallet.findOne({ user: userId, company: companyId });

    // Fetch transactions where the logged-in user is the receiver and type is "user_transfer"
    const transactions = await PointsTransaction.find({
      receiver: userId,
      type: "user_transfer",
    })
      .populate("sender", "firstName lastName _id") // Get sender details
      .populate("company", "name _id") // Get company details
      .sort({ createdAt: -1 }); // Show latest transactions first

    // Format transactions
    const formattedTransactions = transactions.map((txn) => ({
      _id: txn._id,
      points: txn.points,
      note: txn.note || "",
      sender: {
        id:  txn.sender._id ,
        name: `${txn.sender.firstName} ${txn.sender.lastName}` ,
      },
      receiver: { id: txn.receiver._id, name: "You" }, // Logged-in user as receiver
      createdAt: txn.createdAt,
    }));

    res.status(200).json({
      personalPoints: userWallet ? userWallet.personalPoints : 0, // Return personal points or 0 if wallet not found
      transactions: formattedTransactions.length ? formattedTransactions : [],
      message: formattedTransactions.length ? "Transactions found." : "No transactions found.",
    });
  } catch (error) {
    console.error("Error fetching received transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



exports.getPointsGivenLastHour = async (req, res) => {
  try {
    const userId = req.user.id; // Extract logged-in user ID

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Calculate timestamp for 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Fetch transactions where the logged-in user is the sender & created within last hour
    const transactions = await PointsTransaction.find({
      sender: userId,
      type: "user_transfer",
      createdAt: { $gte: oneHourAgo }, // Filter only last 1 hour transactions
    })
      .populate("receiver", "firstName lastName _id") // Get receiver details
      .populate("company", "name _id") // Get company details
      .sort({ createdAt: -1 }); // Show latest transactions first

    // Format transactions
    const formattedTransactions = transactions.map((txn) => ({
      _id: txn._id,
      points: -txn.points, // Show points in negative as they were given
      note: txn.note || "",
      sender: { id: txn.sender._id, name: "You" }, // Logged-in user as sender
      receiver: {
        id: txn.receiver._id ,
        name: `${txn.receiver.firstName} ${txn.receiver.lastName}` 
      },
      createdAt: txn.createdAt,
    }));

    res.status(200).json({
      transactions: formattedTransactions.length ? formattedTransactions : [],
      message: formattedTransactions.length ? "Transactions found." : "No transactions found in the last hour.",
    });
  } catch (error) {
    console.error("Error fetching given points transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


exports.updateTransactionNote = async (req, res) => {
  try {
    const { transactionId, note } = req.body; // Get transaction ID and new note

    if (!transactionId || note === undefined) {
      return res.status(400).json({ message: "Transaction ID and note are required." });
    }

    // Update only the note field of the transaction
    const updatedTransaction = await PointsTransaction.findByIdAndUpdate(
      transactionId,
      { note: note.trim() }, // Ensure note is trimmed for clean data
      { new: true, select: "note" } // Return only the updated note
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    res.status(200).json({ message: "Transaction note updated successfully.", note: updatedTransaction.note });
  } catch (error) {
    console.error("Error updating transaction note:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


exports.revertTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const loggedInUserId = req.user.id; // Ensure only authorized users can revert

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required." });
    }

    // Find the original transaction
    const transaction = await PointsTransaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    // Ensure the transaction is a user transfer (not company allocation)
    if (transaction.type !== "user_transfer") {
      return res.status(400).json({ message: "Only user transfers can be reverted." });
    }

    // Ensure the logged-in user is the sender
    if (transaction.sender.toString() !== loggedInUserId) {
      return res.status(403).json({ message: "You can only revert your own transactions." });
    }

    // Check if the transaction was created within the last 30 minutes
    const transactionTime = new Date(transaction.createdAt);
    const now = new Date();
    const minutesDiff = (now - transactionTime) / (1000 * 60); // Convert milliseconds to minutes

    if (minutesDiff > 30) {
      return res.status(400).json({ message: "Transaction can only be reverted within 30 minutes." });
    }

    // Start a MongoDB session for transaction safety
    const session = await UserWallet.startSession();
    session.startTransaction();

    try {
      // Restore points to the sender
      await UserWallet.findOneAndUpdate(
        { user: transaction.sender, company: transaction.company },
        { $inc: { companyPoints: transaction.points } },
        { session }
      );

      // Deduct points from the receiver
      await UserWallet.findOneAndUpdate(
        { user: transaction.receiver, company: transaction.company },
        { $inc: { personalPoints: -transaction.points } },
        { session }
      );

      // Create a reversal transaction entry
      const reversalTransaction = new PointsTransaction({
        sender: transaction.receiver, // Reverse sender and receiver
        receiver: transaction.sender,
        company: transaction.company,
        points: transaction.points,
        type: "user_transfer",
        note: `Reversal of transaction ${transactionId}`,
      });

      await reversalTransaction.save({ session });

      // Delete the original transaction
      await PointsTransaction.findByIdAndDelete(transactionId, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Transaction successfully reverted and deleted.",
        revertedTransactionId: reversalTransaction._id,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error reverting transaction:", error);
      res.status(500).json({ message: "Error reverting transaction.", error });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error.", error });
  }
};
