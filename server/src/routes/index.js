const express = require("express");
const authRoutes = require("./authRoutes");
const cattleRoutes = require("./cattleRoutes");
const milkProductionRoutes = require("./milkProductionRoutes");
const financeRoutes = require("./financeRoutes");
const diseaseRoutes = require("./diseaseRoutes");
const veterinarianRoutes = require("./veterinarianRoutes");
const adminRoutes = require("./adminRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const milkRateRoutes = require("./milkRateRoutes");
const mppRoutes = require("./mppRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/cattle", cattleRoutes);
router.use("/milk-production", milkProductionRoutes);
router.use("/finance", financeRoutes);
router.use("/disease", diseaseRoutes);
router.use("/veterinarians", veterinarianRoutes);
router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/fat/snf", milkRateRoutes);
router.use("/mpp", mppRoutes);

// Add a health check route for testing API availability
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" });
});

module.exports = router;
