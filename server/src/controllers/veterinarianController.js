const Veterinarian = require("../models/Veterinarian");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
let genAI = null;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (error) {
  // Keep this error log since it's critical for initialization
  console.error('Failed to initialize Gemini AI:', error);
}

const getAllVeterinarians = async (req, res) => {
  try {
    const veterinarians = await Veterinarian.find();
    res.json(veterinarians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVeterinarianById = async (req, res) => {
  try {
    const veterinarian = await Veterinarian.findById(req.params.id);
    if (!veterinarian) {
      return res.status(404).json({ message: 'Veterinarian not found' });
    }
    res.json(veterinarian);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createVeterinarian = async (req, res) => {
  try {
    const veterinarian = new Veterinarian(req.body);
    const newVeterinarian = await veterinarian.save();
    res.status(201).json(newVeterinarian);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateVeterinarian = async (req, res) => {
  try {
    const veterinarian = await Veterinarian.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!veterinarian) {
      return res.status(404).json({ message: 'Veterinarian not found' });
    }
    res.json(veterinarian);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteVeterinarian = async (req, res) => {
  try {
    const veterinarian = await Veterinarian.findByIdAndDelete(req.params.id);
    if (!veterinarian) {
      return res.status(404).json({ message: 'Veterinarian not found' });
    }
    res.json({ message: 'Veterinarian deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const veterinarian = await Veterinarian.findById(req.params.id);
    if (!veterinarian) {
      return res.status(404).json({ message: 'Veterinarian not found' });
    }

    const review = {
      user: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    };

    veterinarian.reviews.push(review);
    
    // Update average rating
    const totalRating = veterinarian.reviews.reduce((acc, review) => acc + review.rating, 0);
    veterinarian.rating = totalRating / veterinarian.reviews.length;

    await veterinarian.save();
    res.json(veterinarian);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        message: 'AI service configuration error',
        details: 'API key is not configured'
      });
    }
    
    // Check if Gemini AI was successfully initialized
    if (!genAI) {
      return res.status(500).json({ 
        message: 'AI service initialization error',
        details: 'Could not initialize AI service'
      });
    }
    
    // Prepare the prompt text
    const promptText = `You are a helpful veterinary AI assistant for a dairy farm management application. Your primary role is to provide accurate, clear, and practical information about livestock health, particularly for cattle and dairy animals.

USER QUERY: "${req.body.message}"

FORMAT YOUR RESPONSE:
1. Directly address the user's specific question
2. If addressing a health concern:
   - Provide information about potential causes
   - Suggest possible treatments or management approaches
   - Indicate when professional veterinary help should be sought
   - Offer preventive measures when applicable
3. Keep your response clear, concise, and farmer-friendly
4. Focus on actionable advice
5. If the query is not about livestock health, politely redirect to relevant livestock or dairy farming topics

Always prioritize animal welfare and professional veterinary care for serious conditions. Your goal is to provide helpful preliminary guidance, not to replace professional veterinary diagnosis or treatment.`;

    try {
      // Use gemini-1.5-pro model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Generate content with structured format
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      });
      
      const response = result.response;
      const text = response.text();
      
      return res.json({ response: text });
    } catch (apiError) {
      // Keep this error log as it's important for troubleshooting
      console.error('Error from Gemini API:', apiError);
      
      // Try fallback to gemini-pro if 1.5 fails
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        // Simple text prompt approach for fallback
        const result = await fallbackModel.generateContent(promptText);
        
        const response = result.response;
        const text = response.text();
        
        return res.json({ response: text });
      } catch (fallbackError) {
        // Keep this error log as it's important for troubleshooting
        console.error('Fallback model also failed:', fallbackError);
        
        // Return a detailed error response
        return res.status(500).json({ 
          message: 'Error generating AI response',
          details: apiError.message,
          fallbackError: fallbackError.message,
          stack: process.env.NODE_ENV === 'development' ? apiError.stack : undefined
        });
      }
    }
  } catch (error) {
    // Keep this error log as it's important for troubleshooting
    console.error('Error in chatWithAI controller:', error);
    
    return res.status(500).json({ 
      message: 'Server error processing chat request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getAllVeterinarians,
  getVeterinarianById,
  createVeterinarian,
  updateVeterinarian,
  deleteVeterinarian,
  addReview,
  chatWithAI
}; 