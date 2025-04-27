import { useState, useEffect } from "react";
import { FaTemperatureHigh, FaWeightHanging } from "react-icons/fa";
import { MdOutlineHealing, MdOutlinePets } from "react-icons/md";
import { BsGenderAmbiguous, BsClock, BsInfoCircle } from "react-icons/bs";
import useCattleStore from "../../../store/cattleStore";
import { differenceInYears, differenceInMonths, differenceInDays } from "date-fns";
import { toast } from "react-hot-toast";

// Common cattle symptoms list
const COMMON_SYMPTOMS = [
  "Reduced appetite",
  "Fever",
  "Lethargy",
  "Weight loss",
  "Coughing",
  "Nasal discharge",
  "Diarrhea",
  "Lameness",
  "Abnormal breathing",
  "Bloating",
  "Excessive salivation",
  "Skin lesions",
  "Eye discharge",
];

const PredictionForm = ({ onSubmit }) => {
  // State from cattle store
  const { fetchCattle, getBreedOptions, cattle } = useCattleStore();
  const [breedOptions, setBreedOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Symptoms state
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [otherSymptom, setOtherSymptom] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    cattleId: "",
    symptoms: [],
    age: "",
    ageUnit: "years", // years, months, days
    breed: "",
    gender: "female",
    temperature: "",
    duration: "",
    additional: "",
  });
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  // Fetch cattle data and breed options on component mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchCattle();
      const options = getBreedOptions();
      setBreedOptions(options);
      setIsLoading(false);
    };
    
    initializeData();
  }, [fetchCattle, getBreedOptions]);
  
  // Update form data when selected symptoms change
  useEffect(() => {
    let symptomsList = [...selectedSymptoms];
    
    // Add other symptom if it exists
    if (otherSymptom.trim()) {
      symptomsList.push(otherSymptom.trim());
    }
    
    setFormData(prev => ({
      ...prev,
      symptoms: symptomsList
    }));
    
    // Clear validation error if symptoms are selected
    if (symptomsList.length > 0 && validationErrors.symptoms) {
      setValidationErrors(prev => ({
        ...prev,
        symptoms: ""
      }));
    }
  }, [selectedSymptoms, otherSymptom, validationErrors.symptoms]);
  
  // Calculate age based on date of birth with appropriate units
  const calculateAge = (dateOfBirth) => {
    try {
      const birthDate = new Date(dateOfBirth);
      const now = new Date();
      
      // Calculate years first
      const years = differenceInYears(now, birthDate);
      
      // If age is zero years, calculate months
      if (years === 0) {
        const months = differenceInMonths(now, birthDate);
        
        // If less than a month old, calculate days
        if (months === 0) {
          const days = differenceInDays(now, birthDate);
          return {
            value: days.toString(),
            unit: "days"
          };
        }
        
        return {
          value: months.toString(),
          unit: "months"
        };
      }
      
      return {
        value: years.toString(),
        unit: "years"
      };
    } catch (error) {
      console.error("Error calculating age:", error);
      return {
        value: "",
        unit: "years"
      };
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing cattle selection, populate form with cattle data
    if (name === "cattleId" && value) {
      const selectedCattle = cattle.find(c => c._id === value);
      if (selectedCattle) {
        // Calculate age from date of birth
        let ageData = { value: "", unit: "years" };
        if (selectedCattle.dateOfBirth) {
          ageData = calculateAge(selectedCattle.dateOfBirth);
        }
        
        // Get the breed value, handling both string and object formats
        let breedValue = selectedCattle.breed || "";
        // If breed is an object with value property, use that value
        if (typeof breedValue === 'object' && breedValue?.value) {
          breedValue = breedValue.value;
        }
        
        setFormData(prev => ({
          ...prev,
          cattleId: value,
          breed: breedValue,
          gender: selectedCattle.gender || "female",
          age: ageData.value,
          ageUnit: ageData.unit,
          // Keep these fields as-is since they are specific to this health event
          temperature: prev.temperature,
          duration: prev.duration,
          additional: prev.additional
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  
  // Handle symptom checkbox changes
  const handleSymptomChange = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };
  
  // Validate the form before submission
  const validateForm = () => {
    const errors = {};
    
    // Check if symptoms are selected (either from checkboxes or "other" input)
    const hasSymptoms = selectedSymptoms.length > 0 || otherSymptom.trim() !== '';
    if (!hasSymptoms) {
      errors.symptoms = 'At least one symptom is required';
    }
    
    // Make cattle selection mandatory
    if (!formData.cattleId) {
      errors.cattleId = 'Selecting a cattle is required';
    }
    
    // Check other required fields
    if (!formData.breed) errors.breed = 'Breed is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    
    // Detailed age validation
    if (!formData.age) {
      errors.age = 'Age is required';
    } else if (isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      errors.age = 'Age must be a positive number';
    }
    
    if (!formData.temperature) errors.temperature = 'Temperature is required';
    if (!formData.duration) errors.duration = 'Duration is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Format symptoms as a comma-separated string
    const processedSymptoms = formData.symptoms.join(', ');
    
    // Prepare submission data with properly formatted fields
    const submissionData = {
      ...formData,
      symptoms: processedSymptoms,
      age: Number(formData.age), // Ensure age is a number
      ageUnit: formData.ageUnit, // Keep ageUnit separate for the server to use
      temperature: Number(formData.temperature)
    };
    
    onSubmit(submissionData);
  };
  
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
          <div className="text-gray-500">Loading cattle data...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <form onSubmit={handleSubmit} className="p-5">
        {/* Form Header */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h2 className="text-xl font-semibold text-green-800">Symptom Entry Form</h2>
          <p className="text-sm text-gray-600 mt-1">Fill in the details to get an AI-powered diagnosis</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {/* Select Cattle Field */}
          <div className="bg-green-50 p-6 rounded-md border border-green-100">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="cattleId">
              <div className="flex items-center">
                <MdOutlinePets className="mr-2 text-green-600" />
                Select Cattle <span className="text-red-500 ml-1">*</span>
              </div>
            </label>
            
            {cattle.filter(c => c.status === "active").length > 0 ? (
              <>
                <select
                  id="cattleId"
                  name="cattleId"
                  value={formData.cattleId}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 ${
                    validationErrors.cattleId ? "border-red-300 ring-1 ring-red-300" : ""
                  }`}
                >
                  <option value="">Select a cattle</option>
                  {cattle
                    .filter(c => c.status === "active") // Only show active cattle
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} - {c.tagId} ({c.breed})
                      </option>
                    ))}
                </select>
                {validationErrors.cattleId && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.cattleId}</p>
                )}
                <p className="mt-2 text-xs text-gray-600 flex items-start">
                  <BsInfoCircle className="mr-1 mt-0.5 flex-shrink-0" />
                  <span>Selecting a cattle will auto-fill some details below. You can still modify them if needed.</span>
                </p>
              </>
            ) : (
              <div className="text-sm text-gray-600 italic">
                No active cattle found. Please add a cattle record before proceeding.
              </div>
            )}
          </div>
          
          {/* Symptoms Checkboxes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center">
                <MdOutlineHealing className="mr-2 text-red-500" />
                Symptoms <span className="text-red-500 ml-1">*</span>
              </div>
            </label>
            
            <div className={`border rounded-md ${validationErrors.symptoms ? "border-red-300 ring-1 ring-red-300" : "border-gray-300"} p-4`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-start">
                    <input
                      id={`symptom-${symptom}`}
                      type="checkbox"
                      className="h-4 w-4 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => handleSymptomChange(symptom)}
                    />
                    <label htmlFor={`symptom-${symptom}`} className="ml-2 block text-sm text-gray-700">
                      {symptom}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Other symptoms input */}
              <div className="mt-4 border-t border-gray-200 pt-3">
                <label htmlFor="otherSymptom" className="block text-sm font-medium text-gray-700 mb-2">
                  Other symptoms (if not listed above)
                </label>
                <input
                  type="text"
                  id="otherSymptom"
                  value={otherSymptom}
                  onChange={(e) => setOtherSymptom(e.target.value)}
                  placeholder="Enter additional symptoms separated by commas"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3"
                />
              </div>
              
              {validationErrors.symptoms && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.symptoms}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Select all applicable symptoms. Be as specific as possible for better results.
              </p>
            </div>
          </div>
          
          {/* Basic Information Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Age Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="age">
                <div className="flex items-center">
                  <FaWeightHanging className="mr-2 text-blue-500" />
                  Age <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <div className="flex rounded-md">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`block w-full rounded-l-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 ${
                    validationErrors.age ? "border-red-300 ring-1 ring-red-300" : ""
                  }`}
                  placeholder="Enter age"
                />
                <select
                  id="ageUnit"
                  name="ageUnit"
                  value={formData.ageUnit}
                  onChange={handleChange}
                  className="rounded-r-md border-l-0 border-gray-300 bg-gray-50 py-2 text-gray-500 sm:text-sm px-3"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                  <option value="days">Days</option>
                </select>
              </div>
              {validationErrors.age && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.age}</p>
              )}
            </div>
            
            {/* Breed Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="breed">
                <div className="flex items-center">
                  <MdOutlinePets className="mr-2 text-green-600" />
                  Breed <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <select
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 ${
                  validationErrors.breed ? "border-red-300 ring-1 ring-red-300" : ""
                }`}
              >
                <option value="">Select breed</option>
                {breedOptions.map((option) => (
                  <option key={typeof option === 'object' ? option.value : option} value={typeof option === 'object' ? option.value : option}>
                    {typeof option === 'object' ? option.label : option}
                  </option>
                ))}
              </select>
              {validationErrors.breed && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.breed}</p>
              )}
            </div>
            
            {/* Gender Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="gender">
                <div className="flex items-center">
                  <BsGenderAmbiguous className="mr-2 text-purple-500" />
                  Gender <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    id="gender-female"
                    name="gender"
                    type="radio"
                    value="female"
                    checked={formData.gender === "female"}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="gender-female" className="ml-2 block text-sm text-gray-700">
                    Female
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="gender-male"
                    name="gender"
                    type="radio"
                    value="male"
                    checked={formData.gender === "male"}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="gender-male" className="ml-2 block text-sm text-gray-700">
                    Male
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Information Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Temperature Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="temperature">
                <div className="flex items-center">
                  <FaTemperatureHigh className="mr-2 text-red-500" />
                  Temperature (°F) <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <input
                type="number"
                step="0.1"
                id="temperature"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 ${
                  validationErrors.temperature ? "border-red-300 ring-1 ring-red-300" : ""
                }`}
                placeholder="Enter body temperature"
              />
              {validationErrors.temperature ? (
                <p className="mt-2 text-sm text-red-600">{validationErrors.temperature}</p>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Normal cattle temperature: 101-102.5°F</p>
              )}
            </div>
            
            {/* Duration Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="duration">
                <div className="flex items-center">
                  <BsClock className="mr-2 text-amber-500" />
                  Symptom Duration <span className="text-red-500 ml-1">*</span>
                </div>
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3 ${
                  validationErrors.duration ? "border-red-300 ring-1 ring-red-300" : ""
                }`}
                placeholder="How long have you observed these symptoms? (e.g., 2 days, 1 week)"
              />
              {validationErrors.duration && (
                <p className="mt-2 text-sm text-red-600">{validationErrors.duration}</p>
              )}
            </div>
          </div>
          
          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="additional">
              <div className="flex items-center">
                <BsInfoCircle className="mr-2 text-blue-500" />
                Additional Notes (Optional)
              </div>
            </label>
            <textarea
              id="additional"
              name="additional"
              rows="3"
              value={formData.additional}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2.5 px-3"
              placeholder="Any additional details that might be relevant (e.g., recent changes in environment, feed, or behavior)"
            ></textarea>
          </div>
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-md hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all font-medium flex items-center justify-center"
            >
              <MdOutlineHealing className="mr-2 h-5 w-5" />
              <span>Generate Prediction</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm; 