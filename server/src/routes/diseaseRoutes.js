const express = require('express');
const router = express.Router();
const { 
  getDiseasePrediction, 
  validateDiseaseRequest,
  savePredictionRecord,
  getPredictionHistory,
  getPredictionById
} = require('../controllers/diseaseController');
const { protect } = require('../middlewares/auth');

// Conditionally apply auth middleware based on environment
const conditionalAuth = (req, res, next) => {
  // Skip authentication in development mode for easier testing
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // In production, apply the auth middleware
  return protect(req, res, next);
};

// POST /api/disease/predict - Get disease prediction
// Authentication is conditional based on environment
router.post('/predict', conditionalAuth, validateDiseaseRequest, getDiseasePrediction);

// POST /api/disease/save - Save prediction record
router.post('/save', protect, savePredictionRecord);

// GET /api/disease/history - Get prediction history
router.get('/history', protect, getPredictionHistory);

// GET /api/disease/prediction/:id - Get single prediction by ID
router.get('/prediction/:id', protect, getPredictionById);

module.exports = router;