import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaMoneyBillWave,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFilter,
  FaDownload,
  FaChartLine,
  FaCalendarAlt,
  FaWineBottle,
  FaTable,
  FaFileExcel
} from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useFinanceStore from "../../../store/financeStore";
import useMPPStore from "../../../store/mppStore";
import * as XLSX from 'xlsx';

const Finance = () => {
  const {
    transactions = [],
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearError,
  } = useFinanceStore();

  // Add MPP store to access milk rates
  const { 
    fetchRate, 
    fetchAvailableValues, 
    fetchMPPFinanceTotal, 
    fetchMilkCollections,
    milkCollections = []
  } = useMPPStore();

  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 6))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: "income",
    category: "",
    amount: "",
    description: "",
    date: new Date(),
  });

  // Add state for milk rate information
  const [availableFatSnf, setAvailableFatSnf] = useState({ fat: [], snf: [] });
  const [milkRateData, setMilkRateData] = useState({
    fat: "",
    snf: "",
    quantity: "",
    currentRate: 0,
  });
  const [showMilkRateHelper, setShowMilkRateHelper] = useState(false);

  // Add state for MPP total amount
  const [mppFinanceData, setMPPFinanceData] = useState({
    totalAmount: 0,
    totalQuantity: 0,
    count: 0,
  });

  // Add state for collection table and filters
  const [showCollectionTable, setShowCollectionTable] = useState(false);
  const [collectionFilters, setCollectionFilters] = useState({
    shift: "",
    dateRange: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date()
    }
  });

  useEffect(() => {
    fetchTransactions(startDate, endDate);
    
    // Fetch MPP finance total when dates change
    const fetchMPPTotal = async () => {
      try {
        const mppData = await fetchMPPFinanceTotal(
          startDate.toISOString(),
          endDate.toISOString()
        );
        if (mppData) {
          setMPPFinanceData(mppData);
        }
      } catch (error) {
        console.error("Failed to fetch MPP finance total:", error);
      }
    };
    
    fetchMPPTotal();

    // Fetch milk collections for the table
    const fetchCollections = async () => {
      if (showCollectionTable) {
        const params = {
          startDate: collectionFilters.dateRange.startDate.toISOString(),
          endDate: collectionFilters.dateRange.endDate.toISOString()
        };
        
        if (collectionFilters.shift) {
          params.shift = collectionFilters.shift;
        }
        
        await fetchMilkCollections(params);
      }
    };
    
    if (showCollectionTable) {
      fetchCollections();
    }

    // Fetch available fat/snf values when component mounts
    const loadFatSnfValues = async () => {
      try {
        const values = await fetchAvailableValues();
        setAvailableFatSnf(values);

        // Set default values if available
        if (values.fat.length > 0 && values.snf.length > 0) {
          setMilkRateData((prev) => ({
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
  }, [
    startDate, 
    endDate, 
    fetchTransactions, 
    fetchAvailableValues, 
    fetchMPPFinanceTotal,
    showCollectionTable,
    collectionFilters,
    fetchMilkCollections
  ]);

  // Add effect to update the milk rate when fat/snf changes
  useEffect(() => {
    const updateMilkRate = async () => {
      if (milkRateData.fat && milkRateData.snf) {
        try {
          const rate = await fetchRate(milkRateData.fat, milkRateData.snf);
          setMilkRateData((prev) => ({
            ...prev,
            currentRate: rate || 0,
          }));
        } catch (error) {
          console.error("Error fetching milk rate:", error);
        }
      }
    };

    updateMilkRate();
  }, [milkRateData.fat, milkRateData.snf, fetchRate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const summary = {
    totalIncome: transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
    netBalance:
      transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0) -
      transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    mppTotalAmount: mppFinanceData.totalAmount || 0,
  };

  // Function to calculate milk sale amount based on rate and quantity
  const calculateMilkSaleAmount = () => {
    if (!milkRateData.quantity || !milkRateData.currentRate) return 0;

    const quantity = parseFloat(milkRateData.quantity);
    const rate = parseFloat(milkRateData.currentRate);

    if (isNaN(quantity) || isNaN(rate)) return 0;

    return (quantity * rate).toFixed(2);
  };

  // Add milk rate data to form
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

  const validateForm = () => {
    if (!formData.category) {
      toast.error("Please select a category");
      return false;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return false;
    }
    if (!formData.date) {
      toast.error("Please select a date");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const transactionData = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (selectedTransaction) {
        await updateTransaction(selectedTransaction._id, transactionData);
        toast.success("Transaction updated successfully");
      } else {
        await addTransaction(transactionData);
        toast.success("Transaction added successfully");
      }

      // Reset form and close modals
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setFormData({
        type: "income",
        category: "",
        amount: "",
        description: "",
        date: new Date(),
      });
      setSelectedTransaction(null);
      setShowMilkRateHelper(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: new Date(transaction.date),
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(id);
        toast.success("Transaction deleted successfully");
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const categories = {
    income: ["Milk Sales", "Cattle Sales", "Equipment Sales", "Other Income"],
    expense: [
      "Feed",
      "Labor",
      "Veterinary",
      "Equipment",
      "Utilities",
      "Maintenance",
      "Other Expenses",
    ],
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  // New function to export collection data to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const data = milkCollections.map(collection => ({
        Date: new Date(collection.collectionDate).toLocaleDateString(),
        Shift: collection.shift === 'morning' ? 'Morning' : 'Evening',
        "Milk Type": collection.milkType,
        Fat: collection.fat.toFixed(2),
        SNF: collection.snf.toFixed(2),
        Rate: collection.rate.toFixed(2),
        Quantity: collection.quantity.toFixed(2),
        "Total Amount": collection.totalAmount.toFixed(2)
      }));

      // Calculate averages and totals
      const totalQuantity = milkCollections.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = milkCollections.reduce((sum, item) => sum + item.totalAmount, 0);
      const avgFat = milkCollections.reduce((sum, item) => sum + item.fat, 0) / (milkCollections.length || 1);
      const avgSNF = milkCollections.reduce((sum, item) => sum + item.snf, 0) / (milkCollections.length || 1);
      const avgRate = milkCollections.reduce((sum, item) => sum + item.rate, 0) / (milkCollections.length || 1);

      // Add summary row
      data.push({
        Date: "",
        Shift: "",
        "Milk Type": "",
        Fat: `Avg: ${avgFat.toFixed(2)}`,
        SNF: `Avg: ${avgSNF.toFixed(2)}`,
        Rate: `Avg: ${avgRate.toFixed(2)}`,
        Quantity: `Total: ${totalQuantity.toFixed(2)}`,
        "Total Amount": `Total: ${totalAmount.toFixed(2)}`
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const wscols = [
        { wch: 15 }, // Date
        { wch: 10 }, // Shift
        { wch: 10 }, // Milk Type
        { wch: 10 }, // Fat
        { wch: 10 }, // SNF
        { wch: 10 }, // Rate
        { wch: 12 }, // Quantity
        { wch: 15 }, // Total Amount
      ];
      ws['!cols'] = wscols;

      // Create workbook and add the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Collections");

      // Generate file name with date range
      const startDateStr = collectionFilters.dateRange.startDate.toLocaleDateString().replace(/\//g, '-');
      const endDateStr = collectionFilters.dateRange.endDate.toLocaleDateString().replace(/\//g, '-');
      const shiftStr = collectionFilters.shift ? `_${collectionFilters.shift}` : '';
      const fileName = `Milk_Collections_${startDateStr}_to_${endDateStr}${shiftStr}.xlsx`;

      // Write the file and download
      XLSX.writeFile(wb, fileName);
      toast.success('Export successful!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <FiLoader className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Financial Data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-12 p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Financial Management
        </h1>
        <p className="text-sm text-gray-600">
          Track and manage your farm's financial transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Income Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Income</p>
              <h3 className="text-xl font-semibold">₹{summary.totalIncome.toLocaleString()}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FaMoneyBillWave className="text-green-500 text-xl" />
            </div>
          </div>
        </motion.div>

        {/* MPP Total Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">MPP Total Amount</p>
              <h3 className="text-xl font-semibold">₹{mppFinanceData.totalAmount.toLocaleString()}</h3>
              <p className="text-xs text-gray-400">{mppFinanceData.totalQuantity.toFixed(2)} L from {mppFinanceData.count} collections</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FaWineBottle className="text-blue-500 text-xl" />
            </div>
          </div>
        </motion.div>

        {/* Expenses Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <h3 className="text-xl font-semibold">₹{summary.totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FaMoneyBillWave className="text-red-500 text-xl" />
            </div>
          </div>
        </motion.div>

        {/* Net Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Net Balance</p>
              <h3 className="text-xl font-semibold">₹{summary.netBalance.toLocaleString()}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FaChartLine className="text-purple-500 text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Collection Table Toggle Button */}
      <motion.div
        variants={itemVariants}
        className="mb-4"
      >
        <button
          onClick={() => setShowCollectionTable(!showCollectionTable)}
          className="flex items-center space-x-1 py-1.5 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaTable className="h-3.5 w-3.5" />
          <span>{showCollectionTable ? "Hide Collection Table" : "Show Collection Table"}</span>
        </button>
      </motion.div>

      {/* Collection Table */}
      {showCollectionTable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-5 border border-blue-100 mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-3 md:mb-0">
              Milk Collection Data
            </h3>
            
            <div className="flex flex-col md:flex-row gap-3">
              {/* Shift Filter */}
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Shift:</span>
                <select
                  value={collectionFilters.shift}
                  onChange={(e) => setCollectionFilters({
                    ...collectionFilters,
                    shift: e.target.value
                  })}
                  className="form-select text-sm border border-gray-300 rounded-md p-1.5 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  <option value="">All Shifts</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Date Range:</span>
                <div className="flex items-center">
                  <div className="relative">
                    <DatePicker
                      selected={collectionFilters.dateRange.startDate}
                      onChange={(date) => setCollectionFilters({
                        ...collectionFilters,
                        dateRange: {
                          ...collectionFilters.dateRange,
                          startDate: date
                        }
                      })}
                      selectsStart
                      startDate={collectionFilters.dateRange.startDate}
                      endDate={collectionFilters.dateRange.endDate}
                      dateFormat="MMM dd, yyyy"
                      className="form-input text-sm border border-gray-300 rounded-md p-1.5 w-32 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <FaCalendarAlt className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-3.5 w-3.5" />
                  </div>
                  <span className="mx-2 text-gray-500">-</span>
                  <div className="relative">
                    <DatePicker
                      selected={collectionFilters.dateRange.endDate}
                      onChange={(date) => setCollectionFilters({
                        ...collectionFilters,
                        dateRange: {
                          ...collectionFilters.dateRange,
                          endDate: date
                        }
                      })}
                      selectsEnd
                      startDate={collectionFilters.dateRange.startDate}
                      endDate={collectionFilters.dateRange.endDate}
                      minDate={collectionFilters.dateRange.startDate}
                      dateFormat="MMM dd, yyyy"
                      className="form-input text-sm border border-gray-300 rounded-md p-1.5 w-32 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <FaCalendarAlt className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              
              {/* Export Button */}
              <button
                onClick={exportToExcel}
                className="flex items-center space-x-1 py-1.5 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ml-2"
              >
                <FaFileExcel className="h-3.5 w-3.5" />
                <span>Export to Excel</span>
              </button>
            </div>
          </div>
          
          {/* Collection Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Milk Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SNF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {milkCollections.map((collection) => (
                  <tr key={collection._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(collection.collectionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {collection.shift === 'morning' ? 'Morning' : 'Evening'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {collection.milkType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {collection.fat.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {collection.snf.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{collection.rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {collection.quantity.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{collection.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900">
                    Summary
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Avg: {milkCollections.length > 0 
                      ? (milkCollections.reduce((sum, item) => sum + item.fat, 0) / milkCollections.length).toFixed(2)
                      : '0.00'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Avg: {milkCollections.length > 0 
                      ? (milkCollections.reduce((sum, item) => sum + item.snf, 0) / milkCollections.length).toFixed(2)
                      : '0.00'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Avg: ₹{milkCollections.length > 0 
                      ? (milkCollections.reduce((sum, item) => sum + item.rate, 0) / milkCollections.length).toFixed(2)
                      : '0.00'
                    }
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Total: {milkCollections.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Total: ₹{milkCollections.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}

      {/* Filter Bar */}
      <motion.div
        variants={itemVariants}
        className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-green-100"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-700">
              Transaction Controls
            </h3>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
            >
              <FaFilter className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Date Range:
              </span>
              <div className="flex items-center">
                <div className="relative">
                  <DatePicker
                    selected={startDate}
                    onChange={setStartDate}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="MMM dd, yyyy"
                    className="form-input text-sm border border-gray-300 rounded-md p-1.5 w-32 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                  />
                  <FaCalendarAlt className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-3.5 w-3.5" />
                </div>
                <span className="mx-2 text-gray-500">-</span>
                <div className="relative">
                  <DatePicker
                    selected={endDate}
                    onChange={setEndDate}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="MMM dd, yyyy"
                    className="form-input text-sm border border-gray-300 rounded-md p-1.5 w-32 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                  />
                  <FaCalendarAlt className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1 py-1.5 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FaPlus className="h-3.5 w-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-lg shadow-sm p-5 border border-green-100"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="">Select a category</option>
                    {categories[formData.type].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    dateFormat="MMM dd, yyyy"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Transaction</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="">Select a category</option>
                    {categories[formData.type].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    dateFormat="MMM dd, yyyy"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Update Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Finance;
