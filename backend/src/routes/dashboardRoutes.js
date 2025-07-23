const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
    getDashboardMetrics,
    getNetMovementDetails
} = require('../controllers/dashboardController');

const router = express.Router();

// Route to get overall dashboard metrics
router.get('/metrics', protect, authorize(['admin', 'base_commander', 'logistics_officer']), getDashboardMetrics);

// Route to get detailed net movement breakdown
router.get('/net-movement-details', protect, authorize(['admin', 'base_commander', 'logistics_officer']), getNetMovementDetails);

module.exports = router;
