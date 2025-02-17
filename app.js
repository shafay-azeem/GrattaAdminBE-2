const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const app = express();



app.use(cors());

// ⚠️ Prevent `express.json()` from parsing webhook requests
app.use((req, res, next) => {
    if (req.originalUrl === "/api/payment/V1/stripe-webhook") {
      next(); // Skip `express.json()` for webhooks
    } else {
      express.json()(req, res, next);
    }
  });

const user = require("./routes/UserRoutes");
const payment = require("./routes/PaymentRoutes");
const { notFound } = require("./middleware/errorMiddleware");

app.use("/api/user/V1", user);

app.use("/api/payment/V1", payment);


module.exports = app;
