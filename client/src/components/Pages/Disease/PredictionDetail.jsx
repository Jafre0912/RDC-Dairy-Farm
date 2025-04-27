import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useDiseaseStore from "../../../store/diseaseStore";
import {
  FaCalendarAlt,
  FaThermometer,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaArrowLeft,
  FaClock,
  FaTag,

  FaPaw,
  FaVenusMars,
} from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import { formatDistanceToNow } from "date-fns";

const PredictionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { prediction, loading, error, fetchPredictionById } = useDiseaseStore();

  useEffect(() => {
    if (id) {
      fetchPredictionById(id);
    }
  }, [id, fetchPredictionById]);

  // Function to determine urgency level color and styling
  const getUrgencyDisplay = (level) => {
    const levelLower = level?.toLowerCase() || "low";
    
    if (levelLower === "emergency") {
      return {
        color: "text-red-700",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
        icon: <FaExclamationTriangle className="text-red-600 h-4 w-4" />,
      };
    } else if (levelLower === "high") {
      return {
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-200",
        icon: <FaExclamationTriangle className="text-orange-600 h-4 w-4" />,
      };
    } else if (levelLower === "medium") {
      return {
        color: "text-yellow-700",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-200",
        icon: <FaInfoCircle className="text-yellow-600 h-4 w-4" />,
      };
    } else {
      return {
        color: "text-green-700",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
        icon: <FaCheckCircle className="text-green-600 h-4 w-4" />,
      };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center text-red-600 mb-4">
            <FaExclamationTriangle className="h-5 w-5 mr-2" />
            <h1 className="text-xl font-semibold">Error Loading Prediction</h1>
          </div>
          <p className="text-gray-600 mb-4">{error || "Prediction not found"}</p>
          <button
            onClick={() => navigate("/dashboard/disease-history")}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  const urgencyDisplay = getUrgencyDisplay(prediction.result.urgencyLevel);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard/disease-prediction-history")}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <FaArrowLeft className="mr-2" />
        Back to History
      </button>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-start mb-2 sm:mb-0">
              <FaCalendarAlt className="text-gray-500 mt-1 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(prediction.createdAt).toLocaleDateString()} ({formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true })})
                </p>
                {prediction.isMock && (
                  <span className="text-xs text-blue-600">Simulated data</span>
                )}
              </div>
            </div>
            <div className={`flex items-center ${urgencyDisplay.bgColor} ${urgencyDisplay.borderColor} px-3 py-1 rounded-full border`}>
              {urgencyDisplay.icon}
              <span className={`ml-1 text-sm font-medium ${urgencyDisplay.color}`}>
                {prediction.result.urgencyLevel || "Low"} Urgency
              </span>
            </div>
          </div>
        </div>

        {/* Cattle Information */}
        {prediction.cattle && (
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <h2 className="text-lg font-semibold text-green-800 mb-3">Cattle Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center">
                <FaCow className="text-green-600 mr-2" />
                <span className="text-green-800">{prediction.cattle.name}</span>
              </div>
              <div className="flex items-center">
                <FaTag className="text-green-600 mr-2" />
                <span className="text-green-800">Tag: {prediction.cattle.tagId}</span>
              </div>
              <div className="flex items-center">
                <FaPaw className="text-green-600 mr-2" />
                <span className="text-green-800">{prediction.cattle.breed}</span>
              </div>
              <div className="flex items-center">
                <FaVenusMars className="text-green-600 mr-2" />
                <span className="text-green-800 capitalize">{prediction.cattle.gender}</span>
              </div>
            </div>
          </div>
        )}

        {/* Symptoms */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Symptoms</h2>
          <p className="text-gray-600">{prediction.symptoms}</p>
        </div>

        {/* Possible Diseases */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Possible Diseases</h2>
          <div className="space-y-3">
            {prediction.result.possibleDiseases.map((disease, idx) => (
              <div key={idx} className="flex items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{disease.name}</h3>
                  {disease.description && (
                    <p className="text-sm text-gray-600 mt-1">{disease.description}</p>
                  )}
                </div>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  disease.probability.toLowerCase() === "high"
                    ? "bg-red-100 text-red-800 border border-red-200"
                    : disease.probability.toLowerCase() === "medium"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    : "bg-green-100 text-green-800 border border-green-200"
                }`}>
                  {disease.probability}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Additional Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center mb-1">
                <FaCalendarAlt className="text-gray-500 h-4 w-4 mr-1" />
                <span className="text-sm text-gray-500">Age</span>
              </div>
              <span className="text-sm font-medium">
                {prediction.age.value} {prediction.age.unit}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center mb-1">
                <FaThermometer className="text-gray-500 h-4 w-4 mr-1" />
                <span className="text-sm text-gray-500">Temperature</span>
              </div>
              <span className="text-sm font-medium">{prediction.temperature}°F</span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="flex items-center mb-1">
                <FaClock className="text-gray-500 h-4 w-4 mr-1" />
                <span className="text-sm text-gray-500">Duration</span>
              </div>
              <span className="text-sm font-medium">{prediction.duration}</span>
            </div>
          </div>
        </div>

        {/* Recommendations and Next Steps */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h2>
          {prediction.result.recommendations && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">General Recommendations</h3>
              <p className="text-gray-600">{prediction.result.recommendations}</p>
            </div>
          )}
          {prediction.result.nextSteps && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Next Steps</h3>
              <p className="text-gray-600">{prediction.result.nextSteps}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionDetail; 