const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Path to the rate chart Excel file
const rateChartPath = path.join(
  __dirname,
  "../data/rate-charts/milk_rate_chart.xlsx"
);

// Store the Excel data for lookup
let rateChartData = [];

/**
 * Loads the rate chart from Excel file
 * @returns {Array} 2D array of the rate chart data
 */
const loadRateChart = () => {
  try {
    console.log("Loading rate chart from:", rateChartPath);
    // Read the Excel file
    const workbook = xlsx.readFile(rateChartPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert to JSON with header row
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(
      `Loaded rate chart with ${jsonData.length} rows and ${
        jsonData[0]?.length || 0
      } columns`
    );

    // Return the raw data
    return jsonData;
  } catch (error) {
    console.error("Error loading rate chart:", error);
    return [];
  }
};

// Load the rate chart on application startup
try {
  rateChartData = loadRateChart();
  console.log("Rate chart loaded successfully");
} catch (error) {
  console.error("Failed to load initial rate chart:", error);
}

/**
 * Find the rate for given fat and SNF values
 * @param {Number} fat Fat percentage
 * @param {Number} snf SNF percentage
 * @returns {Number} Rate based on fat and SNF
 */
const findRate = (fat, snf) => {
  try {
    // Ensure we have data
    if (!rateChartData || !rateChartData.length) {
      console.error("Rate chart data is empty or invalid");
      return 0;
    }

    // Get SNF values from the first row (header)
    const snfValues = rateChartData[0].slice(1);

    // Convert fat and snf to strings for exact comparison
    const fatStr = fat.toString();
    const snfStr = snf.toString();

    // Find the exact or closest fat row
    let fatRowIndex = -1;
    let closestFatDiff = Number.MAX_VALUE;

    for (let i = 1; i < rateChartData.length; i++) {
      const row = rateChartData[i];
      if (row && row.length > 0) {
        const rowFat = row[0];

        // Try exact match first
        if (rowFat.toString() === fatStr) {
          fatRowIndex = i;
          break;
        }

        // Track closest match
        const diff = Math.abs(parseFloat(rowFat) - fat);
        if (diff < closestFatDiff) {
          closestFatDiff = diff;
          fatRowIndex = i;
        }
      }
    }

    if (fatRowIndex === -1) {
      console.warn(`Could not find matching fat value for ${fat}`);
      return 0;
    }

    // Find the exact or closest SNF column
    let snfColIndex = -1;
    let closestSnfDiff = Number.MAX_VALUE;

    for (let j = 0; j < snfValues.length; j++) {
      const colSnf = snfValues[j];

      // Try exact match first
      if (colSnf.toString() === snfStr) {
        snfColIndex = j;
        break;
      }

      // Track closest match
      const diff = Math.abs(parseFloat(colSnf) - snf);
      if (diff < closestSnfDiff) {
        closestSnfDiff = diff;
        snfColIndex = j;
      }
    }

    if (snfColIndex === -1) {
      console.warn(`Could not find matching SNF value for ${snf}`);
      return 0;
    }

    // Get the rate from the intersection (add 1 to snfColIndex because first column is FAT)
    const rate = rateChartData[fatRowIndex][snfColIndex + 1];
    console.log(
      `Found rate ${rate} for FAT=${fat}, SNF=${snf} at position [${fatRowIndex}][${
        snfColIndex + 1
      }]`
    );

    return parseFloat(rate) || 0;
  } catch (error) {
    console.error("Error finding rate:", error);
    return 0;
  }
};

/**
 * @desc    Get rate based on fat and SNF values
 * @route   GET /api/fat/snf
 * @access  Public
 */
exports.getRateByFatAndSnf = async (req, res) => {
  try {
    const { fat, snf } = req.query;

    // Validate input
    if (!fat || !snf) {
      return res.status(400).json({
        success: false,
        message: "Fat and SNF values are required",
      });
    }

    const fatValue = parseFloat(fat);
    const snfValue = parseFloat(snf);

    if (isNaN(fatValue) || isNaN(snfValue)) {
      return res.status(400).json({
        success: false,
        message: "Fat and SNF values must be numbers",
      });
    }

    // Get rate from chart
    const rate = findRate(fatValue, snfValue);

    return res.status(200).json({
      success: true,
      data: {
        fat: fatValue,
        snf: snfValue,
        rate,
      },
    });
  } catch (error) {
    console.error("Error in getRateByFatAndSnf:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Reload rate chart from Excel file
 * @route   GET /api/fat/snf/reload
 * @access  Admin
 */
exports.reloadRateChart = async (req, res) => {
  try {
    rateChartData = loadRateChart();

    return res.status(200).json({
      success: true,
      message: "Rate chart reloaded successfully",
      rowCount: rateChartData.length,
      columnCount: rateChartData[0]?.length || 0,
    });
  } catch (error) {
    console.error("Error in reloadRateChart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reload rate chart",
    });
  }
};

/**
 * @desc    Get available FAT and SNF values from rate chart
 * @route   GET /api/fat/snf/values
 * @access  Public
 */
exports.getAvailableValues = async (req, res) => {
  try {
    // Ensure rate chart is loaded
    if (!rateChartData || !rateChartData.length) {
      return res.status(500).json({
        success: false,
        message: "Rate chart data is not available",
      });
    }

    // Get SNF values from the first row (header) excluding the first cell
    const snfValues = rateChartData[0].slice(1).map((snf) => String(snf));

    // Get FAT values from the first column excluding the header row
    const fatValues = rateChartData.slice(1).map((row) => String(row[0]));

    return res.status(200).json({
      success: true,
      data: {
        fat: fatValues,
        snf: snfValues,
      },
    });
  } catch (error) {
    console.error("Error in getAvailableValues:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Export the findRate function for use in other controllers
exports.findRate = findRate;
