const { Cattle } = require("../models");

// Get all cattle with optional filtering - user specific
exports.getAllCattle = async (req, res) => {
  try {
    const { status, breed, gender, healthStatus } = req.query;
    const filter = { createdBy: req.user.id }; // Filter by current user

    if (status) filter.status = status;
    if (breed) filter.breed = breed;
    if (gender) filter.gender = gender;
    if (healthStatus) filter["healthStatus.status"] = healthStatus;

    const cattle = await Cattle.find(filter);
    res.status(200).json({ success: true, count: cattle.length, data: cattle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single cattle by ID - user specific
exports.getCattle = async (req, res) => {
  try {
    const cattle = await Cattle.findOne({
      _id: req.params.id,
      createdBy: req.user.id, // Ensure cattle belongs to current user
    });

    if (!cattle) {
      return res
        .status(404)
        .json({ success: false, error: "Cattle not found" });
    }

    res.status(200).json({ success: true, data: cattle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get cattle by tag ID - user specific
exports.getCattleByTagId = async (req, res) => {
  try {
    const cattle = await Cattle.findOne({
      tagId: req.params.tagId,
      createdBy: req.user.id, // Ensure cattle belongs to current user
    });

    if (!cattle) {
      return res
        .status(404)
        .json({ success: false, error: "Cattle not found" });
    }

    res.status(200).json({ success: true, data: cattle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new cattle - associate with current user
exports.createCattle = async (req, res) => {
  try {
    // Add current user as creator
    const cattleData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const cattle = await Cattle.create(cattleData);
    res.status(201).json({ success: true, data: cattle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update cattle - user specific
exports.updateCattle = async (req, res) => {
  try {
    const cattle = await Cattle.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id }, // Only update if created by user
      req.body,
      { new: true, runValidators: true }
    );

    if (!cattle) {
      return res.status(404).json({
        success: false,
        error: "Cattle not found or you don't have permission",
      });
    }

    res.status(200).json({ success: true, data: cattle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete cattle - user specific
exports.deleteCattle = async (req, res) => {
  try {
    const cattle = await Cattle.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id, // Only delete if created by user
    });

    if (!cattle) {
      return res.status(404).json({
        success: false,
        error: "Cattle not found or you don't have permission",
      });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add vaccination record - user specific
exports.addVaccination = async (req, res) => {
  try {
    const { name, date } = req.body;

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        error: "Please provide vaccination name and date",
      });
    }

    const cattle = await Cattle.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id, // Only update if created by user
      },
      { $push: { "healthStatus.vaccinations": { name, date } } },
      { new: true, runValidators: true }
    );

    if (!cattle) {
      return res.status(404).json({
        success: false,
        error: "Cattle not found or you don't have permission",
      });
    }

    res.status(200).json({ success: true, data: cattle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Add medical history entry - user specific
exports.addMedicalRecord = async (req, res) => {
  try {
    const { condition, treatment, date } = req.body;

    if (!condition || !treatment || !date) {
      return res.status(400).json({
        success: false,
        error: "Please provide condition, treatment and date",
      });
    }

    const cattle = await Cattle.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id, // Only update if created by user
      },
      {
        $push: {
          "healthStatus.medicalHistory": { condition, treatment, date },
        },
      },
      { new: true, runValidators: true }
    );

    if (!cattle) {
      return res.status(404).json({
        success: false,
        error: "Cattle not found or you don't have permission",
      });
    }

    res.status(200).json({ success: true, data: cattle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update health status - user specific
exports.updateHealthStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Please provide health status",
      });
    }

    const cattle = await Cattle.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id, // Only update if created by user
      },
      { "healthStatus.status": status },
      { new: true, runValidators: true }
    );

    if (!cattle) {
      return res.status(404).json({
        success: false,
        error: "Cattle not found or you don't have permission",
      });
    }

    res.status(200).json({ success: true, data: cattle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Change cattle status (active/sold/deceased) - user specific
exports.changeCattleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Please provide cattle status",
      });
    }

    const cattle = await Cattle.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id, // Only update if created by user
      },
      { status },
      { new: true, runValidators: true }
    );

    if (!cattle) {
      return res.status(404).json({
        success: false,
        error: "Cattle not found or you don't have permission",
      });
    }

    res.status(200).json({ success: true, data: cattle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get cattle statistics - user specific
exports.getCattleStats = async (req, res) => {
  try {
    const stats = await Cattle.aggregate([
      { $match: { createdBy: req.user._id } }, // Only include user's cattle
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
          pregnantCattle: {
            $sum: {
              $cond: [{ $eq: ["$healthStatus.status", "pregnant"] }, 1, 0],
            },
          },
          quarantinedCattle: {
            $sum: {
              $cond: [{ $eq: ["$healthStatus.status", "quarantined"] }, 1, 0],
            },
          },
          maleCattle: {
            $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] },
          },
          femaleCattle: {
            $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    res.status(200).json({
      success: true,
      data: stats.length
        ? stats[0]
        : {
            totalCattle: 0,
            activeCattle: 0,
            healthyCattle: 0,
            sickCattle: 0,
            pregnantCattle: 0,
            quarantinedCattle: 0,
            maleCattle: 0,
            femaleCattle: 0,
          },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get breeds summary - user specific
exports.getBreedsSummary = async (req, res) => {
  try {
    const breedsSummary = await Cattle.aggregate([
      { $match: { createdBy: req.user._id } }, // Only include user's cattle
      {
        $group: {
          _id: "$breed",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          breed: "$_id",
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ success: true, data: breedsSummary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
