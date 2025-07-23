const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.route('/')
    .get(protect, authorize(['admin', 'base_commander', 'logistics_officer']), getUsers) // All can view users for dropdowns
    .post(protect, authorize(['admin']), createUser); // Only admin can create users

router.route('/:id')
    .get(protect, authorize(['admin', 'base_commander', 'logistics_officer']), getUserById) // Admin can view any, others can view self
    .put(protect, authorize(['admin']), updateUser) // Only admin can update users
    .delete(protect, authorize(['admin']), deleteUser); // Only admin can delete users

module.exports = router;
