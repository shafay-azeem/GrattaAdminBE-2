const express = require("express");
const {
  createUser,
  loginUser,
  updateProfile,
  deleteUser,
  getAllUsers,
  deleteAllUsers,
  forgotPassword,
  resetPassword,
  userDetail,
  logout,
  getuserDetailById,
  getuserDetailByresUserName,
  acceptInvitation,
  inviteUser,
  getUsersByCompany,
  deleteUserById,
  bulkInvite,
  getActiveUserCountByCompanyId,
  getUserCompanyPoints,
  getCompanyUsers,
  getUserPersonalPoints
} = require("../controller/UserController");
const { isAuthenticatedUser } = require("../middleware/auth");
const fs = require("fs");
const path = require("path"); // Added the missing path module
const multer = require("multer");

const router = express.Router();

// Step 1: Ensure the uploads folder exists
//const uploadsDirectory = path.join(__dirname, "../uploads");
const uploadsDirectory = "/tmp";
function ensureUploadsFolder(req, res, next) {
  if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
  }
  next();
}

// Step 2: Configure Multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // Provide the uploads directory
    callback(null, uploadsDirectory);
  },
  filename: function (req, file, callback) {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    callback(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Step 3: Set up the route
router.post(
  "/bulkInvite",
  isAuthenticatedUser,
  ensureUploadsFolder, // Ensures folder is present
  upload.single("inviteFile"), // Single file upload with field name 'inviteFile'
  bulkInvite // The controller function
);

//user
router.route("/createUser").post(createUser);
router.route("/inviteUser").post(inviteUser);
router.route("/getActiveUserCountByCompanyId").get(isAuthenticatedUser,getActiveUserCountByCompanyId);
router.route("/getCompanyUsers").get(isAuthenticatedUser,getCompanyUsers);
router.route("/getUserPersonalPoints").get(isAuthenticatedUser,getUserPersonalPoints);
router.route("/getUserCompanyPoints").get(isAuthenticatedUser,getUserCompanyPoints);
router.route("/login").post(loginUser);
router.route("/getUsersByCompany/:companyId").get(getUsersByCompany);
router.route("/deleteUserById/:userId").delete(deleteUserById);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:token").put(resetPassword);
router.route("/acceptInvitation/:token").put(acceptInvitation);
router.route("/userDetail").get(isAuthenticatedUser, userDetail);
router.route("/getAllUsers").get(getAllUsers);
router.route("/updateProfile").put(isAuthenticatedUser, updateProfile);
router.route("/deleteUser/:id").delete(isAuthenticatedUser, deleteUser);
router.route("/deleteAllUsers").delete(deleteAllUsers);
router.route("/logout").post(isAuthenticatedUser, logout);

router.route("/getuserDetailById/:userId").get(getuserDetailById);
router
  .route("/getuserDetailByresUserName/:resUserName")
  .get(getuserDetailByresUserName);

module.exports = router;
