const { MPPMilkCollection } = require("../models");
const { findRate } = require("./milkRateController");

/**
 * @desc    Create a new milk collection record
 * @route   POST /api/mpp/collection
 * @access  Private
 */
exports.createMilkCollection = async (req, res) => {
  try {
    const { farmerId, collectionDate, shift, milkType, fat, snf, quantity } =
      req.body;

    // Validate required fields
    if (
      !farmerId ||
      !collectionDate ||
      !shift ||
      !milkType ||
      !fat ||
      !snf ||
      !quantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Calculate rate using the fat/snf values
    const rate = findRate(parseFloat(fat), parseFloat(snf));

    // Calculate total amount
    const totalAmount = parseFloat(quantity) * rate;

    // Create new collection record
    const newCollection = await MPPMilkCollection.create({
      farmerId,
      collectionDate: new Date(collectionDate),
      shift,
      milkType,
      fat: parseFloat(fat),
      snf: parseFloat(snf),
      rate,
      quantity: parseFloat(quantity),
      totalAmount,
    });

    res.status(201).json({
      success: true,
      data: newCollection,
    });
  } catch (error) {
    console.error("Error in createMilkCollection:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get all milk collection records with filtering options
 * @route   GET /api/mpp/collection
 * @access  Private
 */
exports.getMilkCollections = async (req, res) => {
  try {
    const { farmerId, startDate, endDate, shift, milkType } = req.query;

    // Build filter object
    const filter = {};

    if (farmerId) filter.farmerId = farmerId;
    if (shift) filter.shift = shift.toLowerCase();
    if (milkType) filter.milkType = milkType.toUpperCase();

    // Date range filter
    if (startDate || endDate) {
      filter.collectionDate = {};
      if (startDate) filter.collectionDate.$gte = new Date(startDate);
      if (endDate) filter.collectionDate.$lte = new Date(endDate);
    }

    // Fetch records with filter
    const collections = await MPPMilkCollection.find(filter)
      .sort({ collectionDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections,
    });
  } catch (error) {
    console.error("Error in getMilkCollections:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get a single milk collection record
 * @route   GET /api/mpp/collection/:id
 * @access  Private
 */
exports.getMilkCollection = async (req, res) => {
  try {
    const collection = await MPPMilkCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Milk collection record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (error) {
    console.error("Error in getMilkCollection:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Update a milk collection record
 * @route   PUT /api/mpp/collection/:id
 * @access  Private
 */
exports.updateMilkCollection = async (req, res) => {
  try {
    const { farmerId, collectionDate, shift, milkType, fat, snf, quantity } =
      req.body;

    // Find the collection record
    let collection = await MPPMilkCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Milk collection record not found",
      });
    }

    // Update fields
    if (farmerId) collection.farmerId = farmerId;
    if (collectionDate) collection.collectionDate = new Date(collectionDate);
    if (shift) collection.shift = shift;
    if (milkType) collection.milkType = milkType;

    // If fat or snf or quantity changed, recalculate rate and total amount
    if (fat || snf || quantity) {
      const newFat = fat ? parseFloat(fat) : collection.fat;
      const newSnf = snf ? parseFloat(snf) : collection.snf;
      const newQuantity = quantity ? parseFloat(quantity) : collection.quantity;

      // Update values
      collection.fat = newFat;
      collection.snf = newSnf;
      collection.quantity = newQuantity;

      // Recalculate rate and total amount
      collection.rate = findRate(newFat, newSnf);
      collection.totalAmount = collection.rate * newQuantity;
    }

    // Save updated record
    await collection.save();

    res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (error) {
    console.error("Error in updateMilkCollection:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Delete a milk collection record
 * @route   DELETE /api/mpp/collection/:id
 * @access  Private
 */
exports.deleteMilkCollection = async (req, res) => {
  try {
    const collection = await MPPMilkCollection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Milk collection record not found",
      });
    }

    await collection.deleteOne();

    res.status(200).json({
      success: true,
      message: "Milk collection record deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteMilkCollection:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get milk collection statistics
 * @route   GET /api/mpp/collection/stats
 * @access  Private
 */
exports.getMilkCollectionStats = async (req, res) => {
  try {
    const { farmerId, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};

    if (farmerId) filter.farmerId = farmerId;

    // Date range filter
    if (startDate || endDate) {
      filter.collectionDate = {};
      if (startDate) filter.collectionDate.$gte = new Date(startDate);
      if (endDate) filter.collectionDate.$lte = new Date(endDate);
    }

    // Run aggregation pipeline
    const stats = await MPPMilkCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          avgFat: { $avg: "$fat" },
          avgSnf: { $avg: "$snf" },
          recordCount: { $sum: 1 },
          avgRate: { $avg: "$rate" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data:
        stats.length > 0
          ? stats[0]
          : {
              totalQuantity: 0,
              totalAmount: 0,
              avgFat: 0,
              avgSnf: 0,
              recordCount: 0,
              avgRate: 0,
            },
    });
  } catch (error) {
    console.error("Error in getMilkCollectionStats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get milk collection by shift (morning/evening)
 * @route   GET /api/mpp/collection/by-shift
 * @access  Private
 */
exports.getMilkCollectionByShift = async (req, res) => {
  try {
    const { startDate, endDate, farmerId } = req.query;

    // Build filter object
    const filter = {};

    if (farmerId) filter.farmerId = farmerId;

    // Date range filter
    if (startDate || endDate) {
      filter.collectionDate = {};
      if (startDate) filter.collectionDate.$gte = new Date(startDate);
      if (endDate) filter.collectionDate.$lte = new Date(endDate);
    }

    // Run aggregation pipeline
    const shiftStats = await MPPMilkCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$shift",
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          avgFat: { $avg: "$fat" },
          avgSnf: { $avg: "$snf" },
          recordCount: { $sum: 1 },
        },
      },
    ]);

    // Format response
    const formattedStats = {};
    shiftStats.forEach((stat) => {
      formattedStats[stat._id] = {
        totalQuantity: stat.totalQuantity,
        totalAmount: stat.totalAmount,
        avgFat: stat.avgFat,
        avgSnf: stat.avgSnf,
        recordCount: stat.recordCount,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    console.error("Error in getMilkCollectionByShift:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get total MPP amount for finance
 * @route   GET /api/mpp/finance/total
 * @access  Private
 */
exports.getMPPFinanceTotal = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter object
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.collectionDate = {};
      if (startDate) filter.collectionDate.$gte = new Date(startDate);
      if (endDate) filter.collectionDate.$lte = new Date(endDate);
    }

    // Run aggregation pipeline to calculate total amount
    const result = await MPPMilkCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format the response
    const financeData = {
      totalAmount: result.length > 0 ? result[0].totalAmount : 0,
      totalQuantity: result.length > 0 ? result[0].totalQuantity : 0,
      count: result.length > 0 ? result[0].count : 0,
      currency: "₹"
    };

    res.status(200).json({
      success: true,
      data: financeData
    });
  } catch (error) {
    console.error("Error in getMPPFinanceTotal:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
