/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import {
  FiLoader,
  FiAlertCircle,
  FiChevronRight,
  FiChevronLeft,
  FiCheckCircle,
  FiDollarSign,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import useCattleStore from "../../../../store/cattleStore";

const AddCattleModal = ({ onClose, onAdd, healthOptions, breedOptions }) => {
  const [step, setStep] = useState(1);
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [includePurchaseInfo, setIncludePurchaseInfo] = useState(false);
  const { validationErrors, clearValidationErrors } = useCattleStore();

  // Clear validation errors when modal is opened
  useEffect(() => {
    clearValidationErrors?.();
  }, [clearValidationErrors]);

  // Reset purchase info fields when toggling off
  useEffect(() => {
    if (!includePurchaseInfo) {
      setFormData((prev) => ({
        ...prev,
        purchaseInfo: {
          date: "",
          cost: "",
          source: "",
        },
      }));
    }
  }, [includePurchaseInfo]);

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

  // Prevent form submission on Enter key
  const preventFormSubmission = (e) => {
    if (e.key === "Enter" && step !== 3) {
      e.preventDefault();

      // If everything is valid in current step, move to next step
      if (step === 1 && isStep1Valid()) {
        nextStep(e);
      } else if (step === 2 && isStep2Valid()) {
        nextStep(e);
      }
    }
  };

  // Update the nextStep function to prevent form submission
  const nextStep = (e) => {
    if (e) e.preventDefault(); // Prevent form submission
    setStep(step + 1);
  };

  // Make sure prevStep doesn't trigger form submission
  const prevStep = (e) => {
    if (e) e.preventDefault();
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only process submission if on step 3
    if (step !== 3) {
      // If on step 1 or 2, move to next step instead of submitting
      if ((step === 1 && isStep1Valid()) || (step === 2 && isStep2Valid())) {
        nextStep(e);
        return;
      }
      return;
    }

    setError(null);
    clearValidationErrors?.();

    // Perform client-side validation first
    const validationErrors = {};

    // Required fields
    if (!formData.tagId) validationErrors.tagId = "Tag ID is required";
    if (!formData.name) validationErrors.name = "Name is required";
    if (!formData.dateOfBirth)
      validationErrors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) validationErrors.gender = "Gender is required";
    if (!formData.breed) validationErrors.breed = "Breed is required";

    // Purchase info validation (only if includePurchaseInfo is true)
    if (includePurchaseInfo) {
      if (formData.purchaseInfo.cost && isNaN(Number(formData.purchaseInfo.cost))) {
        validationErrors["purchaseInfo.cost"] = "Cost must be a valid number";
      }
    }

    // If there are validation errors, display them and don't proceed
    if (Object.keys(validationErrors).length > 0) {
      // Determine which step to show based on validation errors
      if (
        validationErrors.tagId ||
        validationErrors.name ||
        validationErrors.dateOfBirth ||
        validationErrors.gender
      ) {
        setStep(1);
      } else if (validationErrors.breed) {
        setStep(2);
      }

      setError("Please fix the validation errors");
      // Set the validation errors in the store
      if (typeof clearValidationErrors === "function") {
        // This assumes there's a setValidationErrors function in the store
        useCattleStore.getState().setValidationErrors(validationErrors);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data, conditionally including purchase info
      const preparedData = {
        ...formData,
      };

      // Only include purchaseInfo if the toggle is on and at least one field is filled
      if (includePurchaseInfo && (
        formData.purchaseInfo.date ||
        formData.purchaseInfo.cost ||
        formData.purchaseInfo.source
      )) {
        preparedData.purchaseInfo = {
          date: formData.purchaseInfo.date || undefined,
          cost: formData.purchaseInfo.cost ? Number(formData.purchaseInfo.cost) : undefined,
          source: formData.purchaseInfo.source || undefined
        };
      } else {
        delete preparedData.purchaseInfo;
      }

      const result = await onAdd(preparedData);
      if (result?.success === false) {
        if (result.errors) {
          setError("Please fix the validation errors");
          // If we have errors in a previous step, go back to that step
          if (
            result.errors.tagId ||
            result.errors.name ||
            result.errors.dateOfBirth ||
            result.errors.gender
          ) {
            setStep(1);
          } else if (
            result.errors.breed ||
            result.errors["healthStatus.status"]
          ) {
            setStep(2);
          } else if (result.errors.purchaseInfo) {
            setStep(3);
          }
        } else {
          setError(result.error || "Failed to add cattle");
        }
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to add cattle");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Field error helper with improved nested field handling
  const getFieldError = (field) => {
    if (!validationErrors) return null;

    // Handle nested fields like purchaseInfo.cost
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      return (
        validationErrors[field] ||
        (validationErrors[parent] && validationErrors[parent][child])
      );
    }

    return validationErrors[field];
  };

  // Format health status options
  const formattedHealthOptions =
    healthOptions?.map((option) => ({
      ...option,
      label: option.value.charAt(0).toUpperCase() + option.value.slice(1),
    })) || [];

  // Check if step 1 is valid
  const isStep1Valid = () => {
    return (
      formData.tagId && formData.name && formData.dateOfBirth && formData.gender
    );
  };

  // Check if step 2 is valid
  const isStep2Valid = () => {
    return formData.breed && formData.healthStatus.status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden">
        {/* Custom Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Register New Cattle</h2>
              <p className="text-green-50 mt-1 text-sm">
                {step === 1
                  ? "Basic Information"
                  : step === 2
                  ? "Breed & Health"
                  : "Purchase Details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white hover:text-green-200 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-8 pt-6">
          <div className="flex items-center mb-6">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center ${
                step >= 1
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div
              className={`h-1 flex-1 mx-2 ${
                step >= 2 ? "bg-green-500" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center ${
                step >= 2
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <div
              className={`h-1 flex-1 mx-2 ${
                step >= 3 ? "bg-green-500" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center ${
                step >= 3
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              3
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center border border-red-200">
              <FiAlertCircle className="mr-2 flex-shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={preventFormSubmission}
          className="px-8 py-6"
        >
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📋</span> Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag ID*
                  </label>
                  <input
                    type="text"
                    name="tagId"
                    required
                    className={`w-full px-4 py-2.5 border ${
                      getFieldError("tagId")
                        ? "border-red-300 ring-1 ring-red-300"
                        : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                    value={formData.tagId}
                    onChange={handleChange}
                    placeholder="e.g. TAG001"
                  />
                  {getFieldError("tagId") && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError("tagId")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className={`w-full px-4 py-2.5 border ${
                      getFieldError("name")
                        ? "border-red-300 ring-1 ring-red-300"
                        : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Buttercup"
                  />
                  {getFieldError("name") && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError("name")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth*
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    className={`w-full px-4 py-2.5 border ${
                      getFieldError("dateOfBirth")
                        ? "border-red-300 ring-1 ring-red-300"
                        : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                  {getFieldError("dateOfBirth") && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError("dateOfBirth")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender*
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`cursor-pointer rounded-lg border px-4 py-3 ${
                        formData.gender === "female"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, gender: "female" })
                      }
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === "female"}
                          onChange={handleChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Female
                        </label>
                      </div>
                    </div>
                    <div
                      className={`cursor-pointer rounded-lg border px-4 py-3 ${
                        formData.gender === "male"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, gender: "male" })
                      }
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === "male"}
                          onChange={handleChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Male
                        </label>
                      </div>
                    </div>
                  </div>
                  {getFieldError("gender") && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError("gender")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Breed and Health Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🐄</span> Breed & Health Information
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breed*
                  </label>
                  <select
                    name="breed"
                    required
                    className={`w-full px-4 py-2.5 border ${
                      getFieldError("breed")
                        ? "border-red-300 ring-1 ring-red-300"
                        : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                    value={formData.breed}
                    onChange={handleChange}
                  >
                    <option value="">Select Breed</option>
                    {breedOptions && breedOptions.length > 0 ? (
                      breedOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Holstein">Holstein</option>
                        <option value="Jersey">Jersey</option>
                        <option value="Brown Swiss">Brown Swiss</option>
                        <option value="Ayrshire">Ayrshire</option>
                        <option value="Guernsey">Guernsey</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                  {getFieldError("breed") && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError("breed")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Health Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formattedHealthOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`cursor-pointer rounded-lg border px-4 py-3 text-center 
                          ${
                            formData.healthStatus.status === option.value
                              ? "border-green-500 bg-green-50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            healthStatus: {
                              ...formData.healthStatus,
                              status: option.value,
                            },
                          })
                        }
                      >
                        <div className="font-medium text-sm">
                          {option.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  {getFieldError("healthStatus.status") && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError("healthStatus.status")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Purchase Information */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">💰</span> Purchase Information
              </h3>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includePurchaseInfo"
                    checked={includePurchaseInfo}
                    onChange={() =>
                      setIncludePurchaseInfo(!includePurchaseInfo)
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="includePurchaseInfo"
                    className="ml-2 block text-sm text-blue-700"
                  >
                    Include purchase information for this cattle
                  </label>
                </div>
              </div>

              {includePurchaseInfo ? (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FiCalendar
                          className="mr-1.5 text-gray-500"
                          size={14}
                        />
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        name="purchaseInfo.date"
                        className={`w-full px-4 py-2.5 border ${
                          getFieldError("purchaseInfo.date")
                            ? "border-red-300 ring-1 ring-red-300"
                            : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                        value={formData.purchaseInfo.date}
                        onChange={handleChange}
                      />
                      {getFieldError("purchaseInfo.date") && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError("purchaseInfo.date")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FiDollarSign
                          className="mr-1.5 text-gray-500"
                          size={14}
                        />
                        Cost
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          name="purchaseInfo.cost"
                          step="0.01"
                          min="0"
                          className={`w-full pl-8 pr-4 py-2.5 border ${
                            getFieldError("purchaseInfo.cost")
                              ? "border-red-300 ring-1 ring-red-300"
                              : "border-gray-300"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                          value={formData.purchaseInfo.cost}
                          onChange={(e) => {
                            // Improved number handling
                            const val = e.target.value;
                            if (val === "" || !isNaN(Number(val))) {
                              handleChange({
                                target: {
                                  name: "purchaseInfo.cost",
                                  value: val,
                                },
                              });
                            }
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      {getFieldError("purchaseInfo.cost") && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError("purchaseInfo.cost")}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FiUsers className="mr-1.5 text-gray-500" size={14} />
                        Source
                      </label>
                      <input
                        type="text"
                        name="purchaseInfo.source"
                        className={`w-full px-4 py-2.5 border ${
                          getFieldError("purchaseInfo.source")
                            ? "border-red-300 ring-1 ring-red-300"
                            : "border-gray-300"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                        value={formData.purchaseInfo.source}
                        onChange={handleChange}
                        placeholder="e.g. Local Farmer, Auction, Farm Market"
                      />
                      {getFieldError("purchaseInfo.source") && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError("purchaseInfo.source")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <div className="text-gray-400 mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    No purchase information provided
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Check the box above to add purchase details
                  </p>
                </div>
              )}

              <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-8 flex">
                <div className="mr-4 flex-shrink-0">
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-sm text-green-700">
                  <p>
                    You're about to register a new {formData.gender}{" "}
                    {formData.breed} cattle named{" "}
                    <strong>{formData.name}</strong> with tag ID{" "}
                    <strong>{formData.tagId}</strong>.
                    {includePurchaseInfo && formData.purchaseInfo.cost && (
                      <span>
                        {" "}
                        Purchase cost:{" "}
                        <strong>
                          ${Number(formData.purchaseInfo.cost).toFixed(2)}
                        </strong>
                        .
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                type="button" // Explicitly set type to button
                onClick={(e) => prevStep(e)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center gap-2"
              >
                <FiChevronLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button" // Explicitly set type to button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button" // Explicitly set type to button
                onClick={(e) => nextStep(e)}
                className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  (step === 1 && isStep1Valid()) ||
                  (step === 2 && isStep2Valid())
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={
                  (step === 1 && !isStep1Valid()) ||
                  (step === 2 && !isStep2Valid())
                }
              >
                <span>Next</span>
                <FiChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit" // This is the only true submit button
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Cattle</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCattleModal;
