const { predictDisease } = require('../services/geminiService');
const DiseasePrediction = require('../models/DiseasePrediction');
const { check, validationResult } = require('express-validator');

/**
 * Get disease prediction based on symptoms and other parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with disease prediction
 */
exports.getDiseasePrediction = async (req, res) => {
  try {
    // Validation is already handled by middleware
    // Extract parameters from request body
    let { 
      symptoms, 
      age, 
      ageUnit = 'years', // Default to years if not specified
      breed, 
      gender, 
      temperature, 
      duration, 
      additional,
      cattleId,
      includeCattleData // New flag to indicate if cattle data should be included
    } = req.body;

    // Ensure symptoms is a string
    if (Array.isArray(symptoms)) {
      symptoms = symptoms.join(', ');
    }

    // If cattleId is provided and includeCattleData is true, fetch the cattle data
    let cattleData = null;
    if (cattleId && includeCattleData) {
      try {
        // Import the Cattle model
        const Cattle = require('../models/Cattle');
        
        // Fetch the cattle data
        cattleData = await Cattle.findById(cattleId)
          .select('name tag_id age breed gender') // Select only needed fields
          .lean(); // Convert to plain JS object
        
        // If cattle data is found, we can use it to fill in missing fields
        if (cattleData) {
          // Use cattle data as defaults for any missing fields
          if (!age && cattleData.age) {
            age = cattleData.age;
          }
          
          if (!breed && cattleData.breed) {
            breed = cattleData.breed;
          }
          
          if (!gender && cattleData.gender) {
            gender = cattleData.gender;
          }
        }
      } catch (error) {
        // Continue with prediction even if cattle data fetch fails
      }
    }

    // Call the Gemini service to get the prediction
    const prediction = await predictDisease({
      symptoms,
      age: typeof age === 'object' ? age.value : age,
      ageUnit: typeof age === 'object' ? age.unit : ageUnit,
      breed,
      gender,
      temperature,
      duration,
      additional,
      cattleId
    });

    // Include the original form values in the response
    const responseData = {
      ...prediction,
      symptoms,
      age: typeof age === 'object' ? age : { 
        value: Number(age),
        unit: ageUnit 
      },
      breed,
      gender,
      temperature: Number(temperature),
      duration,
      additional: additional || '',
      cattleId
    };
    
    // Include cattle data in the response if requested and available
    if (cattleData) {
      responseData.cattleData = cattleData;
    }

    // Return the prediction with the enhanced data
    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get disease prediction',
      message: error.message
    });
  }
};

/**
 * Validate disease prediction request
 */
exports.validateDiseaseRequest = [
  check('symptoms')
    .notEmpty()
    .withMessage('Symptoms are required')
    .custom((value) => {
      // Accept both string and array formats for symptoms
      if (Array.isArray(value)) {
        // Convert array to string
        return true;
      } else if (typeof value === 'string') {
        return true;
      } else {
        throw new Error('Symptoms must be a string or an array');
      }
    })
    .customSanitizer((value) => {
      // Convert array to comma-separated string if needed
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value;
    }),
  
  check('age')
    .notEmpty()
    .withMessage('Age is required')
    .custom((value) => {
      // Allow age as a number or as an object with value property
      if (typeof value === 'object') {
        if ((value.value === undefined || value.value === null) && value.value !== 0) {
          throw new Error('Age value is required when age is an object');
        }
        if (isNaN(Number(value.value))) {
          throw new Error('Age value must be a number');
        }
        // Check unit if provided
        if (value.unit && !['years', 'months', 'days'].includes(value.unit)) {
          throw new Error('Age unit must be years, months, or days');
        }
      } else if (isNaN(Number(value))) {
        throw new Error('Age must be a number');
      }
      return true;
    }),
  
  check('ageUnit')
    .optional()
    .isString()
    .withMessage('Age unit must be a string')
    .isIn(['years', 'months', 'days'])
    .withMessage('Age unit must be years, months, or days')
    .trim(),
  
  check('breed')
    .notEmpty()
    .withMessage('Breed is required')
    .isString()
    .withMessage('Breed must be a string')
    .trim(),
  
  check('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isString()
    .withMessage('Gender must be a string')
    .trim(),
  
  check('temperature')
    .notEmpty()
    .withMessage('Temperature is required')
    .isNumeric()
    .withMessage('Temperature must be a number'),
  
  check('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isString()
    .withMessage('Duration must be a string')
    .trim(),
  
  check('additional')
    .optional()
    .isString()
    .withMessage('Additional information must be a string')
    .trim(),
    
  // Validate req body format
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false, 
        error: 'Invalid input data',
        errors: errors.array()
      });
    }
    
    // Add user for testing purposes if not available
    if (!req.user && process.env.NODE_ENV === 'development') {
      req.user = { _id: '65fc12345678901234567890' }; // Mock user ID for testing
    }
    
    next();
  }
];

/**
 * Save a disease prediction record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with saved prediction
 */
