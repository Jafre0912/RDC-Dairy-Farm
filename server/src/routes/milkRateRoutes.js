const express = require("express");
const router = express.Router();
const {
  getRateByFatAndSnf,
  reloadRateChart,
  getAvailableValues,
} = require("../controllers/milkRateController");
const { protect, restrictTo } = require("../middlewares/auth");

// @route   GET /api/fat/snf
// @desc    Get rate based on fat and SNF values
// @access  Public
router.get("/", getRateByFatAndSnf);

// @route   GET /api/fat/snf/values
// @desc    Get available FAT and SNF values
// @access  Public
router.get("/values", getAvailableValues);

// @route   GET /api/fat/snf/reload
// @desc    Reload rate chart from Excel file
// @access  Admin only
router.get("/reload", protect, restrictTo("admin"), reloadRateChart);

module.exports = router;
