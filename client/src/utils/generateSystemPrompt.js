/**
 * Generates a system prompt for the Gemini AI based on the user's query
 * @param {string} userQuery - The user's query
 * @returns {object} - The formatted content object for Gemini API
 */
export const generateSystemPrompt = (userQuery) => {
  const promptText = `You are a helpful veterinary AI assistant for a dairy farm management application. Your primary role is to provide accurate, clear, and practical information about livestock health, particularly for cattle and dairy animals.

USER QUERY: "${userQuery}"

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

  // Return in the format expected by Gemini 1.5 API
  return {
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 800,
    }
  };
};

/**
 * Generates a fallback response based on keywords in the user's message
 * @param {string} message - The user's message
 * @returns {string} - A fallback response
 */
export const getFallbackResponse = (message) => {
  message = message.toLowerCase();
  
  // Keywords and their associated responses
  const fallbackResponses = {
    "symptom": "For livestock showing symptoms like lethargy, reduced appetite, or abnormal behavior, monitor them closely and consult a veterinarian if symptoms persist for more than 24 hours. Keep the animal comfortable, ensure it has access to clean water, and consider isolating it from the herd if an infectious disease is suspected.",
    "disease": "Common livestock diseases include mastitis, foot rot, respiratory infections, and parasitic diseases. Early detection is key to treatment. Look for changes in behavior, appetite, milk production, and physical symptoms. Maintain good hygiene, proper nutrition, and regular vaccinations to prevent disease spread.",
    "treatment": "While waiting for veterinary assistance, ensure the animal is comfortable, has access to clean water and appropriate food. For minor injuries, cleaning with diluted antiseptic solution may help. However, avoid administering medications without professional guidance as improper treatment can worsen the condition.",
    "prevention": "Disease prevention in livestock includes regular vaccinations, proper nutrition, clean housing conditions, biosecurity measures, parasite control, and stress management. Regular health checks and maintaining quarantine protocols for new animals are also essential practices.",
    "nutrition": "Livestock nutrition requirements vary by species, age, and production stage. A balanced diet should include appropriate amounts of protein, energy, minerals, vitamins, and clean water. Consult a nutritionist to develop a feeding program tailored to your animals' specific needs.",
    "emergency": "In veterinary emergencies, contact your veterinarian immediately. While waiting, keep the animal calm and comfortable, stop any bleeding with pressure, and don't give food or water if the animal appears to have digestive issues or is struggling to breathe.",
    "vaccination": "Vaccination is a critical part of preventive healthcare for livestock. Common vaccines include those for clostridial diseases, respiratory infections, and reproductive diseases. Follow a scheduled vaccination program appropriate for your region and consult with your veterinarian for specific recommendations.",
    "pregnancy": "During pregnancy, monitor the animal's health closely, provide proper nutrition, ensure clean living conditions, and minimize stress. Be prepared for potential complications and have your veterinarian's contact information readily available as the due date approaches.",
    "calf": "Newborn calves require colostrum within the first 24 hours, proper nutrition, clean dry bedding, and protection from extreme weather. Monitor for signs of diarrhea, respiratory issues, or other health concerns and contact your veterinarian promptly if problems arise.",
    "milk": "Milk production can be affected by nutrition, health status, stage of lactation, and environmental factors. Ensure proper feeding, good udder health practices, and regular monitoring of milk quality. Mastitis prevention through proper milking procedures and hygiene is essential.",
    "feed": "Quality feed is essential for livestock health and productivity. Ensure balanced nutrition with appropriate protein, energy, fiber, vitamins, and minerals. Feed storage should protect against mold and contamination, and feed should be regularly checked for quality."
  };
  
  // Check for keywords in the message
  for (const [key, response] of Object.entries(fallbackResponses)) {
    if (message.includes(key)) {
      return response;
    }
  }
  
  // Default response if no keywords match
  return "I understand you have a question about livestock health. For specific advice, please consult with a veterinarian. Remember to monitor your animals regularly, maintain good hygiene, and follow proper vaccination schedules.";
};

export default { generateSystemPrompt, getFallbackResponse }; 