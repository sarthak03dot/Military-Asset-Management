const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
    getEquipmentTypes,
    getEquipmentTypeById,
    createEquipmentType,
    updateEquipmentType,
    deleteEquipmentType
} = require('../controllers/equipmentTypeController');

const router = express.Router();

router.route('/')
    .get(protect, authorize(['admin', 'base_commander', 'logistics_officer']), getEquipmentTypes) // All authorized users can view equipment types
    .post(protect, authorize(['admin']), createEquipmentType); // Only admin can create equipment types

router.route('/:id')
    .get(protect, authorize(['admin', 'base_commander', 'logistics_officer']), getEquipmentTypeById) // All authorized users can view a specific equipment type
    .put(protect, authorize(['admin']), updateEquipmentType) // Only admin can update equipment types
    .delete(protect, authorize(['admin']), deleteEquipmentType); // Only admin can delete equipment types

module.exports = router;
