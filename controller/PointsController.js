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
