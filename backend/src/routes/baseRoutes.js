const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
    getBases,
    getBaseById,
    createBase,
    updateBase,
    deleteBase
} = require('../controllers/baseController');

const router = express.Router();

router.route('/')
    .get(protect, authorize(['admin', 'base_commander', 'logistics_officer']), getBases) // All authorized users can view bases
    .post(protect, authorize(['admin']), createBase); // Only admin can create bases

router.route('/:id')
    .get(protect, authorize(['admin', 'base_commander', 'logistics_officer']), getBaseById) // All authorized users can view a specific base
    .put(protect, authorize(['admin']), updateBase) // Only admin can update bases
    .delete(protect, authorize(['admin']), deleteBase); // Only admin can delete bases

module.exports = router;
