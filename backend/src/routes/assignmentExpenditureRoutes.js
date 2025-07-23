const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/rbacMiddleware");
const {
  assignAsset,
  recordExpenditure,
  getHistoricalAssignments,
  getHistoricalExpenditures,
} = require("../controllers/assignmentExpenditureController");

const router = express.Router();

// Routes for Assignments
router
  .route("/assignments")
  .post(
    protect,
    authorize(["admin", "base_commander", "logistics_officer"]),
    assignAsset
  ) // All can assign, base commander restricted in controller
  .get(
    protect,
    authorize(["admin", "base_commander", "logistics_officer"]),
    getHistoricalAssignments
  ); // All can view, base commander restricted in controller

// Routes for Expenditures
router
  .route("/expenditures")
  .post(
    protect,
    authorize(["admin", "base_commander", "logistics_officer"]),
    recordExpenditure
  ) // All can record, base commander restricted in controller
  .get(
    protect,
    authorize(["admin", "base_commander", "logistics_officer"]),
    getHistoricalExpenditures
  ); // All can view, base commander restricted in controller

module.exports = router;
