const express = require("express");
const {
    pointsDistributeByCompany,
    userToUserTransaction
} = require("../controller/PointsController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();


// Create Payment Intent
router.route("/pointsDistributeByCompany").post(isAuthenticatedUser,pointsDistributeByCompany)
router.route("/userToUserTransaction").post(isAuthenticatedUser,userToUserTransaction)
module.exports = router;