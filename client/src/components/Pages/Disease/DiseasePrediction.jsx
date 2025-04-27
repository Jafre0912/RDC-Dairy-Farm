import { useState } from "react";
import { FaHeartbeat, FaClock, FaThermometerHalf, FaVial, FaHistory } from "react-icons/fa";
import { MdError, MdOutlinePets, MdOutlineHealthAndSafety } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FiLoader } from "react-icons/fi";
import { Link } from "react-router-dom";
import useDiseaseStore from "../../../store/diseaseStore";
import PredictionForm from "./PredictionForm";
import PredictionResult from "./PredictionResult";
import { toast } from "react-hot-toast";

const DiseasePrediction = () => {
  const { prediction, loading, error, predictDisease, resetPrediction } = useDiseaseStore();
  const [activeTab, setActiveTab] = useState("form");
  const [loadingState, setLoading] = useState(false);
  
  // Handle the form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    
    try {
      // Create a deep copy of the form data to avoid mutations
      const predictionData = JSON.parse(JSON.stringify(formData));
      
      // Validate required fields
      if (!predictionData.symptoms) {
        toast.error('Symptoms are required');
        setLoading(false);
        return;
      }
      
      // Validate cattle ID
      if (!predictionData.cattleId) {
        toast.error('Selecting a cattle is required');
        setLoading(false);
        return;
      }
      
      // Normalize symptoms to ensure it's a string
      if (Array.isArray(predictionData.symptoms)) {
        predictionData.symptoms = predictionData.symptoms.join(', ');
      }
      
      // Validate and format age - CRITICAL FIX
      if (!predictionData.age && predictionData.age !== 0) {
        toast.error('Age is required');
        setLoading(false);
        return;
      }
      
      // Always ensure age is formatted as an object as required by API
      if (typeof predictionData.age !== 'object' || predictionData.age === null) {
        const ageValue = Number(predictionData.age);
        
        if (isNaN(ageValue) || ageValue <= 0) {
          toast.error('Age must be a positive number');
          setLoading(false);
          return;
        }
        
        // Convert to the required object format
        predictionData.age = {
          value: ageValue,
          unit: predictionData.ageUnit || 'years'
        };
        
        // Remove the separate ageUnit field if it exists
        if (predictionData.ageUnit) {
          delete predictionData.ageUnit;
        }
      } else {
        // If it's already an object, ensure value is a valid number
        if (predictionData.age.value !== undefined) {
          const ageValue = Number(predictionData.age.value);
          
          if (isNaN(ageValue) || ageValue <= 0) {
            toast.error('Age value must be a positive number');
            setLoading(false);
            return;
          }
          
          predictionData.age.value = ageValue;
        } else {
          toast.error('Age value is missing');
          setLoading(false);
          return;
        }
        
        // Ensure unit is present
        if (!predictionData.age.unit) {
          predictionData.age.unit = predictionData.ageUnit || 'years';
        }
      }
      
      // Ensure temperature is a number
      if (predictionData.temperature) {
        predictionData.temperature = Number(predictionData.temperature);
      }
      
      // Call the API
      const result = await predictDisease(predictionData);
      
      if (result.success) {
        // Ensure the result data has the properly formatted age
        if (result.data) {
          // If the API returns age as a primitive, convert it to an object
          if (result.data.age !== undefined && (typeof result.data.age !== 'object' || result.data.age === null)) {
            const ageValue = Number(result.data.age);
            const ageUnit = result.data.ageUnit || predictionData.age.unit || 'years';
            
            result.data.age = {
              value: ageValue,
              unit: ageUnit
            };
            
            // Remove the separate ageUnit if it exists
            if (result.data.ageUnit) {
              delete result.data.ageUnit;
            }
          }
          
          // If the age is already an object but missing a unit
          if (typeof result.data.age === 'object' && result.data.age !== null && !result.data.age.unit) {
            result.data.age.unit = predictionData.age.unit || 'years';
          }
        }
        
        setActiveTab("results");
      } else if (result.errors) {
        toast.error('Validation failed: ' + (result.error || 'Please check all fields'));
      }
    } catch (error) {
      toast.error('Error generating prediction: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Start a new prediction
  const handleNewPrediction = () => {
    resetPrediction();
    setActiveTab("form");
  };
  
  return (
    <div className="p-4 md:p-5 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-5 bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MdOutlineHealthAndSafety className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-green-800 mb-1">
                Cattle Disease Prediction
              </h1>
              <p className="text-sm text-gray-600">
                AI-powered analysis for potential cattle diseases
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link 
              to="/dashboard/cattle" 
              className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 hover:shadow-sm transition-all border border-green-100"
            >
              <MdOutlinePets className="h-3.5 w-3.5" />
              <span className="text-sm">Manage Cattle</span>
            </Link>
            <Link 
              to="/dashboard/disease-history" 
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 hover:shadow-sm transition-all border border-blue-100"
            >
              <FaHistory className="h-3.5 w-3.5" />
              <span className="text-sm">View History</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded-md shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MdError className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Information Box - Before Form */}
      <div className="mb-5 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-start">
          <IoMdInformationCircleOutline className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Note</h3>
            <p className="mt-1 text-sm text-blue-700">
              You must select a cattle record before submitting a disease prediction request. This allows for more accurate diagnostics and proper record keeping.
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200 bg-white rounded-t-lg shadow-md">
        <nav className="flex">
          <button
            onClick={() => !prediction && setActiveTab("form")}
            className={`${
              activeTab === "form"
                ? "border-green-500 text-green-600 bg-green-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            } flex-1 whitespace-nowrap py-3 px-5 border-b-2 font-medium text-sm transition-colors rounded-tl-lg`}
            disabled={!!prediction}
          >
            <div className="flex items-center justify-center">
              <FaVial className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Symptom Entry</span>
            </div>
          </button>
          <button
            onClick={() => prediction && setActiveTab("results")}
            className={`${
              activeTab === "results"
                ? "border-green-500 text-green-600 bg-green-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            } flex-1 whitespace-nowrap py-3 px-5 border-b-2 font-medium text-sm transition-colors rounded-tr-lg`}
            disabled={!prediction}
          >
            <div className="flex items-center justify-center">
              <FaHeartbeat className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Prediction Results</span>
            </div>
          </button>
        </nav>
      </div>
      
      {/* Loading State */}
      {loadingState && (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium text-green-800 mb-2">Analyzing symptoms...</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        </div>
      )}
      
      {/* Content Area */}
      {!loadingState && (
        <>
          {activeTab === "form" && (
            <PredictionForm onSubmit={handleSubmit} />
          )}
          
          {activeTab === "results" && prediction && (
            <div className="mt-4">
              <PredictionResult prediction={prediction} />
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleNewPrediction}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-md hover:from-green-700 hover:to-green-600 transition-all shadow-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm"
                >
                  Start New Prediction
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Information Box - Modern Version */}
      <div className="mt-5 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-start">
          <IoMdInformationCircleOutline className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Note</h3>
            <p className="mt-1 text-sm text-blue-700">
              This tool provides preliminary predictions and is not a replacement for professional veterinary diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseasePrediction; 