exports.savePredictionRecord = async (req, res) => {
  try {
    // Extract the symptoms separately to debug
    const { symptoms } = req.body;
    
    const {
      age,
      ageUnit,
      breed,
      gender,
      temperature,
      duration,
      additional,
      cattleId,
      result,
      isMock
    } = req.body;

    // Validation checks
    const missingFields = [];
    const validationErrors = [];

    // Enhanced symptoms validation
    if (symptoms === undefined || symptoms === null) {
      missingFields.push('symptoms');
    } else if (Array.isArray(symptoms)) {
      if (symptoms.length === 0) {
        validationErrors.push('Symptoms array cannot be empty');
      }
    } else if (typeof symptoms === 'string') {
      if (symptoms.trim() === '') {
        validationErrors.push('Symptoms string cannot be empty');
      }
    } else {
      validationErrors.push(`Symptoms must be a string or an array, got ${typeof symptoms}`);
    }
    
    // Detailed validation for the age field
    if (!age) {
      missingFields.push('age');
    } else if (typeof age === 'object') {
      if (age.value === undefined || age.value === null) {
        validationErrors.push('Age value is required');
      } else if (isNaN(Number(age.value))) {
        validationErrors.push('Age value must be a number');
      }
      
      if (!age.unit) {
        // Default to years if unit is missing
      } else if (!['years', 'months', 'days'].includes(age.unit)) {
        validationErrors.push('Age unit must be years, months, or days');
      }
    } else if (isNaN(Number(age))) {
      validationErrors.push('Age must be a number if not an object');
    }
    
    if (!breed) missingFields.push('breed');
    if (!gender) missingFields.push('gender');
    
    if (!temperature) {
      missingFields.push('temperature');
    } else if (isNaN(Number(temperature))) {
      validationErrors.push('Temperature must be a number');
    }
    
    if (!duration) missingFields.push('duration');
    
    if (!result) {
      missingFields.push('result');
    } else {
      if (!result.possibleDiseases || !Array.isArray(result.possibleDiseases) || result.possibleDiseases.length === 0) {
        missingFields.push('result.possibleDiseases');
      }
      
      if (!result.urgencyLevel) {
        missingFields.push('result.urgencyLevel');
      } else if (!['Low', 'Medium', 'High', 'Emergency'].includes(result.urgencyLevel)) {
        validationErrors.push('urgencyLevel must be Low, Medium, High, or Emergency');
      }
    }

    // Return early if validation fails
    if (missingFields.length > 0 || validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: {
          missingFields,
          validationErrors
        }
      });
    }

    // Process symptoms - normalize to string
    let symptomsString;
    if (Array.isArray(symptoms)) {
      symptomsString = symptoms.join(', ');
    } else {
      // Ensure it's a string and trimmed
      symptomsString = String(symptoms).trim();
    }

    // Create a new prediction record
    const predictionRecord = new DiseasePrediction({
      user: req.user._id,
      cattle: cattleId || null,
      symptoms: symptomsString,
      
      // Handle different age structure formats
      age: typeof age === 'object' ? 
        // Age is already an object
        {
          value: Number(age.value),
          unit: age.unit || ageUnit || 'years'
        } : 
        // Age is a number or string
        {
          value: Number(age),
          unit: ageUnit || 'years'
        },
      
      breed,
      gender,
      temperature: Number(temperature),
      duration,
      additional: additional || '',
      result: {
        possibleDiseases: result.possibleDiseases || [],
        urgencyLevel: result.urgencyLevel || 'Low',
        recommendations: result.recommendations || '',
        nextSteps: result.nextSteps || ''
      },
      isMock: req.body.isMock || false
    });

    // Save the record
    const savedRecord = await predictionRecord.save();

    // Populate cattle information if available
    if (savedRecord.cattle) {
      await savedRecord.populate('cattle');
    }

    res.status(201).json({
      success: true,
      message: 'Prediction saved successfully',
      prediction: savedRecord
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Could not save prediction',
      message: error.message
    });
  }
};

/**
 * Get prediction history for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with prediction history
 */
exports.getPredictionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const cattleId = req.query.cattleId || null;
    
    // Build filter
    const filter = { user: req.user._id };
    if (cattleId) filter.cattle = cattleId;
    
    // Find all predictions for the current user
    const predictions = await DiseasePrediction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('cattle', 'name tag_id age breed gender')
      .lean();
    
    // Get total count for pagination
    const total = await DiseasePrediction.countDocuments(filter);
    
    // Calculate pagination info
    const pagination = {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    };
    
    res.status(200).json({
      success: true,
      data: {
        predictions,
        pagination
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction history',
      error: error.message
    });
  }
};

/**
 * Get a single prediction by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with prediction data
 */
exports.getPredictionById = async (req, res) => {
  try {
    const predictionId = req.params.id;
    
    // Find the prediction by ID
    const prediction = await DiseasePrediction.findById(predictionId)
      .populate('cattle', 'name tagId age breed gender')
      .lean();
    
    // Check if prediction exists
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }
    
    // Check if the prediction belongs to the user
    if (prediction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this prediction'
      });
    }
    
    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction',
      error: error.message
    });
  }
};