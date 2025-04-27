import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiLoader,
  FiArrowLeft,
  FiSave,
  FiCalendar,
  FiDollarSign,
  FiTag,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import useCattleStore from "../../../../store/cattleStore";

const EditCattle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getCattleById,
    activeCattle,
    isLoading,
    error,
    updateCattle,
    validationErrors,
    clearValidationErrors,
  } = useCattleStore();

  const [formData, setFormData] = useState({
    tagId: "",
    name: "",
    breed: "",
    dateOfBirth: "",
    gender: "female",
    healthStatus: {
      status: "healthy",
    },
    status: "active",
    purchaseInfo: {
      date: "",
      cost: "",
      source: "",
    },
  });

  const [includePurchaseInfo, setIncludePurchaseInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Fetch cattle data when component mounts or id changes
  useEffect(() => {
    const fetchData = async () => {
      const data = await getCattleById(id);
      if (data) {
        // Initialize form data with cattle data
        setFormData({
          tagId: data.tagId || "",
          name: data.name || "",
          breed: data.breed || "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
          gender: data.gender || "female",
          healthStatus: {
            status: data.healthStatus?.status || "healthy",
          },
          status: data.status || "active",
          purchaseInfo: {
            date: data.purchaseInfo?.date ? data.purchaseInfo.date.split("T")[0] : "",
            cost: data.purchaseInfo?.cost || "",
            source: data.purchaseInfo?.source || "",
          },
        });

        // Set includePurchaseInfo based on whether purchase info exists
        setIncludePurchaseInfo(
          !!(
            data.purchaseInfo?.date ||
            data.purchaseInfo?.cost ||
            data.purchaseInfo?.source
          )
        );
      }
    };

    fetchData();
    clearValidationErrors?.();

    // Clear validation errors when component unmounts
    return () => clearValidationErrors?.();
  }, [id, getCattleById, clearValidationErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const getFieldError = (field) => {
    if (!validationErrors) return null;
    return validationErrors[field];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    clearValidationErrors?.();
    setIsSubmitting(true);

    try {
      // Prepare the data, conditionally including purchase info
      const preparedData = {
        ...formData,
        purchaseInfo: includePurchaseInfo
          ? {
              date: formData.purchaseInfo.date || null,
              cost: formData.purchaseInfo.cost
                ? Number(formData.purchaseInfo.cost)
                : null,
              source: formData.purchaseInfo.source || null,
            }
          : null,
      };

      const result = await updateCattle(id, preparedData);
      
      if (result?.success) {
        toast.success("Cattle updated successfully");
        navigate(`/dashboard/cattle/${id}`);
      } else {
        setFormError("Failed to update cattle. Please check the form.");
        if (result?.errors) {
          // If server returns validation errors, show them
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      setFormError("An error occurred while updating the cattle.");
    } finally {
      setIsSubmitting(false);
    }
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

  if (error && !activeCattle) {
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link
            to={`/dashboard/cattle/${id}`}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edit Cattle</h1>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
            <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <div>{formError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Basic Information
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag ID
                </label>
                <input
                  type="text"
                  name="tagId"
                  value={formData.tagId}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg ${
                    getFieldError("tagId")
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {getFieldError("tagId") && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError("tagId")}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg ${
                    getFieldError("name")
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {getFieldError("name") && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError("name")}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-lg ${
                      getFieldError("dateOfBirth")
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  <FiCalendar className="absolute right-3 top-3 text-gray-400" />
                </div>
                {getFieldError("dateOfBirth") && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError("dateOfBirth")}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-green-600"
                    />
                    <span className="ml-2">Female</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-green-600"
                    />
                    <span className="ml-2">Male</span>
                  </label>
                </div>
                {getFieldError("gender") && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError("gender")}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Additional Information
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breed
                </label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-lg ${
                    getFieldError("breed")
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {getFieldError("breed") && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError("breed")}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Health Status
                </label>
                <select
                  name="healthStatus.status"
                  value={formData.healthStatus.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="healthy">Healthy</option>
                  <option value="sick">Sick</option>
                  <option value="quarantined">Quarantined</option>
                  <option value="pregnant">Pregnant</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="mb-6 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="includePurchaseInfo"
                checked={includePurchaseInfo}
                onChange={() => setIncludePurchaseInfo(!includePurchaseInfo)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label
                htmlFor="includePurchaseInfo"
                className="ml-2 block text-gray-700"
              >
                Include Purchase Information
              </label>
            </div>

            {includePurchaseInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="purchaseInfo.date"
                      value={formData.purchaseInfo.date}
                      onChange={handleChange}
                      className={`w-full p-2 border rounded-lg ${
                        getFieldError("purchaseInfo.date")
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                    <FiCalendar className="absolute right-3 top-3 text-gray-400" />
                  </div>
                  {getFieldError("purchaseInfo.date") && (
                    <p className="mt-1 text-red-500 text-sm">
                      {getFieldError("purchaseInfo.date")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Cost
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="purchaseInfo.cost"
                      value={formData.purchaseInfo.cost}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full p-2 pl-8 border rounded-lg ${
                        getFieldError("purchaseInfo.cost")
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                    <FiDollarSign className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  {getFieldError("purchaseInfo.cost") && (
                    <p className="mt-1 text-red-500 text-sm">
                      {getFieldError("purchaseInfo.cost")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    name="purchaseInfo.source"
                    value={formData.purchaseInfo.source}
                    onChange={handleChange}
                    placeholder="e.g., Farm name, auction, etc."
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCattle; 