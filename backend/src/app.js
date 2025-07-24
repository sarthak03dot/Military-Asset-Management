const express = require("express");
const cors = require("cors");
const morgon = require("morgan");
const pool = require("./config/index");
const authRoutes = require("./routes/authRoutes");
const baseRoutes = require("./routes/baseRoutes");
const equipmentTypeRoutes = require("./routes/equipmentTypeRoutes");
const assetRoutes = require("./routes/assetRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const transferRoutes = require("./routes/transferRoutes");
const assignmentExpenditureRoutes = require("./routes/assignmentExpenditureRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const app = express();

app.use(express.json());
app.use(morgon("dev"));

app.use(
  cors({
    // origin: "http://localhost:5173",
    origin: "https://military-asset-management-x5au.onrender.com",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to the Military Asset Management System API");
});

app.use("/api/auth", authRoutes);
app.use("/api/bases", baseRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/equipment-types", equipmentTypeRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api", assignmentExpenditureRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

module.exports = app;
