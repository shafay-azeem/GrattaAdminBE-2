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
const { checkSubscription } = require("../middleware/checkSubscription");
const router = express.Router();


// Create Payment Intent
router.route("/pointsDistributeByCompany").post(isAuthenticatedUser,checkSubscription,pointsDistributeByCompany)
router.route("/userToUserTransaction").post(isAuthenticatedUser,checkSubscription,userToUserTransaction)
router.route("/getUserPointHistory").get(isAuthenticatedUser,getUserPointHistory)
router.route("/getReceivedUserTransfers").get(isAuthenticatedUser,getReceivedUserTransfers)
router.route("/getPointsGivenLastHour").get(isAuthenticatedUser,getPointsGivenLastHour)
router.route("/updateTransactionNote").put(isAuthenticatedUser,checkSubscription,updateTransactionNote)
router.route("/revertTransaction").put(isAuthenticatedUser,checkSubscription,revertTransaction)



module.exports = router;