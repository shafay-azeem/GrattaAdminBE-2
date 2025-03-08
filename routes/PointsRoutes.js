const express = require("express");
const {
    pointsDistributeByCompany,
    userToUserTransaction,
    getUserPointHistory,
    getReceivedUserTransfers,
    getPointsGivenLastHour,
    updateTransactionNote,
    revertTransaction
} = require("../controller/PointsController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();


// Create Payment Intent
router.route("/pointsDistributeByCompany").post(isAuthenticatedUser,pointsDistributeByCompany)
router.route("/userToUserTransaction").post(isAuthenticatedUser,userToUserTransaction)
router.route("/getUserPointHistory").get(isAuthenticatedUser,getUserPointHistory)
router.route("/getReceivedUserTransfers").get(isAuthenticatedUser,getReceivedUserTransfers)
router.route("/getPointsGivenLastHour").get(isAuthenticatedUser,getPointsGivenLastHour)
router.route("/updateTransactionNote").put(isAuthenticatedUser,updateTransactionNote)
router.route("/revertTransaction").put(isAuthenticatedUser,revertTransaction)



module.exports = router;