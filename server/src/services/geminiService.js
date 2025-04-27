// Make sure environment variables are loaded
require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Check for API key existence and validity
const isValidApiKey = (key) => {
  return key && typeof key === 'string' && key.trim() !== '';
};

// Log API key status (safely)
console.log('GEMINI_API_KEY status:', process.env.GEMINI_API_KEY ? 
  `Set (length: ${process.env.GEMINI_API_KEY.length})` : 'Not set');

// Log warning if API key is not properly set
if (!isValidApiKey(process.env.GEMINI_API_KEY)) {
  console.warn("GEMINI_API_KEY is not set properly in environment variables. Mock data will be used.");
}

// Initialize the Gemini API with the API key from environment variables
// Only initialize if we have a valid API key
const genAI = isValidApiKey(process.env.GEMINI_API_KEY) 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Predict cattle disease based on symptoms and other parameters
 * @param {Object} params - Parameters for disease prediction
 * @param {string} params.symptoms - Description of symptoms the cattle is showing
 * @param {number} params.age - Age of the cattle in years/months/days
 * @param {string} params.ageUnit - Unit of age (years, months, days)
 * @param {string} params.breed - Breed of the cattle
 * @param {string} params.gender - Gender of the cattle
 * @param {number} params.temperature - Body temperature in Celsius/Fahrenheit
 * @param {string} params.duration - How long symptoms have been present
 * @param {string} params.additional - Any additional information
 * @returns {Promise<Object>} - The prediction results
 */
