const express = require("express");
const {
  getAllVeterinarians,
  getVeterinarianById,
  createVeterinarian,
  updateVeterinarian,
  deleteVeterinarian,
  addReview,
  chatWithAI
} = require("../controllers/veterinarianController");
const { protect, isAdmin } = require("../middlewares/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// Public routes
router.get('/', getAllVeterinarians);

// AI Chat route - making it accessible without authentication
router.post('/chat', chatWithAI);

// Simple test route for Gemini API - must be before /:id route to prevent route parameter confusion
router.get('/test-gemini', async (req, res) => {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false,
        message: 'API key is not configured'
      });
    }
    
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Configure generation parameters
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 200,
    };
    
    const promptText = "Say hello and confirm that you're working properly.";
    
    // First try gemini-1.5-pro model
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Generate a simple response with structured format
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig,
      });
      
      const response = result.response;
      const text = response.text();
      
      return res.json({ 
        success: true, 
        message: 'Gemini API is working properly with model: gemini-1.5-pro', 
        response: text 
      });
    } catch (model1Error) {
      // Fall back to gemini-pro
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        // Try with structured format first
        try {
          const result = await fallbackModel.generateContent({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig,
          });
          
          const response = result.response;
          const text = response.text();
          
          return res.json({ 
            success: true, 
            message: 'Gemini API is working properly with fallback model: gemini-pro (structured)', 
            response: text 
          });
        } catch (structuredError) {
          // Try simple text prompt as last resort
          const result = await fallbackModel.generateContent(promptText);
          
          const response = result.response;
          const text = response.text();
          
          return res.json({
            success: true,
            message: 'Gemini API is working properly with gemini-pro (direct prompt)',
            response: text
          });
        }
      } catch (fallbackError) {
        throw new Error(`All Gemini models failed. Last error: ${fallbackError.message}`);
      }
    }
  } catch (error) {
    // Keep this error log as it's important for diagnostics
    console.error('Error testing Gemini API:', error);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error testing Gemini API', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Route for specific veterinarian by ID - must be after specific named routes
router.get('/:id', getVeterinarianById);

// Protected admin routes - these require admin privileges
router.post('/', protect, isAdmin, createVeterinarian);
router.put('/:id', protect, isAdmin, updateVeterinarian);
router.delete('/:id', protect, isAdmin, deleteVeterinarian);

// Protected user routes - any authenticated user can add a review
router.post('/:id/reviews', protect, addReview);

module.exports = router; 