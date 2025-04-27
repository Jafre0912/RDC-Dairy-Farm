import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useDiseaseStore from "../../../store/diseaseStore";
import useCattleStore from "../../../store/cattleStore";
import {
  FaCalendarAlt,
  FaThermometer,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaAngleRight,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
} from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import { MdOutlinePets } from "react-icons/md";
import { BsGenderAmbiguous } from "react-icons/bs";
import { formatDistanceToNow } from "date-fns";

const PredictionHistory = () => {
  const navigate = useNavigate();
  const { predictionHistory, historyPagination, historyLoading, fetchPredictionHistory } = useDiseaseStore();
  const { cattle, fetchCattle } = useCattleStore();
  const [selectedCattleId, setSelectedCattleId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cattleMap, setCattleMap] = useState({});

  // Fetch history on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchCattle();
      await fetchPredictionHistory(1, 10);
    };
    
    loadData();
  }, [fetchCattle, fetchPredictionHistory]);

  // Create a map of cattle data for easier lookup
  useEffect(() => {
    if (cattle && cattle.length > 0) {
      const map = {};
      cattle.forEach(c => {
        map[c._id] = {
          name: c.name,
          tagId: c.tagId,
          breed: c.breed
        };
      });
      setCattleMap(map);
    }
  }, [cattle]);

  // Handle page change
  const handlePageChange = async (page) => {
    setCurrentPage(page);
    await fetchPredictionHistory(page, 10, selectedCattleId || null);
  };

  // Handle filter by cattle
  const handleCattleFilter = async (cattleId) => {
    setSelectedCattleId(cattleId);
    setCurrentPage(1);
    await fetchPredictionHistory(1, 10, cattleId || null);
  };

  // Get cattle info from map or from populated cattle field
  const getCattleInfo = (record) => {
    // First check if the record has populated cattle data
    if (record.cattle && typeof record.cattle === 'object' && record.cattle.name) {
      return record.cattle;
    }
    
    // Then check if we have cattle ID and it exists in our map
    const cattleId = typeof record.cattle === 'string' ? record.cattle : record.cattleId;
    if (cattleId && cattleMap[cattleId]) {
      return cattleMap[cattleId];
    }
    
    return null;
  };

  // Navigate to prediction page
  const handleNewPrediction = () => {
    navigate('/dashboard/disease-prediction');
  };

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

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Disease Prediction History</h1>
          <p className="text-gray-600">View your past disease prediction records</p>
        </div>
        <button
          onClick={handleNewPrediction}
          className="mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
        >
          New Prediction
        </button>
      </div>

      {/* Filter by cattle */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <FaSearch className="text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filter by Cattle:</span>
          </div>
          <div className="ml-0 sm:ml-4 w-full sm:w-auto">
            <select
              value={selectedCattleId}
              onChange={(e) => handleCattleFilter(e.target.value)}
              className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="">All Cattle</option>
              {cattle
                .filter(c => c.status === "active")
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - {c.tagId}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {historyLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {/* No history message */}
      {!historyLoading && predictionHistory.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FaInfoCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No prediction history found</h3>
          <p className="text-gray-600 mb-6">
            You haven't saved any disease predictions yet.
            {selectedCattleId && " Try removing the cattle filter or selecting a different cattle."}
          </p>
          <button
            onClick={handleNewPrediction}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Make a Prediction
          </button>
        </div>
      )}

      {/* Prediction cards */}
      {!historyLoading && predictionHistory.length > 0 && (
        <div className="grid gap-6">
          {predictionHistory.map((record) => {
            const urgencyDisplay = getUrgencyDisplay(record.result.urgencyLevel);
            const cattleInfo = getCattleInfo(record);
            
            return (
              <div 
                key={record._id} 
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header with date and urgency */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-start mb-2 sm:mb-0">
                    <FaCalendarAlt className="text-gray-500 mt-1 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(record.createdAt).toLocaleDateString()} ({formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })})
                      </p>
                      {record.isMock && (
                        <span className="text-xs text-blue-600">Simulated data</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center ${urgencyDisplay.bgColor} ${urgencyDisplay.borderColor} px-3 py-1 rounded-full border`}>
                      {urgencyDisplay.icon}
                      <span className={`ml-1 text-sm font-medium ${urgencyDisplay.color}`}>
                        {record.result.urgencyLevel || "Low"} Urgency
                      </span>
                    </div>
                    <Link
                      to={`/dashboard/disease-prediction-detail/${record._id}`}
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                    >
                      View Details
                      <FaAngleRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
                
                {/* Cattle info */}
                {cattleInfo && (
                  <div className="px-6 py-3 bg-green-50 border-b border-green-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <FaCow className="text-green-600 mr-2 h-5 w-5" />
                        <span className="text-sm text-green-800 font-semibold">
                          {cattleInfo.name || "Unnamed"}
                        </span>
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                          Tag: {cattleInfo.tagId || "No Tag"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MdOutlinePets className="text-green-600 mr-1" />
                        <span className="text-xs text-green-700">{cattleInfo.breed || "Unknown Breed"}</span>
                        <BsGenderAmbiguous className="text-green-600 ml-3 mr-1" />
                        <span className="text-xs text-green-700 capitalize">{record.gender || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {!cattleInfo && record.cattleId && (
                  <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
                    <div className="flex items-center">
                      <FaInfoCircle className="text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Cattle ID: {record.cattleId} (Cattle information not found)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Main content */}
                <div className="px-6 py-4">
                  {/* Symptoms */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Symptoms:</h3>
                    <p className="text-sm text-gray-600">{record.symptoms}</p>
                  </div>
                  
                  {/* Diseases */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Possible Diseases:</h3>
                    <div className="space-y-2">
                      {record.result.possibleDiseases.map((disease, idx) => (
                        <div key={idx} className="flex items-start">
                          <FaAngleRight className="text-green-500 mt-1 mr-1 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-800">
                              {disease.name}
                            </span>
                            {disease.probability && (
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                disease.probability.toLowerCase() === "high"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : disease.probability.toLowerCase() === "medium"
                                  ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                  : "bg-green-100 text-green-800 border border-green-200"
                              }`}>
                                {disease.probability}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaCalendarAlt className="text-gray-500 h-3 w-3 mr-1" />
                        <span className="text-xs text-gray-500">Age</span>
                      </div>
                      <span className="text-sm font-medium">
                        {record.age.value} {record.age.unit}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaThermometer className="text-gray-500 h-3 w-3 mr-1" />
                        <span className="text-xs text-gray-500">Temperature</span>
                      </div>
                      <span className="text-sm font-medium">{record.temperature}°F</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaClock className="text-gray-500 h-3 w-3 mr-1" />
                        <span className="text-xs text-gray-500">Duration</span>
                      </div>
                      <span className="text-sm font-medium">{record.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!historyLoading && historyPagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`mr-2 p-2 rounded ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex space-x-1">
              {[...Array(historyPagination.pages)].map((_, idx) => {
                const page = idx + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-8 w-8 rounded flex items-center justify-center ${
                      currentPage === page
                        ? "bg-green-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === historyPagination.pages}
              className={`ml-2 p-2 rounded ${
                currentPage === historyPagination.pages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default PredictionHistory; 