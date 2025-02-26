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
const points = require("./routes/PointsRoutes");
const company = require("./routes/CompanyRoutes");
const { notFound } = require("./middleware/errorMiddleware");

app.use("/api/user/V1", user);

app.use("/api/payment/V1", payment);

app.use("/api/company/V1", company);

app.use("/api/points/V1", points);

module.exports = app;
