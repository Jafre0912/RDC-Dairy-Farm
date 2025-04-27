const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Please specify transaction type"],
      enum: ["income", "expense"],
    },
    category: {
      type: String,
      required: [true, "Please specify transaction category"],
    },
    amount: {
      type: Number,
      required: [true, "Please specify transaction amount"],
      min: [0, "Amount cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Please specify transaction date"],
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model("Transaction", TransactionSchema); 