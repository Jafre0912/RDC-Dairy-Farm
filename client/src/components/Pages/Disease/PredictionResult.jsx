import { useState, useEffect } from "react";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaClock,
  FaAngleRight,
  FaAngleDown,
  FaPrint,
  FaDownload,
  FaThermometer,
  FaCalendarAlt,
  FaSave,
} from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import { BsGenderAmbiguous } from "react-icons/bs";
import { MdOutlinePets } from "react-icons/md";
import useCattleStore from "../../../store/cattleStore";
import { IoMdInformationCircleOutline } from "react-icons/io";
import useDiseaseStore from "../../../store/diseaseStore";
import { toast } from "react-toastify";

const PredictionResult = ({ prediction }) => {
  const [expandedDisease, setExpandedDisease] = useState(null);
  const { cattle } = useCattleStore();
  const { savePrediction } = useDiseaseStore();
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [saveAttempted, setSaveAttempted] = useState(false);
  
  // Debug: Log prediction object when component mounts or prediction changes
  useEffect(() => {
    // Check if prediction has symptoms
    if (prediction) {
      if (prediction.symptoms === undefined || prediction.symptoms === null) {
        // Prediction is missing symptoms property
      }
    }
  }, [prediction]);
  
  // Find the selected cattle if cattleId is provided
  useEffect(() => {
    if (prediction && prediction.cattleId) {
      const found = cattle.find(c => c._id === prediction.cattleId);
      setSelectedCattle(found || null);
    } else {
      setSelectedCattle(null);
    }
  }, [prediction, cattle]);
  
  // Toggle disease details expansion
  const toggleDisease = (index) => {
    setExpandedDisease(expandedDisease === index ? null : index);
  };
  
  // Function to determine urgency level color and icon
  const getUrgencyDisplay = (level) => {
    const levelLower = level?.toLowerCase() || "low";
    
    if (levelLower === "emergency") {
      return {
        color: "text-red-700",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
        icon: <FaExclamationTriangle className="text-red-600 h-3 w-3" />,
        badge: "bg-red-100 text-red-800 border-red-200",
      };
    } else if (levelLower === "high") {
      return {
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-200",
        icon: <FaExclamationTriangle className="text-orange-600 h-3 w-3" />,
        badge: "bg-orange-100 text-orange-800 border-orange-200",
      };
    } else if (levelLower === "medium") {
      return {
        color: "text-yellow-700",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-200",
        icon: <FaInfoCircle className="text-yellow-600 h-3 w-3" />,
        badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    } else {
      return {
        color: "text-green-700",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
        icon: <FaCheckCircle className="text-green-600 h-3 w-3" />,
        badge: "bg-green-100 text-green-800 border-green-200",
      };
    }
  };
  
  // Handle printing the results
  const handlePrint = () => {
    window.print();
  };
  
  // Handle downloading the results as JSON
  const handleDownload = () => {
    const dataStr = JSON.stringify(prediction, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `disease_prediction_${new Date().toISOString().slice(0,10)}.json`;
    link.href = url;
    link.click();
  };
  
  // Handle saving the prediction to database
  const handleSavePrediction = async () => {
    if (isSaved) {
      toast.info("This prediction is already saved");
      return;
    }
    
    // Reset validation state
    setValidationErrors([]);
    setSaveAttempted(true);
    
    try {
      setIsSaving(true);
      
      // Check if prediction object exists and has required properties
      if (!prediction) {
        toast.error("Cannot save: prediction data is missing");
        setIsSaving(false);
        return;
      }
      
      // Check if symptoms property exists at all
      if (prediction.symptoms === undefined || prediction.symptoms === null) {
        toast.error("Missing required field: symptoms");
        setIsSaving(false);
        return;
      }
      
      // Prepare data to save with proper format checks
      let predictSymptoms = prediction.symptoms;
      
      // Ensure symptoms is a string
      if (Array.isArray(predictSymptoms)) {
        predictSymptoms = predictSymptoms.join(', ');
      } else if (typeof predictSymptoms === 'string') {
        predictSymptoms = predictSymptoms.trim();
      }
      
      // Double-check symptoms after processing
      if (!predictSymptoms || predictSymptoms === '') {
        toast.error("Missing required field: symptoms");
        setIsSaving(false);
        return;
      }
      
      // Validate age exists
      if (!prediction.age && prediction.age !== 0) {
        toast.error("Missing required field: age");
        setIsSaving(false);
        return;
      }
      
      // Extract and validate age value
      let ageValue;
      if (typeof prediction.age === 'object' && prediction.age !== null) {
        ageValue = Number(prediction.age.value);
      } else {
        ageValue = Number(prediction.age);
      }
      
      // Validate age - make sure it's a number > 0
      if (isNaN(ageValue) || ageValue <= 0) {
        toast.error("Age must be a positive number");
        setIsSaving(false);
        return;
      }
      
      // Get age unit
      let ageUnit;
      if (typeof prediction.age === 'object' && prediction.age !== null && prediction.age.unit) {
        ageUnit = prediction.age.unit;
      } else {
        ageUnit = prediction.ageUnit || 'years';
      }
      
      if (!prediction.breed) {
        toast.error("Missing required field: breed");
        setIsSaving(false);
        return;
      }
      
      if (!prediction.gender) {
        toast.error("Missing required field: gender");
        setIsSaving(false);
        return;
      }
      
      if (!prediction.temperature) {
        toast.error("Missing required field: temperature");
        setIsSaving(false);
        return;
      }
      
      if (!prediction.duration) {
        toast.error("Missing required field: duration");
        setIsSaving(false);
        return;
      }
      
      if (!prediction.possibleDiseases || !prediction.possibleDiseases.length) {
        toast.error("Missing required field: prediction results");
        setIsSaving(false);
        return;
      }
      
      // Map possibleDiseases to ensure they have valid probability values
      const possibleDiseases = prediction.possibleDiseases.map(disease => {
        // Standardize probability to one of the enum values: 'High', 'Medium', 'Low'
        let probability = 'Medium';
        if (disease.probability) {
          const probStr = String(disease.probability).toLowerCase();
          if (probStr.includes('high')) {
            probability = 'High';
          } else if (probStr.includes('medium') || probStr.includes('moderate')) {
            probability = 'Medium';
          } else if (probStr.includes('low')) {
            probability = 'Low';
          }
        }
        
        return {
          name: disease.name,
          probability: probability,
          description: disease.description || '',
          treatment: disease.treatment || '',
          precautions: disease.precautions || ''
        };
      });
      
      // Make sure urgencyLevel is one of the acceptable values
      let urgencyLevel = 'Low';
      if (prediction.urgencyLevel) {
        const urgencyStr = String(prediction.urgencyLevel).toLowerCase();
        if (urgencyStr.includes('emergency')) {
          urgencyLevel = 'Emergency';  
        } else if (urgencyStr.includes('high')) {
          urgencyLevel = 'High';
        } else if (urgencyStr.includes('medium') || urgencyStr.includes('moderate')) {
          urgencyLevel = 'Medium';
        } else {
          urgencyLevel = 'Low';
        }
      }
      
      // Prepare data to save with properly formatted age
      const predictionData = {
        symptoms: predictSymptoms,
        age: {
          value: ageValue,
          unit: ageUnit
        },
        breed: prediction.breed,
        gender: prediction.gender,
        temperature: Number(prediction.temperature || 0),
        duration: prediction.duration,
        additional: prediction.additional || '',
        cattleId: prediction.cattleId || null,
        result: {
          possibleDiseases: possibleDiseases,
          urgencyLevel: urgencyLevel,
          recommendations: prediction.recommendations || '',
          nextSteps: prediction.nextSteps || ''
        },
        isMock: prediction.isMock || false
      };
      
      const response = await savePrediction(predictionData);
      
      if (response && response.success) {
        setIsSaved(true);
        setSaveAttempted(true);
        setValidationErrors([]);
        toast.success("Prediction saved successfully");
      } else {
        // Check if validation errors exist
        if (response?.errors) {
          // Extract validation errors from response
          let errorList = [];
          
          if (response.errors.missingFields && response.errors.missingFields.length > 0) {
            errorList.push(`Missing fields: ${response.errors.missingFields.join(', ')}`);
          }
          
          if (response.errors.validationErrors && response.errors.validationErrors.length > 0) {
            errorList = [...errorList, ...response.errors.validationErrors];
          }
          
          // If MongoDB validation errors are present
          if (Array.isArray(response.errors)) {
            response.errors.forEach(err => {
              errorList.push(`${err.field}: ${err.message}`);
            });
          }
          
          setValidationErrors(errorList);
          toast.error("Validation errors detected");
        } else {
          toast.error(response?.error || "Failed to save prediction. Please try again.");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the prediction.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Check if we have a valid prediction result
  if (!prediction || prediction.error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">
              Error Processing Results
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {prediction?.error ||
                  "There was an error processing the disease prediction. Please try again."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const urgencyDisplay = getUrgencyDisplay(prediction.urgencyLevel || "Low");
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {/* Header with title and actions */}
        <div className="bg-gradient-to-r from-green-50 to-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaInfoCircle className="text-green-600 mr-2 h-4 w-4" />
              Prediction Results
            </h2>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSavePrediction}
                  disabled={isSaving || isSaved}
                  className={`p-2 flex items-center ${
                    isSaved
                      ? "bg-green-100 text-green-700 border-green-300"
                      : isSaving
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : saveAttempted && validationErrors.length > 0
                      ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200 hover:border-blue-300"
                  } rounded-md border transition-colors`}
                  title={
                    isSaved
                      ? "Prediction already saved"
                      : "Save prediction to your history"
                  }
                >
                  <FaSave className={`h-3.5 w-3.5 ${validationErrors.length > 0 ? 'text-red-500' : ''}`} />
                  <span className="text-xs ml-1.5">
                    {isSaving 
                      ? "Saving..." 
                      : isSaved 
                      ? "Saved ✓" 
                      : saveAttempted && validationErrors.length > 0
                      ? "Fix Errors" 
                      : "Save"
                    }
                  </span>
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-gray-200 transition-colors flex items-center"
                  title="Print results"
                >
                  <FaPrint className="h-3.5 w-3.5" />
                  <span className="text-xs ml-1.5 hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-gray-200 transition-colors flex items-center"
                  title="Download JSON"
                >
                  <FaDownload className="h-3.5 w-3.5" />
                  <span className="text-xs ml-1.5 hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Saved notification - show when prediction is saved */}
        {isSaved && (
          <div className="px-4 py-2 bg-green-50 border-b border-green-200">
            <div className="flex items-start">
              <FaCheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="ml-2">
                <p className="text-xs text-green-700">
                  <span className="font-medium">Prediction saved</span> to your history.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mock Data Notification - show when using mock data (isMock property set) */}
        {prediction.isMock === true && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <div className="flex items-start">
              <IoMdInformationCircleOutline className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="ml-2">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Using simulated data:</span> Set up Gemini API key for real predictions.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Urgency level banner */}
        <div
          className={`${urgencyDisplay.bgColor} px-4 py-3 border-b ${urgencyDisplay.borderColor}`}
        >
          <div className="flex items-center">
            {urgencyDisplay.icon}
            <h3
              className={`${urgencyDisplay.color} text-base font-medium ml-2`}
            >
              Urgency Level: {prediction.urgencyLevel || "Not specified"}
            </h3>
          </div>
        </div>
        
        {/* Possible diseases section */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center">
            <FaInfoCircle className="text-green-600 mr-2 h-3.5 w-3.5" />
            Possible Diseases/Conditions
          </h4>
          
          <div className="space-y-3">
            {prediction.possibleDiseases &&
              prediction.possibleDiseases.map((disease, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Disease header (always visible) */}
                  <button
                    onClick={() => toggleDisease(index)}
                    className="w-full text-left px-3.5 py-2.5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800 text-sm">
                        {disease.name}
                      </span>
                      {disease.probability && (
                        <span
                          className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium border ${
                            disease.probability.toLowerCase() === "high"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : disease.probability.toLowerCase() === "medium"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {disease.probability}
                        </span>
                      )}
                    </div>
                    <div>
                      {expandedDisease === index ? (
                        <FaAngleDown className="h-3.5 w-3.5 text-gray-500" />
                      ) : (
                        <FaAngleRight className="h-3.5 w-3.5 text-gray-500" />
                      )}
                    </div>
                  </button>
                  
                  {/* Disease details (expandable) */}
                  {expandedDisease === index && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-1 gap-3">
                        {/* Description */}
                        {disease.description && (
                          <div className="bg-white p-3 rounded-md border border-gray-200">
                            <h5 className="text-xs font-medium text-gray-800 mb-1.5 flex items-center">
                              <FaInfoCircle className="mr-1.5 text-green-600 h-3 w-3" />
                              Description
                            </h5>
                            <p className="text-xs text-gray-700">
                              {disease.description}
                            </p>
                          </div>
                        )}
                        
                        {/* Treatment */}
                        {disease.treatment && (
                          <div className="bg-white p-3 rounded-md border border-blue-200 shadow-sm">
                            <h5 className="text-xs font-medium text-blue-800 mb-1.5 flex items-center">
                              <FaCheckCircle className="mr-1.5 text-blue-600 h-3 w-3" />
                              Treatment
                            </h5>
                            <p className="text-xs text-blue-700">
                              {disease.treatment}
                            </p>
                          </div>
                        )}
                        
                        {/* Precautions */}
                        {disease.precautions && (
                          <div className="bg-white p-3 rounded-md border border-yellow-200 shadow-sm">
                            <h5 className="text-xs font-medium text-yellow-800 mb-1.5 flex items-center">
                              <FaExclamationTriangle className="mr-1.5 text-yellow-600 h-3 w-3" />
                              Precautions
                            </h5>
                            <p className="text-xs text-yellow-700">
                              {disease.precautions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
        
        {/* Recommendations and next steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b border-gray-200 bg-gray-50">
          {/* Recommendations section */}
          {prediction.recommendations && (
            <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                <FaCheckCircle className="text-green-600 h-3.5 w-3.5 mr-1.5" />
                Recommendations
              </h4>
              <p className="text-xs text-gray-700">
                {prediction.recommendations}
              </p>
            </div>
          )}
          
          {/* Next steps section */}
          {prediction.nextSteps && (
            <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                <FaAngleRight className="text-green-600 h-3.5 w-3.5 mr-1.5" />
                Next Steps
              </h4>
              <p className="text-xs text-gray-700">
                {prediction.nextSteps}
              </p>
            </div>
          )}
        </div>
        
        {/* Prediction details */}
        <div className="px-4 py-3 bg-white">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Case Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {prediction.age && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200 flex flex-col items-center hover:border-green-300 transition-colors">
                <FaCalendarAlt className="h-3 w-3 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-500">Age</span>
                <span className="text-xs font-medium">
                  {typeof prediction.age === 'object' 
                    ? `${prediction.age.value} ${prediction.age.unit}`
                    : `${prediction.age} ${prediction.ageUnit || 'years'}`}
                </span>
              </div>
            )}
            {prediction.breed && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200 flex flex-col items-center hover:border-green-300 transition-colors">
                <MdOutlinePets className="h-3 w-3 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-500">Breed</span>
                <span className="text-xs font-medium">{prediction.breed}</span>
              </div>
            )}
            {prediction.gender && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200 flex flex-col items-center hover:border-green-300 transition-colors">
                <BsGenderAmbiguous className="h-3 w-3 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-500">Gender</span>
                <span className="text-xs font-medium capitalize">{prediction.gender}</span>
              </div>
            )}
            {prediction.temperature && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200 flex flex-col items-center hover:border-green-300 transition-colors">
                <FaThermometer className="h-3 w-3 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-500">Temp</span>
                <span className="text-xs font-medium">{prediction.temperature}°F</span>
              </div>
            )}
            {prediction.duration && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200 flex flex-col items-center hover:border-green-300 transition-colors">
                <FaClock className="h-3 w-3 text-gray-500 mb-1" />
                <span className="text-[10px] text-gray-500">Duration</span>
                <span className="text-xs font-medium">{prediction.duration}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Disclaimer - improved */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <p className="text-[10px] text-gray-500 flex items-center">
            <FaClock className="h-2.5 w-2.5 mr-1 text-gray-400" />
            Generated {new Date().toLocaleString()}. Not a substitute for professional veterinary advice.
          </p>
        </div>
      </div>
      {/* Add validation errors display below buttons if needed */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
            <FaExclamationTriangle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
            Validation Errors
          </h5>
          <ul className="text-xs text-red-600 list-disc pl-5 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PredictionResult;