const express = require("express");
const {
    pointsDistributeByCompany,
} = require("../controller/PointsController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();


// Create Payment Intent
router.route("/pointsDistributeByCompany").post(isAuthenticatedUser,pointsDistributeByCompany)


module.exports = router;