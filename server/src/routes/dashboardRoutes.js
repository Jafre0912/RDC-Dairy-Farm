const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { Cattle, Transaction } = require("../models");
const MilkProduction = require("../models/milkProduction");
const mongoose = require("mongoose");

// Apply auth protection to all routes
router.use(protect);

// Get dashboard statistics for a regular user
router.get("/stats", async (req, res) => {
  try {
    // Check if user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated or invalid user ID",
      });
    }

    // For debugging
    console.log("User ID type:", typeof req.user.id);
    console.log("User ID value:", req.user.id);

    // Use userId string directly instead of converting to ObjectId
    // MongoDB will handle the conversion internally
    const userId = req.user.id;

    // Get cattle stats specific to this user
    const cattleStatsPromise = Cattle.aggregate([
      { $match: { createdBy: userId } }, // Only include user's cattle
      {
        $group: {
          _id: null,
          totalCattle: { $sum: 1 },
          activeCattle: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          healthyCattle: {
            $sum: {
              $cond: [{ $eq: ["$healthStatus.status", "healthy"] }, 1, 0],
            },
          },
          sickCattle: {
            $sum: { $cond: [{ $eq: ["$healthStatus.status", "sick"] }, 1, 0] },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // Get milk production data for this user's cattle
    const milkProductionPromise = MilkProduction.aggregate([
      {
        $lookup: {
          from: "cattle",
          localField: "cattleId",
          foreignField: "_id",
          as: "cattle",
        },
      },
      {
        $match: {
          "cattle.createdBy": userId,
        },
      },
      {
        $group: {
          _id: null,
          totalProduction: { $sum: "$totalAmount" },
          avgProduction: { $avg: "$totalAmount" },
          recordCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // Get milk production trend (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const milkTrendPromise = MilkProduction.aggregate([
      {
        $lookup: {
          from: "cattle",
          localField: "cattleId",
          foreignField: "_id",
          as: "cattle",
        },
      },
      {
        $match: {
          "cattle.createdBy": userId,
          date: { $gte: sevenDaysAgo, $lte: today },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalProduction: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalProduction: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Get finance data for this user
    const financePromise = Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
          transactionCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);

    // Get recent health alerts (sick cattle)
    const healthAlertsPromise = Cattle.find({
      createdBy: userId,
      "healthStatus.status": "sick",
    })
      .sort({ "healthStatus.updatedAt": -1 })
      .limit(3)
      .select("name tagId breed gender healthStatus");

    // Wait for all promises to resolve
    const [
      cattleStats,
      milkProductionStats,
      milkTrend,
      financeStats,
      healthAlerts,
    ] = await Promise.all([
      cattleStatsPromise,
      milkProductionPromise,
      milkTrendPromise,
      financePromise,
      healthAlertsPromise,
    ]).catch(error => {
      console.error("Error fetching dashboard data:", error);
      throw new Error("Database error while fetching dashboard statistics");
    });

    // Format data
    const dashboardData = {
      cattleStats: cattleStats.length ? cattleStats[0] : {
        totalCattle: 0,
        activeCattle: 0,
        healthyCattle: 0,
        sickCattle: 0,
      },
      milkProduction: milkProductionStats.length
        ? milkProductionStats[0]
        : {
            totalProduction: 0,
            avgProduction: 0,
            recordCount: 0,
          },
      milkTrend: milkTrend || [],
      financeStats: financeStats.length
        ? financeStats[0]
        : {
            totalIncome: 0,
            totalExpenses: 0,
            transactionCount: 0,
          },
      healthAlerts: healthAlerts || [],
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching dashboard statistics",
      message: error.message,
    });
  }
});

module.exports = router; 