const predictDisease = async (params) => {
  try {
    // If API key is not valid, return mock data for testing
    if (!isValidApiKey(process.env.GEMINI_API_KEY) || !genAI) {
      console.warn("Using mock data because GEMINI_API_KEY is not properly set");
      return getMockPredictionData(params);
    }

    // Use gemini-1.5-pro which has been confirmed working with this API key
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log("Successfully initialized gemini-1.5-pro model");

    // Format age with unit for the prompt
    const ageWithUnit = `${params.age} ${params.ageUnit || 'years'}`;

    // Construct a prompt with all the available information
    const prompt = `
      I'm a veterinarian looking for help diagnosing a potential cattle disease. 
      Please analyze these symptoms and provide:
      1. The most likely diseases/conditions (ranked by probability)
      2. A brief description of each disease
      3. Common treatments or actions to take
      4. The urgency level (Low, Medium, High, Emergency)
      
      Information about the cattle:
      - Symptoms: ${params.symptoms}
      - Age: ${ageWithUnit}
      - Breed: ${params.breed}
      - Gender: ${params.gender}
      - Body temperature: ${params.temperature}
      - Duration of symptoms: ${params.duration}
      - Additional information: ${params.additional || 'None'}
      
      Format your response as a structured JSON with the following fields:
      {
        "possibleDiseases": [
          {
            "name": "Disease name",
            "probability": "High/Medium/Low",
            "description": "Brief description",
            "treatment": "Suggested treatment",
            "precautions": "Precautions to take"
          }
        ],
        "urgencyLevel": "Low/Medium/High/Emergency",
        "recommendations": "General recommendations",
        "nextSteps": "Suggested next steps"
      }
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    // Sometimes the AI might wrap the JSON in markdown code blocks
    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || [null, text];
    const jsonStr = jsonMatch[1].trim();
    
    try {
      const parsedResponse = JSON.parse(jsonStr);
      // Mark as not mock data
      parsedResponse.isMock = false;
      return parsedResponse;
    } catch (error) {
      // If parsing fails, try to extract just the part that looks like JSON
      const jsonRegex = /\{[\s\S]*\}/;
      const extractedJson = jsonStr.match(jsonRegex);
      if (extractedJson) {
        const parsedResponse = JSON.parse(extractedJson[0]);
        // Mark as not mock data
        parsedResponse.isMock = false;
        return parsedResponse;
      }
      
      // If we still can't parse it, return the raw text
      return {
        isMock: false,
        error: "Could not parse AI response as JSON",
        rawResponse: text
      };
    }
  } catch (error) {
    console.error("Error in Gemini AI service:", error.message);
    console.error("Error stack:", error.stack);
    
    // If there's an API key issue, return mock data instead of failing
    if (error.message && (
        error.message.includes("API key not valid") || 
        error.message.includes("API_KEY_INVALID") ||
        error.message.includes("INVALID_API_KEY") ||
        error.message.includes("invalid key") ||
        error.message.includes("API key") ||
        error.message.includes("permission") ||
        error.message.includes("quota")
      )) {
      console.warn("API key issue detected. Using mock data instead.");
      return getMockPredictionData(params);
    }
    
    // For other errors, try to use mock data rather than failing completely
    console.warn("Unexpected error. Falling back to mock data.");
    return getMockPredictionData(params);
  }
};

/**
 * Generate mock prediction data for testing when API key is not available
 * @param {Object} params - The input parameters
 * @returns {Object} - Mock prediction data
 */
const getMockPredictionData = (params) => {
  // First, mark this as mock data
  const mockData = { isMock: true };
  
  // Generate mock data based on the symptoms
  const hasFever = params.temperature > 102.5 || 
                  params.symptoms.toLowerCase().includes('fever') || 
                  params.symptoms.toLowerCase().includes('high temperature');
  
  const hasDigestiveIssues = params.symptoms.toLowerCase().includes('diarrhea') || 
                            params.symptoms.toLowerCase().includes('stomach') ||
                            params.symptoms.toLowerCase().includes('appetite') ||
                            params.symptoms.toLowerCase().includes('eating');
  
  const hasRespiratoryIssues = params.symptoms.toLowerCase().includes('cough') || 
                              params.symptoms.toLowerCase().includes('breathing') ||
                              params.symptoms.toLowerCase().includes('nasal') ||
                              params.symptoms.toLowerCase().includes('mucus');
  
  // Determine if this is a young animal - affects disease likelihood
  const isYoungAnimal = 
    (params.ageUnit === 'years' && params.age < 1) || 
    (params.ageUnit === 'months' && params.age < 12) ||
    (params.ageUnit === 'days' && params.age < 365);
  
  const possibleDiseases = [];
  let urgencyLevel = "Low";
  
  // Young animals with digestive issues might have different diseases
  if (isYoungAnimal && hasDigestiveIssues) {
    possibleDiseases.push({
      name: "Calf Scours (Neonatal Diarrhea)",
      probability: "High",
      description: "A common digestive disorder in young cattle causing diarrhea, dehydration, and weakness.",
      treatment: "Oral electrolyte solutions, probiotics, and in severe cases, antibiotics under veterinary guidance.",
      precautions: "Isolate affected animals, ensure colostrum intake for newborns, maintain clean environment."
    });
    urgencyLevel = "High"; // Young animals can deteriorate quickly
  }
  
  if (hasFever && hasRespiratoryIssues) {
    possibleDiseases.push({
      name: "Bovine Respiratory Disease (BRD)",
      probability: "High",
      description: "A complex of diseases characterized by fever, nasal discharge, and respiratory distress.",
      treatment: "Antibiotics (consult vet for specific recommendation), anti-inflammatory medication, and supportive care.",
      precautions: "Isolate affected animals, improve ventilation, reduce stress."
    });
    urgencyLevel = "High";
  }
  
  if (hasDigestiveIssues && !isYoungAnimal) {
    possibleDiseases.push({
      name: "Ruminal Acidosis",
      probability: hasFever ? "Medium" : "High",
      description: "A metabolic disorder where the pH of the rumen becomes too acidic, often due to excessive grain consumption.",
      treatment: "Dietary adjustment, oral antacids, probiotics, and fluid therapy if severe.",
      precautions: "Gradual diet changes, proper feed management, regular monitoring."
    });
    if (urgencyLevel !== "High") urgencyLevel = "Medium";
  }
  
  if (params.symptoms.toLowerCase().includes('limp') || 
      params.symptoms.toLowerCase().includes('lame') ||
      params.symptoms.toLowerCase().includes('hoof') ||
      params.symptoms.toLowerCase().includes('foot')) {
    possibleDiseases.push({
      name: "Foot Rot",
      probability: "Medium",
      description: "Bacterial infection causing inflammation between the claws of the hoof.",
      treatment: "Topical antibiotics, foot baths, and possibly systemic antibiotics for severe cases.",
      precautions: "Keep yards clean and dry, regular hoof trimming, foot baths."
    });
  }
  
  // Add a general condition if nothing specific was identified
  if (possibleDiseases.length === 0) {
    possibleDiseases.push({
      name: "General Malaise",
      probability: "Medium",
      description: "Non-specific symptoms that could indicate various conditions or stress.",
      treatment: "Supportive care, monitoring, and consultation with a veterinarian.",
      precautions: "Ensure proper nutrition, hydration, and comfortable environment."
    });
  }
  
  return {
    ...mockData,
    possibleDiseases,
    urgencyLevel,
    recommendations: `Monitor the animal closely for changes in symptoms. Ensure it has access to fresh water and appropriate feed. ${isYoungAnimal ? 'Young animals can deteriorate quickly, so more frequent monitoring is recommended.' : 'Consider isolating from the herd if symptoms worsen.'}`,
    nextSteps: "Consult with a veterinarian for proper diagnosis and treatment plan. Keep detailed records of symptoms and any treatments administered."
  };
};

module.exports = {
  predictDisease
}; 