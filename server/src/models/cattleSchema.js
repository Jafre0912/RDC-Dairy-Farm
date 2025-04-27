const mongoose = require("mongoose");

const purchaseInfoSchema = new mongoose.Schema({
  date: Date,
  cost: Number,
  source: String
}, { _id: false });

const cattleSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    breed: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    healthStatus: {
      vaccinations: [
        {
          name: String,
          date: Date,
        },
      ],
      medicalHistory: [
        {
          condition: String,
          treatment: String,
          date: Date,
        },
      ],
      status: {
        type: String,
        enum: ["healthy", "sick", "quarantined", "pregnant"],
        default: "healthy",
      },
    },
    status: {
      type: String,
      enum: ["active", "sold", "deceased"],
      default: "active",
    },
    purchaseInfo: {
      type: purchaseInfoSchema,
      required: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Cattle = mongoose.model("Cattle", cattleSchema);
module.exports = Cattle;
