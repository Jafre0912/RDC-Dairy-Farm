import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  Download, 
  Filter, 
  ChevronLeft, 
  DropletIcon, 
  Milk, 
  ScaleIcon,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const FarmerMilkTransactions = () => {
  const { farmerId } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalQuantity: 0,
    totalAmount: 0,
    avgFat: 0,
    avgSnf: 0,
    recordCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farmer, setFarmer] = useState(null);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchTransactions();
    fetchFarmerDetails();
  }, [farmerId]);
  
  const fetchTransactions = async (filters = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      console.log(`Fetching transactions for farmer: ${farmerId}`);
      const response = await axios.get(
        `${API_URL}/admin/farmers/${farmerId}/milk-transactions?${queryParams.toString()}`,
        {
          withCredentials: true
        }
      );
      
      if (response.data.status === 'success') {
        setTransactions(response.data.data.transactions);
        setStats(response.data.data.stats);
      } else {
        setError('Failed to fetch transactions');
        toast.error('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Error fetching transactions: ${errorMessage}`);
      
      // More detailed logging for debugging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        
        if (err.response.status === 401) {
          toast.error('Authentication error: Your session may have expired. Please try logging in again.');
        } else {
          toast.error(errorMessage || 'Failed to fetch transactions');
        }
      } else {
        toast.error('Network error: Could not connect to the server');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFarmerDetails = async () => {
    try {
      // This is a placeholder - you would need to implement a route to get farmer details by ID
      // For now, we'll just set a placeholder value
      setFarmer({
        id: farmerId,
        name: `Farmer #${farmerId}`,
      });
    } catch (err) {
      console.error('Error fetching farmer details:', err);
    }
  };
  
  const handleApplyFilters = () => {
    fetchTransactions({
      startDate,
      endDate
    });
  };
  
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    fetchTransactions();
  };
  
  const handleExportCSV = () => {
    // Filter transactions first
    const filteredTransactions = transactions.filter(transaction => {
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          transaction.shift.toLowerCase().includes(searchTermLower) ||
          transaction.milkType.toLowerCase().includes(searchTermLower)
        );
      }
      return true;
    });
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Date,Shift,Milk Type,Fat,SNF,Rate,Quantity,Total Amount\n";
    
    // Add rows
    filteredTransactions.forEach(transaction => {
      const date = format(new Date(transaction.collectionDate), 'yyyy-MM-dd');
      const row = [
        date,
        transaction.shift,
        transaction.milkType,
        transaction.fat.toFixed(2),
        transaction.snf.toFixed(2),
        transaction.rate.toFixed(2),
        transaction.quantity.toFixed(2),
        transaction.totalAmount.toFixed(2)
      ];
      csvContent += row.join(",") + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `farmer_${farmerId}_milk_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter displayed transactions based on search term
  const filteredTransactions = transactions.filter(transaction => {
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        transaction.shift.toLowerCase().includes(searchTermLower) ||
        transaction.milkType.toLowerCase().includes(searchTermLower)
      );
    }
    return true;
  });
  
  return (
    <div className="p-6 max-w-full">
      {/* Header with back button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <Link to="/admin/users" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2 md:mb-0">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Milk Transactions for {farmer?.name || `Farmer #${farmerId}`}
          </h1>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
      
      {/* Filter section */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter Transactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Milk</p>
              <p className="text-2xl font-bold">{stats.totalQuantity?.toFixed(2) || 0} L</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Milk className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold">₹{stats.totalAmount?.toFixed(2) || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Fat</p>
              <p className="text-2xl font-bold">{stats.avgFat?.toFixed(2) || 0}%</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DropletIcon className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. SNF</p>
              <p className="text-2xl font-bold">{stats.avgSnf?.toFixed(2) || 0}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <ScaleIcon className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none"
            />
          </div>
        </div>
        
        {/* Transactions table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-gray-500">No transactions found for this farmer.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milk Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SNF (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (L)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction, index) => (
                  <tr key={transaction._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.collectionDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`capitalize px-2 py-1 rounded-full text-xs ${
                        transaction.shift === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {transaction.shift}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.milkType === 'C' ? 'bg-green-100 text-green-800' : 
                        transaction.milkType === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {transaction.milkType === 'C' ? 'Cow' : 
                         transaction.milkType === 'B' ? 'Buffalo' : 'Mixed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.fat.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.snf.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.rate.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.quantity.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerMilkTransactions; 