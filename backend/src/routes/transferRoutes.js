const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
    recordTransfer,
    getHistoricalTransfers
} = require('../controllers/transferController');

const router = express.Router();

// Routes for Transfers
router.route('/')
    .post(protect, authorize(['admin', 'logistics_officer']), recordTransfer) // Admin and Logistics Officer can record transfers
    .get(protect, authorize(['admin', 'logistics_officer', 'base_commander']), getHistoricalTransfers); // All can view, but Base Commander is restricted in controller

module.exports = router;
