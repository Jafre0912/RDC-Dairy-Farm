const express = require("express");
const router = express.Router();
const {
  createMilkCollection,
  getMilkCollections,
  getMilkCollection,
  updateMilkCollection,
  deleteMilkCollection,
  getMilkCollectionStats,
  getMilkCollectionByShift,
  getMPPFinanceTotal,
} = require("../controllers/mppController");
const { protect } = require("../middlewares/auth");

// @route   POST /api/mpp/collection
// @desc    Create a new milk collection record
// @access  Private
router.post("/collection", protect, createMilkCollection);

// @route   GET /api/mpp/collection
// @desc    Get all milk collection records with filtering
// @access  Private
router.get("/collection", protect, getMilkCollections);

// @route   GET /api/mpp/collection/stats
// @desc    Get milk collection statistics
// @access  Private
router.get("/collection/stats", protect, getMilkCollectionStats);

// @route   GET /api/mpp/collection/by-shift
// @desc    Get milk collection by shift (morning/evening)
// @access  Private
router.get("/collection/by-shift", protect, getMilkCollectionByShift);

// @route   GET /api/mpp/collection/:id
// @desc    Get a single milk collection record
// @access  Private
router.get("/collection/:id", protect, getMilkCollection);

// @route   PUT /api/mpp/collection/:id
// @desc    Update a milk collection record
// @access  Private
router.put("/collection/:id", protect, updateMilkCollection);

// @route   DELETE /api/mpp/collection/:id
// @desc    Delete a milk collection record
// @access  Private
router.delete("/collection/:id", protect, deleteMilkCollection);

// @route   GET /api/mpp/finance/total
// @desc    Get total MPP amount for finance
// @access  Private
router.get("/finance/total", protect, getMPPFinanceTotal);

module.exports = router;
