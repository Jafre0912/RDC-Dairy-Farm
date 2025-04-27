const mongoose = require("mongoose");

const milkProductionSchema = new mongoose.Schema(
  {
    cattleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cattle",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    morningAmount: {
      type: Number,
      default: 0,
    },
    eveningAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: function () {
        return this.morningAmount + this.eveningAmount;
      },
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const MilkProduction = mongoose.model("MilkProduction", milkProductionSchema);
module.exports = MilkProduction;
