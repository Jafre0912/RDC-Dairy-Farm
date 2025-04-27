import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  FiLoader,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiRefreshCw,
} from "react-icons/fi";
import { BiReset } from "react-icons/bi";
import useMPPStore from "../../../store/mppStore";
import useAuthStore from "../../../store/authStore";
import apiClient from "../../../config/axiosConfig";
import MilkCollectionForm from "./MilkCollectionForm";
import MilkCollectionList from "./MilkCollectionList";
import MilkCollectionStats from "./MilkCollectionStats";
import { FaPlus } from "react-icons/fa";

// Add debug functions
const testApiConnection = async () => {
  try {
    console.log("Testing API connection...");
    const authToken = useAuthStore.getState().token;
    console.log("Auth token present:", !!authToken);

    // First test the unauthenticated endpoint
    const rateResponse = await apiClient.get("/fat/snf/values");
    console.log("Rate values endpoint:", rateResponse.data);

    // Then test an authenticated endpoint
    const response = await apiClient.get("/mpp/collection");
    console.log("MPP Collection endpoint:", response.data);

    toast.success("API connection successful!");
    return true;
  } catch (error) {
    console.error("API test failed:", error);
    toast.error(`API error: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

// Add a test form submission function
const testFormSubmission = async () => {
  try {
    console.log("Testing form submission...");

    // Get available values for fat and snf
    const valuesResponse = await apiClient.get("/fat/snf/values");
    const { fat: fatValues, snf: snfValues } = valuesResponse.data.data;

    // Create a test submission with valid data
    const testData = {
      farmerId: 1001, // Test farmer ID
      collectionDate: new Date().toISOString().split("T")[0],
      shift: "morning",
      milkType: "C",
      fat: parseFloat(fatValues[0]), // First available fat value
      snf: parseFloat(snfValues[0]), // First available snf value
      quantity: 10.5,
    };

    console.log("Submitting test data:", testData);

    // Attempt to create a milk collection
    const response = await apiClient.post("/mpp/collection", testData);
    console.log("Form submission result:", response.data);

    toast.success("Test form submission successful!");
    return true;
  } catch (error) {
    console.error("Form submission test failed:", error);
    console.log("Request config:", error.config);
    console.log("Response data:", error.response?.data);
    toast.error(
      `Form submission error: ${error.response?.data?.message || error.message}`
    );
    return false;
  }
};

const MPPDashboard = ({ embedded }) => {
  const { user } = useAuthStore();
  const {
    milkCollections,
    isLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    fetchMilkCollections,
    fetchStats,
    fetchShiftStats,
  } = useMPPStore();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchMilkCollections();
    fetchStats();
    fetchShiftStats();
  }, [fetchMilkCollections, fetchStats, fetchShiftStats]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ [name]: value });
  };

  // Apply filters
  const applyFilters = () => {
    fetchMilkCollections();
    fetchStats();
    fetchShiftStats();
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    clearFilters();
    fetchMilkCollections();
    fetchStats();
    fetchShiftStats();
    setShowFilters(false);
  };

  // Open form for new entry
  const handleAddNew = () => {
    setEditMode(false);
    setEditId(null);
    setShowForm(true);
  };

  // Open form for editing
  const handleEdit = (id) => {
    setEditMode(true);
    setEditId(id);
    setShowForm(true);
  };

  // Close form
  const closeForm = () => {
    setShowForm(false);
    setEditMode(false);
    setEditId(null);
  };

  // Handle form submission (handled in the form component)

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchMilkCollections}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        embedded ? "" : "py-6 px-4 sm:px-6 md:px-8 bg-gray-50 min-h-screen"
      }
    >
      <div
        className={
          embedded
            ? "flex justify-between items-center mb-6"
            : "flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        }
      >
        {!embedded && (
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Milk Collection Management
          </h1>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiFilter className="mr-2" />
            Filters
          </button>

          <button
            onClick={handleAddNew}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            New Collection
          </button>

          {/* Debug button - only visible in development */}
          {process.env.NODE_ENV === "development" && (
            <>
              <button
                onClick={testApiConnection}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Test API
              </button>
              <button
                onClick={testFormSubmission}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                Test Form Submit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-md shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <FiCalendar className="inline mr-1" /> Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <FiCalendar className="inline mr-1" /> End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="shift"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Shift
              </label>
              <select
                id="shift"
                name="shift"
                value={filters.shift}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="milkType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Milk Type
              </label>
              <select
                id="milkType"
                name="milkType"
                value={filters.milkType}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="C">Cow (C)</option>
                <option value="B">Buffalo (B)</option>
                <option value="M">Mixed (M)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <BiReset className="inline mr-1" /> Reset
            </button>

            <button
              onClick={applyFilters}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FiSearch className="inline mr-1" /> Apply
            </button>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <MilkCollectionStats />

      {/* Collection Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editMode ? "Edit Milk Collection" : "New Milk Collection"}
              </h3>
            </div>

            <MilkCollectionForm
              editMode={editMode}
              editId={editId}
              onClose={closeForm}
              farmerId={user.id} // Use current user's ID as the farmer ID
            />
          </div>
        </div>
      )}

      {/* Collection List */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin h-8 w-8 text-green-600" />
          </div>
        ) : (
          <MilkCollectionList
            onEdit={handleEdit}
            collections={milkCollections}
          />
        )}
      </div>
    </div>
  );
};

export default MPPDashboard;
