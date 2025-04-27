import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaUserShield, FaChartLine, FaBell, FaCalendarAlt } from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import { MdProductionQuantityLimits, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { IoSettings } from "react-icons/io5";
import axios from "axios";
import { toast } from "react-hot-toast";

// Add CSS keyframes for animations
import "./animations.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCattle: 0,
    totalProduction: 0,
    recentUsers: [],
    __isDefaultState: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/admin/dashboard-stats`, {
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        setStats({
          ...response.data.data,
          __isDefaultState: false
        });
      } else {
        setError("Failed to fetch dashboard data");
        toast.error("Failed to load dashboard statistics");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError(error.response?.data?.message || "Failed to load dashboard statistics");
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex flex-wrap items-center justify-between gap-4 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-amber-800 flex items-center">
            <FaUserShield className="text-amber-600 mr-2" /> FarmFlow Admin
        </h1>
          <p className="text-amber-700">Overview of your farm management system</p>
        </div>
        <button 
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center shadow-sm hover-lift"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="spinner">
            <div className="spinner-ring spinner-ring-1"></div>
            <div className="spinner-ring spinner-ring-2"></div>
            <div className="spinner-ring spinner-ring-3"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-amber-400 hover-lift fade-in">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Total Users</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers !== null && stats.totalUsers !== undefined ? stats.totalUsers : 0}
                </h3>
                <p className="flex items-center text-xs text-green-600 mt-2">
                  <MdTrendingUp className="mr-1" />
                  <span>12% increase</span>
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <FaUsers className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-400 hover-lift fade-in delay-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Active Users</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.activeUsers !== null && stats.activeUsers !== undefined ? stats.activeUsers : 0}
                </h3>
                <p className="flex items-center text-xs text-green-600 mt-2">
                  <MdTrendingUp className="mr-1" />
                  <span>8% increase</span>
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaUserShield className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          {/* Total Cattle */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-amber-500 hover-lift fade-in delay-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Total Cattle</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalCattle !== null && stats.totalCattle !== undefined ? stats.totalCattle : 0}
                </h3>
                <p className="flex items-center text-xs text-amber-600 mt-2">
                  <MdTrendingUp className="mr-1" />
                  <span>5% increase</span>
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <FaCow className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Milk Production */}
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-purple-400 hover-lift fade-in delay-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Milk Production</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalProduction !== null && stats.totalProduction !== undefined
                    ? `${stats.totalProduction.toFixed(2)} L`
                    : '0.00 L'}
                </h3>
                <p className="flex items-center text-xs text-red-600 mt-2">
                  <MdTrendingDown className="mr-1" />
                  <span>3% decrease</span>
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <MdProductionQuantityLimits className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Quick Links */}
      <div className="bg-white p-6 rounded-xl shadow-md fade-in delay-400">
        <h2 className="text-lg font-semibold mb-6 flex items-center text-amber-800">
          <FaUserShield className="text-amber-600 mr-2" />
          FarmFlow Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/users"
            className="group flex flex-col items-center p-6 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-xl transition-colors text-center hover-lift"
          >
            <div className="bg-amber-100 p-4 rounded-full mb-4 group-hover:bg-amber-200 transition-all duration-300 transform group-hover:scale-110">
              <FaUsers className="text-amber-600 text-2xl" />
            </div>
            <h3 className="font-medium mb-1 group-hover:text-amber-700">User Management</h3>
            <p className="text-sm text-gray-500">Add, edit, or remove users</p>
          </Link>
          
          <Link
            to="/admin/settings"
            className="group flex flex-col items-center p-6 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-xl transition-colors text-center hover-lift"
          >
            <div className="bg-amber-100 p-4 rounded-full mb-4 group-hover:bg-amber-200 transition-all duration-300 transform group-hover:scale-110">
              <IoSettings className="text-amber-600 text-2xl" />
            </div>
            <h3 className="font-medium mb-1 group-hover:text-amber-700">System Settings</h3>
              <p className="text-sm text-gray-500">Configure application settings</p>
          </Link>

          <Link
            to="/admin/veterinary-locations"
            className="group flex flex-col items-center p-6 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-xl transition-colors text-center hover-lift"
          >
            <div className="bg-amber-100 p-4 rounded-full mb-4 group-hover:bg-amber-200 transition-all duration-300 transform group-hover:scale-110">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-medium mb-1 group-hover:text-amber-700">Veterinary Locations</h3>
            <p className="text-sm text-gray-500">Manage vet services</p>
          </Link>
        </div>
      </div>
      
      {/* System Management */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Dairy Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/cattle"
            className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaCow className="text-amber-500 mr-3 text-xl" />
            <div>
              <span className="font-medium">Manage Cattle</span>
              <p className="text-sm text-gray-500">View and edit cattle records</p>
            </div>
          </Link>
          
          <Link
            to="/dashboard/milk-production"
            className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdProductionQuantityLimits className="text-purple-500 mr-3 text-xl" />
            <div>
              <span className="font-medium">Milk Production</span>
              <p className="text-sm text-gray-500">Track milk production data</p>
            </div>
          </Link>
          
          <Link
            to="/fix-admin-access"
            className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaUserShield className="text-green-600 mr-3 text-xl" />
            <div>
              <span className="font-medium">Admin Access</span>
              <p className="text-sm text-gray-500">Manage admin privileges</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activities and Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden fade-in delay-500">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex justify-between items-center">
            <h2 className="font-semibold text-amber-800 flex items-center">
              <FaUsers className="mr-2 text-amber-600" />
              Recent Users
            </h2>
            <Link to="/admin/users" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-100">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-100">
                {!stats.recentUsers || stats.recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent users found
                    </td>
                  </tr>
                ) : (
                  stats.recentUsers.map((user, index) => (
                    <tr key={user._id} className={`hover:bg-amber-50 transition-all fade-in`} style={{animationDelay: `${0.6 + (index * 0.1)}s`}}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 transition-all duration-300 hover:scale-110">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'No email'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'farmer' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Quick Actions and Notifications */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-md p-6 fade-in delay-400 hover-lift">
            <h2 className="font-semibold text-amber-800 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-amber-600" />
              Today
            </h2>
            <div className="text-center py-3 bg-amber-50 rounded-xl transition-all duration-300 hover:bg-amber-100">
              <p className="text-3xl font-bold text-amber-800">{new Date().getDate()}</p>
              <p className="text-lg text-amber-600">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="mt-4 border-t border-amber-100 pt-4">
              <div className="flex justify-between items-center text-sm text-amber-600">
                <span>Week {Math.ceil(new Date().getDate() / 7)}</span>
                <span>Q{Math.floor(new Date().getMonth() / 3) + 1} {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
          
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden fade-in delay-500 hover-lift">
            <div className="px-6 py-4 border-b border-amber-100 bg-amber-50">
              <h2 className="font-semibold text-amber-800 flex items-center">
                <FaBell className="mr-2 text-amber-600" />
                Recent Notifications
              </h2>
            </div>
            <div className="divide-y divide-amber-100">
              <div className="px-6 py-4 hover:bg-amber-50 transition-all duration-300 slide-in" style={{animationDelay: '0.7s'}}>
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500 mt-1">10 minutes ago</p>
              </div>
              <div className="px-6 py-4 hover:bg-amber-50 transition-all duration-300 slide-in" style={{animationDelay: '0.8s'}}>
                <p className="text-sm font-medium text-gray-900">System update completed</p>
                <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
              </div>
              <div className="px-6 py-4 hover:bg-amber-50 transition-all duration-300 slide-in" style={{animationDelay: '0.9s'}}>
                <p className="text-sm font-medium text-gray-900">Database backup successful</p>
                <p className="text-xs text-gray-500 mt-1">6 hours ago</p>
              </div>
            </div>
            <div className="px-6 py-3 bg-amber-50">
              <a href="#" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
                View all notifications
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200 fade-in delay-500 hover-lift">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-lg font-semibold mb-2 text-amber-800">Need Support?</h2>
            <p className="text-amber-700 max-w-2xl">
              Our support team is available 24/7 to help with any issues or questions you might have about the FarmFlow system.
            </p>
          </div>
          <div className="flex space-x-3">
            <a 
              href="#" 
              className="px-4 py-2 bg-white text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-all duration-300 hover-lift"
            >
              Documentation
            </a>
            <a 
              href="#" 
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-300 hover-lift"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 