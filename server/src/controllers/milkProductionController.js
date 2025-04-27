const { validationResult } = require("express-validator");
const MilkProduction = require("../models/milkProduction");
const mongoose = require("mongoose");

// Helper function to check for validation errors
const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

// Update validation to use shift-based structure
const validateMilkProduction = (data) => {
  const { cattleId, date, shift, amount, notes } = data;

  const errors = {};

  if (!cattleId) errors.cattleId = "Cattle ID is required";
  if (!date) errors.date = "Date is required";
  if (!shift) errors.shift = "Shift is required";
  if (!["morning", "evening"].includes(shift))
    errors.shift = "Shift must be 'morning' or 'evening'";

  if (amount === undefined || amount === null || amount === "") {
    errors.amount = "Amount is required";
  } else if (isNaN(amount) || parseFloat(amount) < 0) {
    errors.amount = "Amount must be a non-negative number";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

// @desc    Get all milk production records with pagination and filtering
// @route   GET /api/milk-production
// @access  Private
exports.getAllMilkProduction = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      cattle,
      startDate,
      endDate,
      sort,
    } = req.query;

    // Build filter object
    const filter = {};

    if (cattle) {
      filter.cattleId = cattle;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Build sort object
    const sortOptions = {};
    if (sort) {
      // Handle sort format like date:desc,amount:asc
      const sortFields = sort.split(",");
      sortFields.forEach((field) => {
        const [key, order] = field.split(":");
        sortOptions[key] = order === "desc" ? -1 : 1;
      });
    } else {
      // Default sort by date descending
      sortOptions.date = -1;
    }

    // Execute query with pagination
    const records = await MilkProduction.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("cattleId", "tagId name breed")
      .populate("recordedBy", "name");

    // Get total count for pagination
    const total = await MilkProduction.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: records,
    });
  } catch (error) {
    console.error("Error in getAllMilkProduction:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get a single milk production record
// @route   GET /api/milk-production/:id
// @access  Private
exports.getMilkProduction = async (req, res) => {
  try {
    const record = await MilkProduction.findById(req.params.id)
      .populate("cattleId", "tagId name breed")
      .populate("recordedBy", "name");

    if (!record) {
      return res
        .status(404)
        .json({ error: "Milk production record not found" });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Error in getMilkProduction:", error);

    // Check if error is due to invalid ID format
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid record ID format" });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Create new milk production record
// @route   POST /api/milk-production
// @access  Private
exports.createMilkProduction = async (req, res) => {
  try {
    // Check for validation errors
    const validationError = checkValidation(req, res);
    if (validationError) return validationError;

    const { cattleId, date, morningAmount, eveningAmount, shift, notes } =
      req.body;

    // Format the date to remove time component for comparison
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    // Check if a record already exists for this cattle on this date
    let existingRecord = await MilkProduction.findOne({
      cattleId,
      date: {
        $gte: formattedDate,
        $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    let result;

    if (existingRecord) {
      // If record exists, update the appropriate shift amount
      const updateData = { ...existingRecord.toObject() };

      // If shift is specified, only update that shift's amount
      if (shift === "morning") {
        updateData.morningAmount =
          (existingRecord.morningAmount || 0) +
          (parseFloat(morningAmount) || 0);
      } else if (shift === "evening") {
        updateData.eveningAmount =
          (existingRecord.eveningAmount || 0) +
          (parseFloat(eveningAmount) || 0);
      } else {
        // If no shift specified, update both values
        updateData.morningAmount =
          (existingRecord.morningAmount || 0) +
          (parseFloat(morningAmount) || 0);
        updateData.eveningAmount =
          (existingRecord.eveningAmount || 0) +
          (parseFloat(eveningAmount) || 0);
      }

      // Update notes if provided
      if (notes) {
        updateData.notes = notes;
      }

      // Update the record
      result = await MilkProduction.findByIdAndUpdate(
        existingRecord._id,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        data: result,
        updated: true,
      });
    } else {
      // Create a new record with user ID from auth middleware
      const recordData = {
        cattleId,
        date: formattedDate,
        morningAmount: shift === "morning" ? morningAmount : 0,
        eveningAmount: shift === "evening" ? eveningAmount : 0,
        notes,
        recordedBy: req.user.id,
      };

      // If no shift specified, use the values as provided
      if (!shift) {
        recordData.morningAmount = morningAmount;
        recordData.eveningAmount = eveningAmount;
      }

      const record = new MilkProduction(recordData);

      // Save record
      await record.save();

      res.status(201).json({
        success: true,
        data: record,
      });
    }
  } catch (error) {
    console.error("Error in createMilkProduction:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Update milk production record
// @route   PUT /api/milk-production/:id
// @access  Private
exports.updateMilkProduction = async (req, res) => {
  try {
    // Check for validation errors
    const validationError = checkValidation(req, res);
    if (validationError) return validationError;

    // Find record
    let record = await MilkProduction.findById(req.params.id);

    if (!record) {
      return res
        .status(404)
        .json({ error: "Milk production record not found" });
    }

    // Update record
    record = await MilkProduction.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Error in updateMilkProduction:", error);

    // Check if error is due to invalid ID format
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid record ID format" });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Delete milk production record
// @route   DELETE /api/milk-production/:id
// @access  Private
exports.deleteMilkProduction = async (req, res) => {
  try {
    const record = await MilkProduction.findById(req.params.id);

    if (!record) {
      return res
        .status(404)
        .json({ error: "Milk production record not found" });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Error in deleteMilkProduction:", error);

    // Check if error is due to invalid ID format
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid record ID format" });
    }

    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get milk production by cattle ID
// @route   GET /api/milk-production/cattle/:cattleId
// @access  Private
exports.getMilkProductionByCattle = async (req, res) => {
  try {
    const { cattleId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    // Build filter
    const filter = { cattleId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await MilkProduction.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate("cattleId", "tagId name breed");

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Error in getMilkProductionByCattle:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get milk production statistics
// @route   GET /api/milk-production/stats
// @access  Private
exports.getMilkProductionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Aggregate pipeline
    const pipeline = [
      {
        $match: startDate || endDate ? { date: dateFilter } : {},
      },
      {
        $group: {
          _id: null,
          totalProduction: { $sum: "$totalAmount" },
          avgProduction: { $avg: "$totalAmount" },
          maxProduction: { $max: "$totalAmount" },
          recordCount: { $sum: 1 },
        },
      },
    ];

    const stats = await MilkProduction.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data:
        stats.length > 0
          ? stats[0]
          : {
              totalProduction: 0,
              avgProduction: 0,
              maxProduction: 0,
              recordCount: 0,
            },
    });
  } catch (error) {
    console.error("Error in getMilkProductionStats:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get daily milk production summary
// @route   GET /api/milk-production/daily-summary
// @access  Private
exports.getDailySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Aggregate pipeline for daily summary
    const pipeline = [
      {
        $match: startDate || endDate ? { date: dateFilter } : {},
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          totalProduction: { $sum: "$totalAmount" },
          morningProduction: { $sum: "$morningAmount" },
          eveningProduction: { $sum: "$eveningAmount" },
          cattleCount: { $addToSet: "$cattleId" },
          recordCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalProduction: 1,
          morningProduction: 1,
          eveningProduction: 1,
          cattleCount: { $size: "$cattleCount" },
          recordCount: 1,
        },
      },
      { $sort: { date: -1 } },
    ];

    const summary = await MilkProduction.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (error) {
    console.error("Error in getDailySummary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get monthly milk production summary
// @route   GET /api/milk-production/monthly-summary
// @access  Private
exports.getMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;

    // Build date filter for specified year or default to current year
    const startOfYear = new Date(year || new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(year || new Date().getFullYear(), 11, 31);

    // Aggregate pipeline for monthly summary
    const pipeline = [
      {
        $match: {
          date: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          totalProduction: { $sum: "$totalAmount" },
          avgDailyProduction: { $avg: "$totalAmount" },
          recordCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          totalProduction: 1,
          avgDailyProduction: 1,
          recordCount: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ];

    const summary = await MilkProduction.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (error) {
    console.error("Error in getMonthlySummary:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Create multiple milk production records
// @route   POST /api/milk-production/bulk
// @access  Private
exports.createBulkMilkProduction = async (req, res) => {
  try {
    // Check for validation errors
    const validationError = checkValidation(req, res);
    if (validationError) return validationError;

    const { records } = req.body;
    const results = [];
    const updatedRecords = [];
    const newRecords = [];

    // Process each record individually to handle updates
    for (const record of records) {
      const { cattleId, date, morningAmount, eveningAmount, shift, notes } =
        record;

      // Format the date to remove time component
      const formattedDate = new Date(date);
      formattedDate.setHours(0, 0, 0, 0);

      // Check if a record already exists for this cattle on this date
      let existingRecord = await MilkProduction.findOne({
        cattleId,
        date: {
          $gte: formattedDate,
          $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      if (existingRecord) {
        // Update existing record
        const updateData = { ...existingRecord.toObject() };

        // If shift is specified, only update that shift's amount
        if (shift === "morning") {
          updateData.morningAmount =
            (existingRecord.morningAmount || 0) +
            (parseFloat(morningAmount) || 0);
        } else if (shift === "evening") {
          updateData.eveningAmount =
            (existingRecord.eveningAmount || 0) +
            (parseFloat(eveningAmount) || 0);
        } else {
          // If no shift specified, update both values
          updateData.morningAmount =
            (existingRecord.morningAmount || 0) +
            (parseFloat(morningAmount) || 0);
          updateData.eveningAmount =
            (existingRecord.eveningAmount || 0) +
            (parseFloat(eveningAmount) || 0);
        }

        // Update notes if provided
        if (notes) {
          updateData.notes = notes;
        }

        // Update the record
        const updatedRecord = await MilkProduction.findByIdAndUpdate(
          existingRecord._id,
          updateData,
          { new: true, runValidators: true }
        );

        updatedRecords.push(updatedRecord);
        results.push(updatedRecord);
      } else {
        // Create a new record
        const recordData = {
          cattleId,
          date: formattedDate,
          morningAmount: shift === "morning" ? morningAmount : 0,
          eveningAmount: shift === "evening" ? eveningAmount : 0,
          notes,
          recordedBy: req.user.id,
        };

        // If no shift specified, use the values as provided
        if (!shift) {
          recordData.morningAmount = morningAmount;
          recordData.eveningAmount = eveningAmount;
        }

        newRecords.push(recordData);
      }
    }

    // Insert any new records in a batch
    if (newRecords.length > 0) {
      const insertedRecords = await MilkProduction.insertMany(newRecords);
      results.push(...insertedRecords);
    }

    res.status(200).json({
      success: true,
      count: results.length,
      updated: updatedRecords.length,
      created: newRecords.length,
      data: results,
    });
  } catch (error) {
    console.error("Error in createBulkMilkProduction:", error);
    res.status(500).json({ error: "Server error" });
  }
};
