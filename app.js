const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const app = express();

app.use(express.json());

app.use(cors());

const user = require("./routes/UserRoutes");
const { notFound } = require("./middleware/errorMiddleware");

app.use("/api/user/V1", user);




module.exports = app;
