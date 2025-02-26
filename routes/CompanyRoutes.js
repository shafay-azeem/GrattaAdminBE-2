const express = require("express");
const {
    getCompanyTransactions,
} = require("../controller/CompanyController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();


// Create Payment Intent
router.route("/getCompanyTransactions").get(isAuthenticatedUser,getCompanyTransactions)


module.exports = router;