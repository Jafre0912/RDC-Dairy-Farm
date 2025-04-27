import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiLoader,
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiActivity,
  FiHeart,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiPlus,
  FiTag,
  FiShield,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import useCattleStore from "../../../../store/cattleStore";

const CattleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getCattleById,
    activeCattle,
    isLoading,
    error,
    updateHealthStatus,
    changeCattleStatus,
    deleteCattle,
    getFormattedHealthStatus,
    clearActiveCattle,
  } = useCattleStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  // Fetch cattle data when component mounts or id changes
  useEffect(() => {
    getCattleById(id);

    // Clear active cattle when component unmounts
    return () => clearActiveCattle();
  }, [id, getCattleById, clearActiveCattle]);

  // Handle health status change
  const handleHealthStatusChange = async (status) => {
    try {
      await updateHealthStatus(id, status);
      toast.success(
        `Health status updated to ${getFormattedHealthStatus(status)}`
      );
    } catch (err) {
      toast.error("Failed to update health status");
    }
  };

  // Handle cattle status change
  const handleStatusChange = async (status) => {
    try {
      await changeCattleStatus(id, status);
      toast.success(`Cattle status updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update cattle status");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteCattle(id);
      toast.success(`Cattle deleted successfully`);
      navigate("/dashboard/cattle");
    } catch (err) {
      toast.error("Failed to delete cattle");
      setShowDeleteConfirm(false);
    }
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
    return `${age} years`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <FiLoader className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading cattle details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading cattle details</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => getCattleById(id)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!activeCattle) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Cattle not found</p>
          <Link
            to="/dashboard/cattle"
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Cattle List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
          <Link
            to="/dashboard/cattle"
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              {activeCattle.name}
              <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                {activeCattle.tagId}
              </span>
            </h1>
            <p className="text-gray-500">
              {activeCattle.breed} •{" "}
              {activeCattle.gender.charAt(0).toUpperCase() +
                activeCattle.gender.slice(1)}{" "}
              •{calculateAge(activeCattle.dateOfBirth)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/dashboard/cattle/edit/${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiEdit2 size={16} />
            <span>Edit</span>
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
          >
            <FiTrash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Status and Health badges */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm text-gray-500 mb-1 flex items-center">
            <FiTag className="mr-2 text-gray-400" /> Status
          </h3>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleStatusChange("active")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCattle.status === "active"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusChange("sold")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCattle.status === "sold"
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sold
            </button>
            <button
              onClick={() => handleStatusChange("deceased")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCattle.status === "deceased"
                  ? "bg-gray-300 text-gray-800 border border-gray-400"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Deceased
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm text-gray-500 mb-1 flex items-center">
            <FiHeart className="mr-2 text-red-400" /> Health Status
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => handleHealthStatusChange("healthy")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCattle.healthStatus?.status === "healthy"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Healthy
            </button>
            <button
              onClick={() => handleHealthStatusChange("sick")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCattle.healthStatus?.status === "sick"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sick
            </button>
            <button
              onClick={() => handleHealthStatusChange("quarantined")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCattle.healthStatus?.status === "quarantined"
                  ? "bg-purple-100 text-purple-800 border border-purple-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Quarantined
            </button>
            <button
              onClick={() => handleHealthStatusChange("pregnant")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCattle.healthStatus?.status === "pregnant"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Pregnant
            </button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeSection === "overview"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveSection("overview")}
          >
            Overview
          </button>
          <button
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeSection === "health"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveSection("health")}
          >
            Health Records
          </button>
          <button
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeSection === "production"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveSection("production")}
          >
            Production
          </button>
          <button
            className={`py-3 px-1 text-sm font-medium border-b-2 ${
              activeSection === "notes"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveSection("notes")}
          >
            Notes
          </button>
        </nav>
      </div>

      {/* Content sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeSection === "overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FiTag className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Tag ID</span>
                  </div>
                  <p className="text-lg font-medium">{activeCattle.tagId}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FiFileText className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Name</span>
                  </div>
                  <p className="text-lg font-medium">{activeCattle.name}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FiShield className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Breed</span>
                  </div>
                  <p className="text-lg font-medium">{activeCattle.breed}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FiCalendar className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Date of Birth</span>
                  </div>
                  <p className="text-lg font-medium">
                    {activeCattle.dateOfBirth
                      ? format(new Date(activeCattle.dateOfBirth), "PPP")
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {calculateAge(activeCattle.dateOfBirth)} old
                  </p>
                </div>
              </div>

              <div>
                {activeCattle.purchaseInfo && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium mb-3 flex items-center">
                      <FiDollarSign className="mr-2 text-green-600" /> Purchase
                      Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Purchase Date
                        </p>
                        <p className="font-medium">
                          {activeCattle.purchaseInfo.date
                            ? format(
                                new Date(activeCattle.purchaseInfo.date),
                                "PPP"
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Cost</p>
                        <p className="font-medium">
                          {activeCattle.purchaseInfo.cost
                            ? `$${activeCattle.purchaseInfo.cost.toFixed(2)}`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Source</p>
                        <p className="font-medium">
                          {activeCattle.purchaseInfo.source || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FiActivity className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">Added On</span>
                  </div>
                  <p className="text-lg font-medium">
                    {activeCattle.createdAt
                      ? format(new Date(activeCattle.createdAt), "PPP")
                      : "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "health" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Health Records
              </h2>
              <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-green-700">
                <FiPlus size={16} />
                <span>Add Record</span>
              </button>
            </div>

            {/* Vaccinations */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">
                Vaccinations
              </h3>
              {activeCattle.healthStatus?.vaccinations?.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vaccination
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activeCattle.healthStatus.vaccinations.map(
                        (vaccination, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {vaccination.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vaccination.date
                                ? format(new Date(vaccination.date), "PP")
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-red-600 hover:text-red-800">
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  No vaccination records found
                </div>
              )}
            </div>

            {/* Medical History */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">
                Medical History
              </h3>
              {activeCattle.healthStatus?.medicalHistory?.length > 0 ? (
                <div className="space-y-4">
                  {activeCattle.healthStatus.medicalHistory.map(
                    (record, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {record.condition}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {record.date
                                ? format(new Date(record.date), "PPP")
                                : "N/A"}
                            </p>
                          </div>
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            Remove
                          </button>
                        </div>
                        {record.treatment && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">Treatment:</p>
                            <p className="text-sm">{record.treatment}</p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  No medical records found
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "production" && (
          <div className="text-center py-8">
            <FiActivity className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">
              Production Data
            </h3>
            <p className="text-gray-500 mt-2">
              No production data available for this cattle.
            </p>
          </div>
        )}

        {activeSection === "notes" && (
          <div className="text-center py-8">
            <FiFileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Notes</h3>
            <p className="text-gray-500 mt-2">
              No notes have been added for this cattle.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 animate-popup">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete cattle{" "}
              <span className="font-semibold">{activeCattle?.name}</span> with
              tag ID{" "}
              <span className="font-semibold">{activeCattle?.tagId}</span>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
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

export default CattleDetails;
