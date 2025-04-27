const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { protect } = require("../middlewares/auth");
const milkProductionController = require("../controllers/milkProductionController");

// Apply auth protection to all routes
router.use(protect);

// Get statistics and summary routes
router.get("/stats", milkProductionController.getMilkProductionStats);
router.get("/daily-summary", milkProductionController.getDailySummary);
router.get("/monthly-summary", milkProductionController.getMonthlySummary);

// Filter by cattle
router.get(
  "/cattle/:cattleId",
  milkProductionController.getMilkProductionByCattle
);

// Main milk production routes
router
  .route("/")
  .get(milkProductionController.getAllMilkProduction)
  .post(
    [
      body("cattleId").not().isEmpty().withMessage("Cattle ID is required"),
      body("date").optional().isDate().withMessage("Invalid date format"),
      body("morningAmount")
        .optional()
        .isNumeric()
        .withMessage("Morning amount must be a number"),
      body("eveningAmount")
        .optional()
        .isNumeric()
        .withMessage("Evening amount must be a number"),
      body("shift")
        .optional()
        .isIn(["morning", "evening"])
        .withMessage("Shift must be either 'morning' or 'evening'"),
      body("notes").optional().isString(),
    ],
    milkProductionController.createMilkProduction
  );

// Specific milk production record routes by ID
router
  .route("/:id")
  .get(milkProductionController.getMilkProduction)
  .put(
    [
      body("cattleId")
        .optional()
        .not()
        .isEmpty()
        .withMessage("Cattle ID is required"),
      body("date").optional().isDate().withMessage("Invalid date format"),
      body("morningAmount")
        .optional()
        .isNumeric()
        .withMessage("Morning amount must be a number"),
      body("eveningAmount")
        .optional()
        .isNumeric()
        .withMessage("Evening amount must be a number"),
      body("shift")
        .optional()
        .isIn(["morning", "evening"])
        .withMessage("Shift must be either 'morning' or 'evening'"),
      body("notes").optional().isString(),
    ],
    milkProductionController.updateMilkProduction
  )
  .delete(milkProductionController.deleteMilkProduction);

// Bulk record routes
router.post(
  "/bulk",
  [
    body("records")
      .isArray({ min: 1 })
      .withMessage("At least one record is required"),
    body("records.*.cattleId")
      .not()
      .isEmpty()
      .withMessage("Cattle ID is required for each record"),
    body("records.*.date")
      .optional()
      .isDate()
      .withMessage("Invalid date format for one or more records"),
    body("records.*.morningAmount")
      .optional()
      .isNumeric()
      .withMessage("Morning amount must be a number for each record"),
    body("records.*.eveningAmount")
      .optional()
      .isNumeric()
      .withMessage("Evening amount must be a number for each record"),
    body("records.*.shift")
      .optional()
      .isIn(["morning", "evening"])
      .withMessage(
        "Shift must be either 'morning' or 'evening' for each record"
      ),
  ],
  milkProductionController.createBulkMilkProduction
);

module.exports = router;
