const express = require("express");
const {
    getStripeCardDetails,
    updateStripeCard
} = require("../controller/CardController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

// Route for creating payment intent (protected route)
router.route("/getStripeCardDetails").get(isAuthenticatedUser, getStripeCardDetails);
router.route("/updateStripeCard").post(isAuthenticatedUser, updateStripeCard);

module.exports = router;
