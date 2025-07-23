const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/rbacMiddleware");

const router = express.Router();

router.post("/register", protect, authorize(["admin"]), registerUser);

router.post("/login", loginUser);

module.exports = router;
