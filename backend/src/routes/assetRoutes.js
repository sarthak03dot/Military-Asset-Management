const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/rbacMiddleware");
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetDetails, // Import the new function
} = require("../controllers/assetController");

const router = express.Router();

// Routes for Assets
router
  .route("/")
  .get(
    protect,
    authorize(["admin", "base_commander", "logistics_officer"]),
    getAssets
  ) // Base commander access is handled in controller
  .post(protect, authorize(["admin", "logistics_officer"]), createAsset); // Admin and Logistics Officer can create

router
  .route("/:id")
  .get(
    protect,
    authorize(["admin", "base_commander", "logistics_officer"]),
    getAssetById
  ) // Base commander access is handled in controller
  .put(protect, authorize(["admin", "logistics_officer"]), updateAsset) // Admin and Logistics Officer can update
  .delete(protect, authorize(["admin"]), deleteAsset); // Only Admin can delete

// New route for asset details with history
router.get(
  "/:id/details",
  protect,
  authorize(["admin", "base_commander", "logistics_officer"]),
  getAssetDetails
);

module.exports = router;
