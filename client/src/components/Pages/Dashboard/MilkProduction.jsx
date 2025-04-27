import { useState, useEffect } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";
import { FaExchangeAlt, FaCalculator } from "react-icons/fa";
import useMilkProductionStore from "../../../store/milkProductionStore";
import useCattleStore from "../../../store/cattleStore";
import useMPPStore from "../../../store/mppStore";
import useAuthStore from "../../../store/authStore";

/**
 * Milk Production component for managing cattle milk production records
 * @param {Object} props
 * @param {boolean} [props.embedded] - Whether the component is embedded in another component
 */
// eslint-disable-next-line react/prop-types
const MilkProduction = ({ embedded = false }) => {
  // Initialize stores
  const {
    milkProductions,
    stats,
    dailySummary,
    monthlySummary,
    isLoading: storeLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    fetchMilkProductions,
    getStats,
    getDailySummary,
    getMonthlySummary,
    createMilkProduction,
    updateMilkProduction,
    deleteMilkProduction,
    clearErrors,
  } = useMilkProductionStore();

  // Get cattle data for dropdown
  const { cattle, fetchCattle } = useCattleStore();

  // Get MPP functionality
  const {
    createMilkCollection,
    fetchAvailableValues,
    fetchMilkCollections: fetchProcurementRecords,
    fetchRate,
  } = useMPPStore();

  // Get user info for farmer ID
  const { user } = useAuthStore();

  // State for available fat/snf values
  const [availableFatSnf, setAvailableFatSnf] = useState({ fat: [], snf: [] });
  const [milkRateData, setMilkRateData] = useState({
    fat: "",
    snf: "",
    quantity: "",
    currentRate: 0,
  });
  const [showMilkRateHelper, setShowMilkRateHelper] = useState(false);

  // Component state
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cattleId: "",
    date: new Date(),
    morningAmount: "",
    eveningAmount: "",
    notes: "",
    shift: "morning",
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState(null);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [sendToProcurement, setSendToProcurement] = useState(false);
  const [sentToProcurement, setSentToProcurement] = useState({});
  const [procurementData, setProcurementData] = useState({
    milkType: "C",
    fat: "",
    snf: "",
  });

  // Add local loading state that we can control directly
  // Fetch data on component mount
  useEffect(() => {
    fetchMilkProductions();
    getStats();
    getDailySummary();
    getMonthlySummary();
    fetchCattle();

    // Fetch available FAT/SNF values for procurement
    const loadFatSnfValues = async () => {
      try {
        const values = await fetchAvailableValues();
        setAvailableFatSnf(values);

        // Set default values if available
        if (values.fat.length > 0 && values.snf.length > 0) {
          setProcurementData((prev) => ({
            ...prev,
            fat: values.fat[0],
            snf: values.snf[0],
          }));
        }
      } catch (error) {
        console.error("Failed to fetch FAT/SNF values:", error);
      }
    };

    // Check which production records have been sent to procurement
    const checkProcurementStatus = async () => {
      try {
        // Get all procurement records
        const procurementRecords = await fetchProcurementRecords();

        // Create a map of dates to detect which milk production records have matching procurement records
        const dateMap = {};
        procurementRecords.forEach((record) => {
          const date = record.collectionDate.split("T")[0];
          if (!dateMap[date]) {
            dateMap[date] = [];
          }
          dateMap[date].push(record);
        });

        // Get milk production records
        const productionRecords = await fetchMilkProductions();

        // Check which production records have matching procurement records
        const sentStatus = {};
        productionRecords.forEach((record) => {
          const prodDate = new Date(record.date).toISOString().split("T")[0];
          const totalAmount =
            (record.morningAmount || 0) + (record.eveningAmount || 0);

          // Mark as sent if there's a procurement record with matching date and similar quantity
          if (dateMap[prodDate]) {
            const matchingRecord = dateMap[prodDate].find((proc) => {
              // Consider it a match if quantity is within 0.5L
              return Math.abs(proc.quantity - totalAmount) < 0.5;
            });

            if (matchingRecord) {
              sentStatus[record._id] = true;
            }
          }
        });

        setSentToProcurement(sentStatus);
      } catch (error) {
        console.error("Failed to check procurement status:", error);
      }
    };

    loadFatSnfValues();
    checkProcurementStatus();
  }, [
    fetchMilkProductions,
    getStats,
    getDailySummary,
    getMonthlySummary,
    fetchCattle,
    fetchAvailableValues,
    fetchProcurementRecords,
  ]);

  // Load fat/snf values
  useEffect(() => {
    const loadFatSnfValues = async () => {
      try {
        const values = await fetchAvailableValues();
        setAvailableFatSnf(values);
        if (values.fat.length > 0 && values.snf.length > 0) {
          setMilkRateData(prev => ({
            ...prev,
            fat: values.fat[0],
            snf: values.snf[0],
          }));
        }
      } catch (error) {
        console.error("Failed to fetch FAT/SNF values:", error);
      }
    };
    loadFatSnfValues();
  }, [fetchAvailableValues]);
  
  // Update rate when fat/snf changes
  useEffect(() => {
    const updateMilkRate = async () => {
      if (milkRateData.fat && milkRateData.snf) {
        try {
          const rate = await fetchRate(milkRateData.fat, milkRateData.snf);
          setMilkRateData(prev => ({
            ...prev,
            currentRate: rate || 0
          }));
        } catch (error) {
          console.error("Error fetching milk rate:", error);
        }
      }
    };
    updateMilkRate();
  }, [milkRateData.fat, milkRateData.snf, fetchRate]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearErrors();
    }
  }, [error]);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    // Only allow numeric values
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({
        ...formData,
        [name]: value === "" ? "" : parseFloat(value),
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, date });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ [name]: value });
  };

  const handleFilterDateChange = (name, date) => {
    setFilters({ [name]: date ? format(date, "yyyy-MM-dd") : "" });
  };

  const resetForm = () => {
    setFormData({
      cattleId: "",
      date: new Date(),
      morningAmount: "",
      eveningAmount: "",
      notes: "",
      shift: "morning",
    });
    setEditMode(false);
    setEditId(null);
    setProcurementData({
      milkType: "C",
      fat: "",
      snf: "",
    });
    setSendToProcurement(false);
  };

  const handleEdit = (record) => {
    setFormData({
      cattleId: record.cattleId,
      date: new Date(record.date),
      shift: record.shift,
      morningAmount: record.morningAmount || "",
      eveningAmount: record.eveningAmount || "",
      notes: record.notes || "",
    });
    setEditMode(true);
    setEditId(record._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const result = await deleteMilkProduction(id);
      if (result.success) {
        toast.success("Milk production record deleted successfully!");
        fetchMilkProductions();
        getStats();
        getDailySummary();
        getMonthlySummary();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.cattleId) {
        toast.error("Please select a cattle");
        setIsSubmitting(false);
        return;
      }

      if (formData.shift === "morning" && !formData.morningAmount) {
        toast.error("Please enter the morning milk amount");
        setIsSubmitting(false);
        return;
      }

      if (formData.shift === "evening" && !formData.eveningAmount) {
        toast.error("Please enter the evening milk amount");
        setIsSubmitting(false);
        return;
      }

      // Format date to ISO string
      const formattedDate = formData.date.toISOString().split("T")[0];

      // Prepare record data
      const recordData = {
        cattleId: formData.cattleId,
        date: formattedDate,
        shift: formData.shift,
        notes: formData.notes,
      };

      // Set the appropriate amount based on the selected shift
      if (formData.shift === "morning") {
        recordData.morningAmount = parseFloat(formData.morningAmount) || 0;
        recordData.eveningAmount = 0;
      } else if (formData.shift === "evening") {
        recordData.eveningAmount = parseFloat(formData.eveningAmount) || 0;
        recordData.morningAmount = 0;
      } else {
        recordData.morningAmount = parseFloat(formData.morningAmount) || 0;
        recordData.eveningAmount = parseFloat(formData.eveningAmount) || 0;
      }

      let result;

      if (editMode) {
        result = await updateMilkProduction(editId, recordData);

        if (result.success) {
          toast.success("Milk production record updated successfully!");
        }
      } else {
        result = await createMilkProduction(recordData);

        if (result.success) {
          toast.success(
            result.updated
              ? `Updated milk production record with ${formData.shift} shift data`
              : "Milk production record added successfully!"
          );
        }
      }

      if (result.success) {
        if (sendToProcurement) {
          try {
            const amount = recordData.morningAmount + recordData.eveningAmount;

            if (amount <= 0) {
              toast.error(
                "Milk quantity must be greater than 0 to create procurement record"
              );
              return;
            }

            const mppData = {
              farmerId: parseInt(user?.id || "1001"),
              collectionDate: formattedDate,
              shift: formData.shift,
              milkType: procurementData.milkType,
              fat: parseFloat(procurementData.fat),
              snf: parseFloat(procurementData.snf),
              quantity: amount,
            };

            const mppResult = await createMilkCollection(mppData);

            if (mppResult.success) {
              toast.success("Milk procurement record created automatically!");

              const recordId = result.data?._id;
              if (recordId) {
                setSentToProcurement((prev) => ({
                  ...prev,
                  [recordId]: true,
                }));
              }
            } else {
              toast.error("Failed to create procurement record");
            }
          } catch (error) {
            console.error("Error creating procurement record:", error);
            toast.error("Failed to create procurement record");
          }
        }

        resetForm();
        setShowForm(false);
        fetchMilkProductions();
        getStats();
        getDailySummary();
        getMonthlySummary();
      } else if (result.errors) {
        Object.values(result.errors).forEach((error) => {
          toast.error(error);
        });
      }
    } catch (error) {
      console.error("Error saving milk production record:", error);
      toast.error("Failed to save milk production record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = (record) => {
    const morning = parseFloat(record.morningAmount) || 0;
    const evening = parseFloat(record.eveningAmount) || 0;
    return morning + evening;
  };

  // Calculate weekly average production for a specific cattle
  const calculateWeeklyAverage = (cattleId) => {
    if (!milkProductions || milkProductions.length === 0) return "0.00";

    // Get recent records for this cattle
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const records = milkProductions.filter(
      (record) =>
        record.cattleId === cattleId && new Date(record.date) >= oneWeekAgo
    );

    if (records.length === 0) return "0.00";

    // Group by day to avoid counting multiple records per day
    const productionByDay = {};

    records.forEach((record) => {
      const dateKey = record.date.split("T")[0];

      if (!productionByDay[dateKey]) {
        productionByDay[dateKey] = 0;
      }

      productionByDay[dateKey] += calculateTotal(record);
    });

    // Calculate average
    const total = Object.values(productionByDay).reduce(
      (sum, val) => sum + val,
      0
    );
    const daysWithData = Object.keys(productionByDay).length;

    return daysWithData > 0 ? (total / daysWithData).toFixed(2) : "0.00";
  };

  // Format data for charts
  const getDailyTotals = () => {
    const dailyTotals = {};

    milkProductions.forEach((record) => {
      const dateKey = record.date.split("T")[0];
      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = 0;
      }
      dailyTotals[dateKey] += calculateTotal(record);
    });

    // Convert to array and sort by date
    return Object.entries(dailyTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Get last 7 days
  };

  const chartData = getDailyTotals();

  const handleViewNotes = (notes) => {
    setSelectedNotes(notes);
    setShowNotesPopup(true);
  };

  const closeNotesPopup = () => {
    setShowNotesPopup(false);
    setSelectedNotes(null);
  };

  const calculateMilkSaleAmount = () => {
    if (!milkRateData.quantity || !milkRateData.currentRate) return 0;
    const quantity = parseFloat(milkRateData.quantity);
    const rate = parseFloat(milkRateData.currentRate);
    if (isNaN(quantity) || isNaN(rate)) return 0;
    return (quantity * rate).toFixed(2);
  };
  
  const applyMilkRateToForm = () => {
    const calculatedAmount = calculateMilkSaleAmount();
    if (calculatedAmount <= 0) {
      toast.error("Please ensure quantity and rate are valid values");
      return;
    }
    setFormData({
      ...formData,
      category: "Milk Sales",
      amount: calculatedAmount,
      description: `Milk sale - ${milkRateData.quantity}L @ ₹${milkRateData.currentRate}/L (FAT: ${milkRateData.fat}%, SNF: ${milkRateData.snf}%)`,
    });
    setShowMilkRateHelper(false);
    toast.success(`Milk sale amount calculated: ₹${calculatedAmount}`);
  };

  // Render loading state
  if (storeLoading && !milkProductions.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading milk production data...</span>
      </div>
    );
  }

  return (
    <div className={`${embedded ? "embedded-container" : "p-4"}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Milk Production</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1 px-4 py-2 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="flex items-center gap-1 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Record
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Milk Production Statistics
          </h2>
          {storeLoading ? (
            <p>Loading statistics...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall Statistics Card */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 text-sm">
                      Overall Statistics
                    </h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {(() => {
                        // Calculate total production directly from records when stats might be missing
                        if (
                          !stats ||
                          typeof stats.totalProduction !== "number"
                        ) {
                          const total = milkProductions.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );
                          return total.toFixed(2);
                        }
                        return stats.totalProduction.toFixed(2);
                      })()}{" "}
                      L
                    </p>
                    <p className="text-sm text-gray-500">
                      Total from{" "}
                      {(() => {
                        if (!stats || typeof stats.totalRecords !== "number") {
                          return milkProductions.length;
                        }
                        return stats.totalRecords;
                      })()}{" "}
                      records
                    </p>
                  </div>
                </div>
                {/* Additional calculations */}
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Average Per Record:</span>
                    <span className="font-medium">
                      {(() => {
                        let total = 0;
                        let recordCount = 0;

                        if (
                          stats &&
                          typeof stats.totalProduction === "number"
                        ) {
                          total = stats.totalProduction;
                        } else {
                          total = milkProductions.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );
                        }

                        if (stats && typeof stats.totalRecords === "number") {
                          recordCount = stats.totalRecords;
                        } else {
                          recordCount = milkProductions.length;
                        }

                        return recordCount > 0
                          ? (total / recordCount).toFixed(2)
                          : "0.00";
                      })()}{" "}
                      L
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Records Per Day:</span>
                    <span className="font-medium">
                      {(() => {
                        if (stats && typeof stats.recordsPerDay === "number") {
                          return stats.recordsPerDay.toFixed(2);
                        }

                        // Calculate records per day directly
                        if (milkProductions.length === 0) return "0.00";

                        // Find the date range
                        const dates = milkProductions.map(
                          (record) => new Date(record.date)
                        );
                        const oldestDate = new Date(Math.min(...dates));
                        const newestDate = new Date(Math.max(...dates));

                        // Calculate days difference (add 1 to include both start and end date)
                        const daysDiff = Math.max(
                          1,
                          Math.ceil(
                            (newestDate - oldestDate) / (1000 * 60 * 60 * 24)
                          ) + 1
                        );

                        return (milkProductions.length / daysDiff).toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Today&apos;s Summary Card */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 text-sm">
                      Today&apos;s Summary
                    </h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {(() => {
                        // Calculate today's total directly from records when dailySummary might be missing
                        if (
                          !dailySummary ||
                          typeof dailySummary.totalToday !== "number"
                        ) {
                          const today = new Date().toISOString().split("T")[0];
                          const todayRecords = milkProductions.filter(
                            (record) => record.date.startsWith(today)
                          );
                          const total = todayRecords.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );
                          return total.toFixed(2);
                        }
                        return dailySummary.totalToday.toFixed(2);
                      })()}{" "}
                      L
                    </p>
                    <p className="text-sm text-gray-500">
                      Morning:{" "}
                      {(() => {
                        if (
                          !dailySummary ||
                          typeof dailySummary.morningTotal !== "number"
                        ) {
                          const today = new Date().toISOString().split("T")[0];
                          const todayRecords = milkProductions.filter(
                            (record) => record.date.startsWith(today)
                          );
                          const morning = todayRecords.reduce(
                            (sum, record) => sum + (record.morningAmount || 0),
                            0
                          );
                          return morning.toFixed(2);
                        }
                        return dailySummary.morningTotal.toFixed(2);
                      })()}{" "}
                      L / Evening:{" "}
                      {(() => {
                        if (
                          !dailySummary ||
                          typeof dailySummary.eveningTotal !== "number"
                        ) {
                          const today = new Date().toISOString().split("T")[0];
                          const todayRecords = milkProductions.filter(
                            (record) => record.date.startsWith(today)
                          );
                          const evening = todayRecords.reduce(
                            (sum, record) => sum + (record.eveningAmount || 0),
                            0
                          );
                          return evening.toFixed(2);
                        }
                        return dailySummary.eveningTotal.toFixed(2);
                      })()}{" "}
                      L
                    </p>
                  </div>
                </div>
                {/* Additional calculations */}
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Morning %:</span>
                    <span className="font-medium">
                      {(() => {
                        let morningTotal = 0;
                        let totalToday = 0;

                        if (
                          dailySummary &&
                          typeof dailySummary.morningTotal === "number"
                        ) {
                          morningTotal = dailySummary.morningTotal;
                        } else {
                          const today = new Date().toISOString().split("T")[0];
                          const todayRecords = milkProductions.filter(
                            (record) => record.date.startsWith(today)
                          );
                          morningTotal = todayRecords.reduce(
                            (sum, record) => sum + (record.morningAmount || 0),
                            0
                          );
                        }

                        if (
                          dailySummary &&
                          typeof dailySummary.totalToday === "number"
                        ) {
                          totalToday = dailySummary.totalToday;
                        } else {
                          const today = new Date().toISOString().split("T")[0];
                          const todayRecords = milkProductions.filter(
                            (record) => record.date.startsWith(today)
                          );
                          totalToday = todayRecords.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );
                        }

                        return totalToday > 0
                          ? ((morningTotal / totalToday) * 100).toFixed(1)
                          : "0.0";
                      })()}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Evening %:</span>
                    <span className="font-medium">
                      {(() => {
                        let eveningTotal = 0;
                        let totalToday = 0;

                        if (
                          dailySummary &&
                          typeof dailySummary.eveningTotal === "number"
                        ) {
                          eveningTotal = dailySummary.eveningTotal;
                        } else {
                          const today = new Date().toISOString().split("T")[0];
                          const todayRecords = milkProductions.filter(
                            (record) => record.date.startsWith(today)
                          );
                          eveningTotal = todayRecords.reduce(
                            (sum, record) => sum + (record.eveningAmount || 0),
                            0
                          );
                        }

                        if (
                          dailySummary &&
                          typeof dailySummary.totalToday === "number"
                        ) {
                          totalToday = dailySummary.totalToday;
                        } else {
                          const today = new Date().toISOString().split("T")[0];
                          const todayRecords = milkProductions.filter(
                            (record) => record.date.startsWith(today)
                          );
                          totalToday = todayRecords.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );
                        }

                        return totalToday > 0
                          ? ((eveningTotal / totalToday) * 100).toFixed(1)
                          : "0.0";
                      })()}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Summary Card */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800 text-sm">
                      This Month
                    </h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {(() => {
                        // Calculate this month's total directly from records when monthlySummary might be missing
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth(); // 0-11

                        if (
                          !monthlySummary ||
                          typeof monthlySummary.totalThisMonth !== "number"
                        ) {
                          const monthRecords = milkProductions.filter(
                            (record) => {
                              const recordDate = new Date(record.date);
                              return (
                                recordDate.getFullYear() === currentYear &&
                                recordDate.getMonth() === currentMonth
                              );
                            }
                          );

                          const total = monthRecords.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );
                          return total.toFixed(2);
                        }
                        return monthlySummary.totalThisMonth.toFixed(2);
                      })()}{" "}
                      L
                    </p>
                    <p className="text-sm text-gray-500">
                      Daily Avg:{" "}
                      {(() => {
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth(); // 0-11

                        if (
                          !monthlySummary ||
                          typeof monthlySummary.dailyAverage !== "number"
                        ) {
                          const monthRecords = milkProductions.filter(
                            (record) => {
                              const recordDate = new Date(record.date);
                              return (
                                recordDate.getFullYear() === currentYear &&
                                recordDate.getMonth() === currentMonth
                              );
                            }
                          );

                          // Group by day to get unique days with records
                          const productionByDay = {};
                          monthRecords.forEach((record) => {
                            const dateKey = record.date.split("T")[0];
                            if (!productionByDay[dateKey]) {
                              productionByDay[dateKey] = 0;
                            }
                            productionByDay[dateKey] +=
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0);
                          });

                          const uniqueDays =
                            Object.keys(productionByDay).length;
                          const total = monthRecords.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );

                          return uniqueDays > 0
                            ? (total / uniqueDays).toFixed(2)
                            : "0.00";
                        }
                        return monthlySummary.dailyAverage.toFixed(2);
                      })()}{" "}
                      L
                    </p>
                  </div>
                </div>
                {/* Additional calculations */}
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Projected Monthly:</span>
                    <span className="font-medium">
                      {(() => {
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth(); // 0-11
                        const daysInMonth = new Date(
                          currentYear,
                          currentMonth + 1,
                          0
                        ).getDate(); // Last day of current month

                        let dailyAverage = 0;

                        if (
                          monthlySummary &&
                          typeof monthlySummary.dailyAverage === "number"
                        ) {
                          dailyAverage = monthlySummary.dailyAverage;
                        } else {
                          const monthRecords = milkProductions.filter(
                            (record) => {
                              const recordDate = new Date(record.date);
                              return (
                                recordDate.getFullYear() === currentYear &&
                                recordDate.getMonth() === currentMonth
                              );
                            }
                          );

                          // Group by day to get unique days with records
                          const productionByDay = {};
                          monthRecords.forEach((record) => {
                            const dateKey = record.date.split("T")[0];
                            if (!productionByDay[dateKey]) {
                              productionByDay[dateKey] = 0;
                            }
                            productionByDay[dateKey] +=
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0);
                          });

                          const uniqueDays =
                            Object.keys(productionByDay).length;
                          const total = monthRecords.reduce(
                            (sum, record) =>
                              sum +
                              (record.morningAmount || 0) +
                              (record.eveningAmount || 0),
                            0
                          );

                          dailyAverage =
                            uniqueDays > 0 ? total / uniqueDays : 0;
                        }

                        return (dailyAverage * daysInMonth).toFixed(0);
                      })()}{" "}
                      L
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Highest Day:</span>
                    <span className="font-medium">
                      {(() => {
                        if (monthlySummary?.highestDay?.amount) {
                          return monthlySummary.highestDay.amount.toFixed(2);
                        }

                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth(); // 0-11

                        const monthRecords = milkProductions.filter(
                          (record) => {
                            const recordDate = new Date(record.date);
                            return (
                              recordDate.getFullYear() === currentYear &&
                              recordDate.getMonth() === currentMonth
                            );
                          }
                        );

                        // Group by day
                        const productionByDay = {};
                        monthRecords.forEach((record) => {
                          const dateKey = record.date.split("T")[0];
                          if (!productionByDay[dateKey]) {
                            productionByDay[dateKey] = 0;
                          }
                          productionByDay[dateKey] +=
                            (record.morningAmount || 0) +
                            (record.eveningAmount || 0);
                        });

                        if (Object.keys(productionByDay).length === 0) {
                          return "0.00";
                        }

                        const highestDay = Object.entries(
                          productionByDay
                        ).reduce(
                          (max, [date, amount]) =>
                            amount > max.amount ? { date, amount } : max,
                          { date: "", amount: 0 }
                        );

                        return highestDay.amount.toFixed(2);
                      })()}{" "}
                      L
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add weekly summary calculation card */}
          {!storeLoading && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-gray-700 mb-3">
                Recent Week Summary
              </h3>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {(() => {
                    // Calculate last 7 days statistics
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                    const weekRecords = milkProductions.filter(
                      (record) => new Date(record.date) >= oneWeekAgo
                    );

                    const totalWeekProduction = weekRecords.reduce(
                      (sum, record) => {
                        return (
                          sum +
                          (record.morningAmount || 0) +
                          (record.eveningAmount || 0)
                        );
                      },
                      0
                    );

                    // Group by day to count unique dates
                    const productionByDay = {};
                    weekRecords.forEach((record) => {
                      const dateKey = record.date.split("T")[0];
                      if (!productionByDay[dateKey]) {
                        productionByDay[dateKey] = 0;
                      }
                      productionByDay[dateKey] +=
                        (record.morningAmount || 0) +
                        (record.eveningAmount || 0);
                    });

                    const uniqueDays = Object.keys(productionByDay).length;
                    const dailyAvg =
                      uniqueDays > 0 ? totalWeekProduction / uniqueDays : 0;

                    return (
                      <>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600">
                            Total Week Production
                          </h4>
                          <p className="text-xl font-bold text-gray-800">
                            {totalWeekProduction.toFixed(2)} L
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600">
                            Daily Average
                          </h4>
                          <p className="text-xl font-bold text-gray-800">
                            {dailyAvg.toFixed(2)} L
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600">
                            Records Count
                          </h4>
                          <p className="text-xl font-bold text-gray-800">
                            {weekRecords.length}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600">
                            Days With Records
                          </h4>
                          <p className="text-xl font-bold text-gray-800">
                            {uniqueDays} / 7
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
              clipRule="evenodd"
            />
          </svg>
          <span>Filters</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transform ${showFilters ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {showFilters && (
          <div className="mt-3 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <DatePicker
                  selected={
                    filters.startDate ? new Date(filters.startDate) : null
                  }
                  onChange={(date) => handleFilterDateChange("startDate", date)}
                  className="w-full p-2 border rounded-md"
                  placeholderText="Select start date"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <DatePicker
                  selected={filters.endDate ? new Date(filters.endDate) : null}
                  onChange={(date) => handleFilterDateChange("endDate", date)}
                  className="w-full p-2 border rounded-md"
                  placeholderText="Select end date"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cattle
                </label>
                <select
                  name="cattleId"
                  value={filters.cattleId || ""}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Cattle</option>
                  {cattle.map((cow) => (
                    <option key={cow._id} value={cow.tagId}>
                      {cow.tagId} - {cow.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchMilkProductions}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              {editMode
                ? "Edit Milk Production Record"
                : "Add New Milk Production Record"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cattle*
                </label>
                <select
                  name="cattleId"
                  value={formData.cattleId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Cattle</option>
                  {cattle.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.tagId} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date*
                </label>
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  className="w-full p-2 border rounded-md"
                  dateFormat="yyyy-MM-dd"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift*
                </label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {editMode
                    ? "Select which shift to edit"
                    : "Select which shift to record. If an entry already exists for this cattle today, its value will be updated."}
                </p>
              </div>

              {formData.shift === "morning" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Morning Amount (liters)*
                  </label>
                  <input
                    type="text"
                    name="morningAmount"
                    value={formData.morningAmount}
                    onChange={handleNumberInputChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="0.00"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evening Amount (liters)*
                  </label>
                  <input
                    type="text"
                    name="eveningAmount"
                    value={formData.eveningAmount}
                    onChange={handleNumberInputChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="sendToProcurement"
                    checked={sendToProcurement}
                    onChange={(e) => setSendToProcurement(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="sendToProcurement"
                    className="ml-2 block text-sm font-medium text-gray-700"
                  >
                    Send to Procurement{" "}
                    <span className="text-green-600 text-xs">
                      (Automatically create procurement record)
                    </span>
                  </label>
                </div>
              </div>

              {sendToProcurement && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Milk Type
                    </label>
                    <select
                      name="milkType"
                      value={procurementData.milkType}
                      onChange={(e) =>
                        setProcurementData({
                          ...procurementData,
                          milkType: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-md"
                      required={sendToProcurement}
                    >
                      <option value="C">Cow (C)</option>
                      <option value="B">Buffalo (B)</option>
                      <option value="M">Mixed (M)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fat %
                    </label>
                    <select
                      name="fat"
                      value={procurementData.fat}
                      onChange={(e) =>
                        setProcurementData({
                          ...procurementData,
                          fat: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-md"
                      required={sendToProcurement}
                    >
                      <option value="">Select Fat %</option>
                      {availableFatSnf.fat.map((fatValue) => (
                        <option key={fatValue} value={fatValue}>
                          {fatValue}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SNF %
                    </label>
                    <select
                      name="snf"
                      value={procurementData.snf}
                      onChange={(e) =>
                        setProcurementData({
                          ...procurementData,
                          snf: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-md"
                      required={sendToProcurement}
                    >
                      <option value="">Select SNF %</option>
                      {availableFatSnf.snf.map((snfValue) => (
                        <option key={snfValue} value={snfValue}>
                          {snfValue}%
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows="2"
                  placeholder="Optional notes about this milk production"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                {isSubmitting || storeLoading
                  ? "Saving..."
                  : editMode
                  ? "Update Record"
                  : "Add Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Daily Production Trend
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, "dd/MM");
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} L`, "Total"]}
                  labelFormatter={(value) =>
                    format(new Date(value), "dd MMM yyyy")
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Total Production (L)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Morning vs Evening Production
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={milkProductions.slice(0, 7).map((record) => ({
                  date: record.date,
                  morning: record.morningAmount || 0,
                  evening: record.eveningAmount || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, "dd/MM");
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} L`, ""]}
                  labelFormatter={(value) =>
                    format(new Date(value), "dd MMM yyyy")
                  }
                />
                <Legend />
                <Bar dataKey="morning" name="Morning (L)" fill="#3B82F6" />
                <Bar dataKey="evening" name="Evening (L)" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Milk Production Records
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cattle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Morning (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evening (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total (L)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weekly Avg.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {milkProductions.map((record, index) => (
                <tr
                  key={`${record._id || "record"}-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {format(new Date(record.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {typeof record.cattleId === "object"
                      ? record.cattleId.tagId
                      : record.cattleId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {record.morningAmount?.toFixed(2) || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {record.eveningAmount?.toFixed(2) || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {calculateTotal(record).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {calculateWeeklyAverage(
                      typeof record.cattleId === "object"
                        ? record.cattleId.tagId
                        : record.cattleId
                    )}{" "}
                    L
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {record.notes && (
                        <button
                          onClick={() => handleViewNotes(record.notes)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-eye"
                            viewBox="0 0 16 16"
                          >
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-green-600 hover:text-green-800 mr-3 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(record._id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setProcurementData({
                            milkType: "C",
                            fat: availableFatSnf.fat[0] || "",
                            snf: availableFatSnf.snf[0] || "",
                          });
                          setSendToProcurement(true);
                          setFormData({
                            ...record,
                            date: new Date(record.date),
                          });
                          setShowForm(true);
                        }}
                        className={`transition-colors ml-1 ${
                          sentToProcurement[record._id]
                            ? "text-green-600 hover:text-green-800"
                            : "text-yellow-600 hover:text-yellow-800"
                        }`}
                        title={
                          sentToProcurement[record._id]
                            ? "Already Sent to Procurement"
                            : "Send to Procurement"
                        }
                      >
                        <FaExchangeAlt className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Popup */}
      {showNotesPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Notes</h3>
              <button
                onClick={closeNotesPopup}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {selectedNotes ? (
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedNotes}
                </p>
              ) : (
                <p className="text-gray-500 italic">No notes available</p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={closeNotesPopup}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkProduction;
