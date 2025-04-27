const express = require("express");
const router = express.Router();
const cattleController = require("../controllers/cattleController");
const { protect } = require("../middlewares/auth");

// Apply auth protection to all routes
router.use(protect);

// IMPORTANT: More specific routes must come BEFORE parameterized routes
// Get cattle by tag ID (must be before /:id routes)
router.get("/tag/:tagId", cattleController.getCattleByTagId);

// Get statistics routes
router.get("/stats", cattleController.getCattleStats);
router.get("/breeds-summary", cattleController.getBreedsSummary);

// Main cattle routes
router
  .route("/")
  .get(cattleController.getAllCattle)
  .post(cattleController.createCattle);

// Specific cattle routes by ID
router
  .route("/:id")
  .get(cattleController.getCattle)
  .put(cattleController.updateCattle)
  .delete(cattleController.deleteCattle);

// Health management routes
router.post("/:id/vaccinations", cattleController.addVaccination);
router.post("/:id/medical-records", cattleController.addMedicalRecord);
router.put("/:id/health-status", cattleController.updateHealthStatus);

// Status management
router.put("/:id/status", cattleController.changeCattleStatus);

module.exports = router;
