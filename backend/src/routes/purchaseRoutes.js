const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
    recordPurchase,
    getHistoricalPurchases
} = require('../controllers/purchaseController');

const router = express.Router();

// Routes for Purchases
router.route('/')
    .post(protect, authorize(['admin', 'logistics_officer']), recordPurchase) // Admin and Logistics Officer can record purchases
    .get(protect, authorize(['admin', 'logistics_officer', 'base_commander']), getHistoricalPurchases); // All can view, but Base Commander is restricted in controller

module.exports = router;
