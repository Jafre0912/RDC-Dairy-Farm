import { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaEllipsisV } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { format } from "date-fns";
import { toast } from "react-toastify";

import useCattleStore from "../../../../store/cattleStore";
import useMilkProductionStore from "../../../../store/milkProductionStore";
import AddCattleModal from "./AddCattleModal";
import ActionPopup from "./ActionPopup";

const Cattle = () => {
  const {
    cattle,
    isLoading,
    error,
    fetchCattle,
    createCattle,
    deleteCattle,
    updateHealthStatus,
    changeCattleStatus,
    getBreedOptions,
    getHealthStatusOptions,
    getFormattedHealthStatus,
    setFilter,
  } = useCattleStore();

  const { milkProductions, fetchMilkProductions } = useMilkProductionStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cattleToDelete, setCattleToDelete] = useState(null);

  // Action popup state
  const [popupState, setPopupState] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    cattleId: null,
  });

  useEffect(() => {
    fetchCattle();
    fetchMilkProductions();
  }, [fetchCattle, fetchMilkProductions]);

  // Filter and search
  const filteredCattle = cattle.filter((cow) => {
    const matchesSearch =
      cow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cow.tagId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || cow.healthStatus?.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const totalCattle = cattle.length;
  const healthyCattle = cattle.filter(
    (cow) => cow.healthStatus?.status === "healthy"
  ).length;

  // Get daily milk - assuming we're connecting to milk production data
  const totalMilk = (() => {
    if (!milkProductions || milkProductions.length === 0) return "0.00";
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = milkProductions.filter(record => 
      record.date.startsWith(today)
    );
    
    const total = todayRecords.reduce((sum, record) => {
      const morningAmount = parseFloat(record.morningAmount) || 0;
      const eveningAmount = parseFloat(record.eveningAmount) || 0;
      return sum + morningAmount + eveningAmount;
    }, 0);
    
    return total.toFixed(2);
  })();

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setFilter("healthStatus", status === "all" ? "" : status);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "Unknown";
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return `${age} yrs`;
  };

  // Open action popup menu
  const handleOpenActionPopup = (e, cattleId) => {
    e.preventDefault();
    // Get click position for the popup
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupState({
      isOpen: true,
      position: {
        x: rect.right,
        y: rect.top + window.scrollY,
      },
      cattleId,
    });
  };

  // Close action popup
  const handleCloseActionPopup = () => {
    setPopupState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  // Handle health status change
  const handleHealthStatusChange = async (status) => {
    try {
      await updateHealthStatus(popupState.cattleId, status);
      toast.success(
        `Health status updated to ${getFormattedHealthStatus(status)}`
      );
      handleCloseActionPopup();
    } catch (err) {
      toast.error("Failed to update health status");
    }
  };

  // Handle cattle status change
  const handleStatusChange = async (status) => {
    try {
      await changeCattleStatus(popupState.cattleId, status);
      toast.success(`Cattle status updated to ${status}`);
      handleCloseActionPopup();
    } catch (err) {
      toast.error("Failed to update cattle status");
    }
  };

  // Handle delete
  const handleConfirmDelete = () => {
    const cattleToDelete = cattle.find((c) => c._id === popupState.cattleId);
    if (cattleToDelete) {
      setCattleToDelete(cattleToDelete);
      setShowDeleteConfirm(true);
      handleCloseActionPopup();
    }
  };

  const handleDelete = async () => {
    if (!cattleToDelete) return;

    try {
      await deleteCattle(cattleToDelete._id);
      toast.success(
        `Cattle ${cattleToDelete.name} (${cattleToDelete.tagId}) deleted successfully`
      );
      setShowDeleteConfirm(false);
      setCattleToDelete(null);
    } catch (err) {
      toast.error("Failed to delete cattle");
    }
  };



  // Calculate total milk production for a specific cattle
  const calculateTotalMilk = (cattleId) => {
    if (!milkProductions || milkProductions.length === 0 || !cattleId) {
      return "0.00";
    }
    
    // Handle if cattleId is an object
    const cattleIdentifier = typeof cattleId === 'object' ? cattleId.tagId : cattleId;
    
    // Filter records for this cattle
    const records = milkProductions.filter(record => {
      const recordCattleId = typeof record.cattleId === 'object' 
        ? record.cattleId.tagId 
        : record.cattleId;
        
      return recordCattleId === cattleIdentifier;
    });
    
    if (records.length === 0) {
      return "0.00";
    }
    
    // Sum up all milk production for this cattle
    const totalMilk = records.reduce((sum, record) => {
      const morningAmount = parseFloat(record.morningAmount || 0);
      const eveningAmount = parseFloat(record.eveningAmount || 0);
      return sum + morningAmount + eveningAmount;
    }, 0);
    
    return totalMilk.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <FiLoader className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Cattle data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading cattle data</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchCattle}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cattle Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <FaPlus size={14} />
          <span>Add Cattle</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Cattle</p>
          <p className="text-2xl font-bold text-gray-800">{totalCattle}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Healthy</p>
          <p className="text-2xl font-bold text-green-600">{healthyCattle}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Daily Milk (L)</p>
          <p className="text-2xl font-bold text-blue-600">{totalMilk}</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by Tag ID or name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-3 text-gray-400">
            <FaSearch />
          </div>
        </div>
        <select
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterStatus}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="sick">Sick</option>
          <option value="quarantined">Quarantined</option>
          <option value="pregnant">Pregnant</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tag ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Milk (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added On
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCattle.map((cow) => (
                <tr key={cow._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cow.tagId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cow.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cow.breed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateAge(cow.dateOfBirth)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          cow.healthStatus?.status === "healthy"
                            ? "bg-green-100 text-green-800"
                            : cow.healthStatus?.status === "sick"
                            ? "bg-red-100 text-red-800"
                            : cow.healthStatus?.status === "quarantined"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {cow.healthStatus?.status
                        ? cow.healthStatus.status.charAt(0).toUpperCase() +
                          cow.healthStatus.status.slice(1)
                        : "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cow.gender.charAt(0).toUpperCase() + cow.gender.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateTotalMilk(cow.tagId)} L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cow.createdAt
                      ? format(new Date(cow.createdAt), "yyyy-MM-dd")
                      : "Unknown"}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => handleOpenActionPopup(e, cow._id)}
                      className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
                      aria-label="Actions"
                    >
                      <FaEllipsisV />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredCattle.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No cattle matching your filters</p>
          </div>
        )}
      </div>

      {/* Add Cattle Modal */}
      {showAddModal && (
        <AddCattleModal
          onClose={() => setShowAddModal(false)}
          onAdd={createCattle}
          healthOptions={getHealthStatusOptions()}
          breedOptions={getBreedOptions()}
        />
      )}

      {/* Action Popup using Portal */}
      <ActionPopup
        isOpen={popupState.isOpen}
        onClose={handleCloseActionPopup}
        position={popupState.position}
        cattleId={popupState.cattleId}
        onHealthStatusChange={handleHealthStatusChange}
        onStatusChange={handleStatusChange}
        onDelete={handleConfirmDelete}
        currentHealthStatus={
          cattle.find((c) => c._id === popupState.cattleId)?.healthStatus
            ?.status || "healthy"
        }
        currentStatus={
          cattle.find((c) => c._id === popupState.cattleId)?.status || "active"
        }
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 animate-popup">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete cattle{" "}
              <span className="font-semibold">{cattleToDelete?.name}</span> with
              tag ID{" "}
              <span className="font-semibold">{cattleToDelete?.tagId}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCattleToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cattle;
