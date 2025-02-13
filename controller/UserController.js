const User = require("../models/UserModel");
const Company = require("../models/CompanyModel");

const sendMail = require("../utils/SendMail");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

//SignUp User --Post
exports.createUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, companyName, email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Check if the company exists
    let company = await Company.findOne({ name: companyName });
    if (company) {
      return res.status(400).json({
        success: false,
        message:
          "Company already exists. Please provide a unique company name.",
      });
    }
    // Create the company
    company = await Company.create({ name: companyName });

    // Create the user
    user = await User.create({
      firstName,
      lastName,
      email,
      password,
      company: company._id, // Link the user to the company
    });

    user = await User.findById(user._id).populate("company", "name");

    // Send onboarding email
    await sendMail({
      email: user.email,
      subject: "Onboarded Successfully",
      message: "Welcome To Gratta Dashboard",
    });
    return res.status(201).json({
      success: true,
      user,
      message: "Signup Successfully",
      token: user.getJwtToken(user._id),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//login --Post
exports.loginUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const error = new Error("Please Enter Your All Fields");
      error.statusCode = 422;
      throw error;
    }
    const user = await User.findOne({ email })
      .select("+password")
      .populate("company", "name");
    if (!user) {
      const error = new Error("User is not found with this email");
      error.statusCode = 401;
      throw error;
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      const error = new Error("Password is in correct");
      error.statusCode = 401;
      throw error;
    }
    return res.status(200).json({
      success: true,
      user,
      message: "Login Successfully",
      token: user.getJwtToken(user._id),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//Forgot Password --Post
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      const error = new Error("User is not found with this email");
      error.statusCode = 404;
      throw error;
    }

    const resetToken = user.getResetToken();
    await user.save({
      validateBeforeSave: false,
    });

    // const resetPasswordUrl = `${req.protocol}://${req.get(
    //   "host"
    // )}/ResetPassword/${resetToken}`;

    const resetPasswordUrl = `https://gratta-admin-fe.vercel.app/ResetPassword/${resetToken}`;

    const message = `Your password reset token is : \n\n ${resetPasswordUrl}`;

    try {
      await sendMail({
        email: user.email,
        subject: `Gratta Admin Password Recovery`,
        message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} succesfully`,
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordTime = undefined;
      await user.save({
        validateBeforeSave: false,
      });
      const error = new Error(`${err.message}`);
      error.statusCode = 404;
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//Reset Password --Post
exports.resetPassword = asyncHandler(async (req, res, next) => {
  try {
    //Create Token Hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordTime: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error(
        "Reset password url is invalid or has been expired"
      );
      error.statusCode = 422;
      throw error;
    }

    if (req.body.password !== req.body.confirmPassword) {
      const error = new Error("Password Must be same in Both Fields");
      error.statusCode = 400;
      throw error;
    }

    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.resetPasswordTime = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//Update User --Post
exports.updateProfile = asyncHandler(async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;
    let user = await User.findById(req.user.id).populate("company", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this ID",
      });
    }

    // Update only firstName and lastName
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.company ? user.company.name : null,
      },
      message: "User updated successfully",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//Delete User --Post
exports.deleteUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this ID",
      });
    }

    await User.deleteOne({ _id: user._id });
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//Get All Users --Get
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  try {
    const users = await User.find().populate("company", "name").exec();
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Users not found",
      });
    }
    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//Delete All Users
exports.deleteAllUsers = asyncHandler(async (req, res, next) => {
  try {
    let users;
    users = await User.deleteMany();
    res.status(200).json({
      success: true,
      message: "All Users Deleted Successfully",
    });
  } catch (error) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

//NOT IN USE
//User Detail --Get
exports.userDetail = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = decoded;
    const stringId = req.user.id;

    if (mongoose.Types.ObjectId.isValid(stringId)) {
      const objectId = mongoose.Types.ObjectId(stringId);
      User.findById(objectId)
        .then((user) => {
          if (!user) {
            return res.status(404).json({
              success: false,
              message: "User not found",
            });
          }
          res.status(200).json({
            success: true,
            user,
          });
        })
        .catch((error) => {
          res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error,
          });
        });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid Id passed",
      });
    }
  });
});

//NOT IN USE
//Logout User --Get
exports.logout = asyncHandler(async (req, res, next) => {
  //console.log(process.env.JWT_SECRET_KEY);
  //Verify JWT
  jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET_KEY,
    (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Invalid token" });
      }

      // Invalidate JWT
      decoded.logout = true;

      // Send response
      res.status(200).send({ message: "Successfully logged out" });
    }
  );
});

exports.getuserDetailByresUserName = asyncHandler(async (req, res, next) => {
  const resUserName = req.params.resUserName;
  try {
    const user = await User.findOne({ resUserName: resUserName });
    if (!user) {
      const error = new Error("User Not Found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

exports.getuserDetailById = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "company",
      "name"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this ID",
      });
    }
    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});

// Invite a new user
exports.inviteUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, companyId, role } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }

    // Check if the company exists
    let company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: "Company not found." });
    }

    // Create user with invited status
    user = await User.create({
      firstName,
      lastName,
      email,
      company: companyId,
      role: role || "team_member",
      status: "invited",
    });

    // Generate reset token for setting password
    const resetToken = user.getResetToken();
    await user.save({ validateBeforeSave: false });

    // Construct reset password URL
    // https://gratta-admin-fe.vercel.app/ResetPassword/${resetToken}
    const resetPasswordUrl = `https://gratta-admin-fe.vercel.app/setPassword/${resetToken}`;

    // Email message
    const message = `Hello ${firstName},\n\nYou have been invited to join ${
      company.name
    } as a ${
      role || "team_member"
    }.\nClick the link below to set your password and activate your account:\n${resetPasswordUrl}\n\nRegards,\nYour Team`;

    await sendMail({ email: user.email, subject: "You're Invited!", message });

    res.status(201).json({
      success: true,
      message: "Invitation sent successfully.",
    });
  } catch (error) {
    next(error);
  }
});

// Accept invitation and set password
exports.acceptInvitation = asyncHandler(async (req, res, next) => {
  try {
    // Hash the token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordTime: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token." });
    }

    // Validate passwords
    if (req.body.password !== req.body.confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    // Hash new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTime = undefined;
    user.status = "active";

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password set successfully. Your account is now active.",
    });
  } catch (error) {
    next(error);
  }
});

// Get Users by Company ID -- GET
exports.getUsersByCompany = asyncHandler(async (req, res, next) => {
  try {
    const { companyId } = req.params; // Get companyId from request parameters

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    // Fetch users belonging to the provided companyId
    const users = await User.find({ company: companyId })
      .populate("company", "name") // Populate company details if needed
      .exec();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found for this company",
      });
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});
