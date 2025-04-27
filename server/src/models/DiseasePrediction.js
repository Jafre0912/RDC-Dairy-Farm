const mongoose = require('mongoose');

/**
 * Schema for disease prediction records
 */
const diseasePredictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cattle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cattle',
      // Not required as user might predict for unregistered cattle
    },
    symptoms: {
      type: String,
      required: true,
    },
    age: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ['years', 'months', 'days'],
        default: 'years',
      },
    },
    breed: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    additional: {
      type: String,
      default: '',
    },
    result: {
      possibleDiseases: [
        {
          name: {
            type: String,
            required: true,
          },
          probability: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            required: true,
          },
          description: String,
          treatment: String,
          precautions: String,
        },
      ],
      urgencyLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Emergency'],
        required: true,
      },
      recommendations: String,
      nextSteps: String,
    },
    isMock: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
diseasePredictionSchema.index({ user: 1 });
diseasePredictionSchema.index({ cattle: 1 });
diseasePredictionSchema.index({ createdAt: -1 });

const DiseasePrediction = mongoose.model('DiseasePrediction', diseasePredictionSchema);

module.exports = DiseasePrediction; 