import { create } from "zustand";
import api from "../config/axiosConfig";

const useDiseaseStore = create((set) => ({
  // State
  loading: false,
  historyLoading: false,
  error: null,
  validationErrors: [], // Track specific validation issues
  prediction: null,
  predictionHistory: [],
  historyPagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 10
  },

  // Reset prediction
  resetPrediction: () => {
    set({ prediction: null });
  },
  
  // Get disease prediction
  predictDisease: async (diseaseData) => {
    set({ loading: true, error: null, validationErrors: [] });
    
    try {
      // Deep copy the data to avoid mutations
      const requestData = JSON.parse(JSON.stringify(diseaseData));
      
      // Ensure age is in the correct format (for both object and non-object formats)
      if (requestData.age) {
        if (typeof requestData.age === 'object') {
          // If age is already an object, make sure value is a number
          requestData.age.value = Number(requestData.age.value);
        } else {
          // If age is a number, make sure it's parsed
          requestData.age = Number(requestData.age);
        }
      }
      
      // Ensure temperature is a number
      if (requestData.temperature) {
        requestData.temperature = Number(requestData.temperature);
      }
      
      // Save original symptoms and cattle ID for reference
      const originalSymptoms = requestData.symptoms;
      const originalCattleId = requestData.cattleId;
      
      // Add includeCattleData flag to request if cattleId is present
      if (originalCattleId) {
        requestData.includeCattleData = true;
      }
      
      const response = await api.post("/disease/predict", requestData);
      
      // Ensure symptoms are included in the prediction data
      const predictionData = response.data.data;
      
      // If the API response doesn't include symptoms, add them from the request
      if (!predictionData.symptoms && originalSymptoms) {
        predictionData.symptoms = originalSymptoms;
      }
      
      // If the API response doesn't have cattle info but we sent a cattle ID
      if (originalCattleId && !predictionData.cattleData) {
        predictionData.cattleId = originalCattleId;
      }
      
      // If the API returns cattleData separately, merge relevant fields
      if (predictionData.cattleData) {
        // Convert separate cattleData into inline properties for saving
        predictionData.cattleId = predictionData.cattleData._id || originalCattleId;
        
        // If cattle has age/breed/gender info and prediction doesn't, use it
        if (predictionData.cattleData.age && (!predictionData.age || predictionData.useDefaultValues)) {
          predictionData.age = predictionData.cattleData.age;
        }
        
        if (predictionData.cattleData.breed && (!predictionData.breed || predictionData.useDefaultValues)) {
          predictionData.breed = predictionData.cattleData.breed;
        }
        
        if (predictionData.cattleData.gender && (!predictionData.gender || predictionData.useDefaultValues)) {
          predictionData.gender = predictionData.cattleData.gender;
        }
      }
      
      set({ 
        loading: false, 
        prediction: predictionData,
        error: null
      });
      
      return { success: true, data: predictionData };
    } catch (err) {
      // Extract error message from the response
      const errorResponse = err.response?.data;
      const errorMessage = 
        errorResponse?.error || 
        errorResponse?.message || 
        err.message || 
        "Failed to get disease prediction";
      
      // Check for validation errors
      const validationErrors = errorResponse?.errors || [];
      
      set({ 
        error: errorMessage, 
        loading: false,
        validationErrors: validationErrors
      });
      
      return { 
        success: false, 
        error: errorMessage,
        errors: validationErrors 
      };
    }
  },
  
  // Save prediction record
  savePrediction: async (predictionData) => {
    set({ loading: true, error: null, validationErrors: [] });
    
    try {
      // Enhanced symptoms handling
      if (predictionData.symptoms === undefined || predictionData.symptoms === null) {
        throw new Error('Symptoms field is missing or undefined');
      }
      
      // Ensure symptoms is a string if it's an array
      if (Array.isArray(predictionData.symptoms)) {
        predictionData.symptoms = predictionData.symptoms.join(', ');
      } else if (typeof predictionData.symptoms === 'string') {
        // Ensure the string is trimmed
        predictionData.symptoms = predictionData.symptoms.trim();
        
        // Check if symptoms is empty after trimming
        if (predictionData.symptoms === '') {
          throw new Error('Symptoms cannot be empty');
        }
      } else {
        throw new Error(`Invalid symptoms format: ${typeof predictionData.symptoms}`);
      }
      
      // Deep copy before modifying
      const formattedData = JSON.parse(JSON.stringify(predictionData));
      
      // Ensure age is properly formatted as an object with value and unit
      if (!formattedData.age && formattedData.age !== 0) {
        throw new Error('Age field is missing');
      }
      
      // Format age as an object
      if (typeof formattedData.age !== 'object' || formattedData.age === null) {
        // If age is not an object, create one
        const ageValue = Number(formattedData.age);
        if (isNaN(ageValue) || ageValue <= 0) {
          throw new Error('Age must be a positive number');
        }
        
        formattedData.age = {
          value: ageValue,
          unit: formattedData.ageUnit || 'years'
        };
        // Remove the separate ageUnit field if it exists
        if (formattedData.ageUnit) {
          delete formattedData.ageUnit;
        }
      } else {
        // If it's already an object, ensure value is a number
        if (formattedData.age.value !== undefined) {
          const ageValue = Number(formattedData.age.value);
          if (isNaN(ageValue) || ageValue <= 0) {
            throw new Error('Age value must be a positive number');
          }
          formattedData.age.value = ageValue;
        } else {
          throw new Error('Age object is missing value property');
        }
        
        // Ensure unit is present
        if (!formattedData.age.unit) {
          formattedData.age.unit = formattedData.ageUnit || 'years';
        }
      }
      
      // Ensure temperature is a number
      if (formattedData.temperature !== undefined) {
        formattedData.temperature = Number(formattedData.temperature);
      }
      
      const response = await api.post("/disease/save", formattedData);
      
      // Add to history if successful
      // Check both possible API response formats
      if (response.data.success === true || response.data.status === "success") {
        const savedData = response.data.prediction || response.data.data;
        set((state) => ({
          predictionHistory: [savedData, ...state.predictionHistory],
          loading: false,
          error: null,
          validationErrors: []
        }));
        
        return { success: true, data: savedData };
      } else {
        // Something went wrong with the API response
        const errorMessage = response.data.error || response.data.message || "Failed to save prediction";
        
        // Extract validation errors if present
        const validationErrors = response.data.errors || [];
        
        set({ 
          error: errorMessage, 
          loading: false,
          validationErrors: validationErrors
        });
        
        return { 
          success: false, 
          error: errorMessage,
          errors: validationErrors
        };
      }
    } catch (err) {
      const errorData = err.response?.data;
      
      const errorMessage =
        errorData?.error ||
        errorData?.message ||
        err.message ||
        "Failed to save prediction";
      
      // Extract validation errors if present
      const validationErrors = errorData?.errors || [];
      
      set({ 
        error: errorMessage, 
        loading: false,
        validationErrors: validationErrors
      });
      
      return { 
        success: false, 
        error: errorMessage,
        errors: validationErrors,
        originalError: err
      };
    }
  },
  
  // Fetch prediction history
  fetchPredictionHistory: async (page = 1, limit = 10, cattleId = null) => {
    set({ historyLoading: true, error: null });
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (cattleId) params.append('cattleId', cattleId);
      
      const response = await api.get(`/disease/history?${params.toString()}`);
      
      if (response.data.success === true || response.data.status === "success") {
        // Handle potential response format differences
        const predictions = response.data.data?.predictions || response.data.predictions || [];
        const pagination = response.data.data?.pagination || {
          total: predictions.length,
          page: page,
          pages: 1,
          limit: limit
        };
        
        set({
          predictionHistory: predictions,
          historyPagination: pagination,
          historyLoading: false,
          error: null,
        });
        
        return { 
          success: true, 
          data: predictions,
          pagination: pagination
        };
      } else {
        const errorMessage = response.data.error || response.data.message || "Failed to fetch prediction history";
        
        set({ 
          error: errorMessage, 
          historyLoading: false 
        });
        
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch prediction history";
      
      set({ error: errorMessage, historyLoading: false });
      return { success: false, error: errorMessage };
    }
  },
  
  // Fetch single prediction by ID
  fetchPredictionById: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await api.get(`/disease/prediction/${id}`);
      
      if (response.data.success) {
        set({ 
          loading: false,
          prediction: response.data.data,
          error: null 
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch prediction');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch prediction';
      set({ 
        loading: false, 
        error: errorMessage,
        prediction: null
      });
      return null;
    }
  },
  
  // Clear error message
  clearError: () => set({ error: null, validationErrors: [] }),
}));

export default useDiseaseStore;