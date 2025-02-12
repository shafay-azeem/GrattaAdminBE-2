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
  getUsersByCompany
} = require("../controller/UserController");
const { isAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();

//user
router.route("/createUser").post(createUser);
router.route("/inviteUser").post(inviteUser);
router.route("/login").post(loginUser);
router.route("/getUsersByCompany/:companyId").get(getUsersByCompany)
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
router.route("/getuserDetailByresUserName/:resUserName").get(getuserDetailByresUserName);

module.exports = router;
