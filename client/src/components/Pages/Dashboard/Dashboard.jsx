import { useState, useEffect } from "react";
import { FaMoneyBillWave, FaCalendarCheck } from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import { MdProductionQuantityLimits } from "react-icons/md";
import { IoMdTrendingUp, IoMdTrendingDown } from "react-icons/io";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FiLoader } from "react-icons/fi";
import useAuthStore from "../../../store/authStore";
import useDashboardStore from "../../../store/dashboardStore";
import { Navigate, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    dashboardData, 
    isLoading, 
    error: dashboardError, 
    fetchDashboardData, 
    clearError 
  } = useDashboardStore();
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch dashboard data using the store
    const loadDashboardData = async () => {
      try {
        await fetchDashboardData();
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setError(error.message || "Failed to load dashboard data");
        toast.error("Failed to load dashboard data. Please try again later.");
      }
    };

    loadDashboardData();
  }, [fetchDashboardData]);

  // Set error from store if available
  useEffect(() => {
    if (dashboardError) {
      setError(dashboardError);
    }
  }, [dashboardError]);

  // Handler for quick action buttons
  const handleQuickAction = (action) => {
    console.log(`Quick action clicked: ${action}`);
    // Navigate to the appropriate page based on the action
    switch (action) {
      case "Add Cattle":
        navigate("/dashboard/cattle/add");
        break;
      case "Record Milk":
        navigate("/dashboard/milk-production");
        break;
      case "Health Check":
        navigate("/dashboard/disease-prediction");
        break;
      case "Veterinary Services":
        navigate("/dashboard/veterinary-services");
        break;
      default:
        alert(`${action} feature coming soon!`);
    }
  };

  // Handler for "View All" buttons
  const handleViewAll = (section) => {
    console.log(`View all clicked for: ${section}`);
    switch (section) {
      case "health":
        navigate("/dashboard/cattle");
        break;
      case "activities":
        navigate("/dashboard/activities");
        break;
      case "notifications":
        navigate("/dashboard/notifications");
        break;
      default:
      // Do nothing
    }
  };

  // Authentication check
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/auth/login" />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <FiLoader className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state - show partial dashboard instead of full error screen
  // This allows users to still interact with the dashboard even if some data failed to load
  if (error) {
    toast.error(error);
    // Don't return early, continue to render the dashboard with default values
  }

  // Ensure dashboardData is defined
  const safeData = dashboardData || {
    totalCattle: 0,
    milkProduction: 0,
    revenue: 0,
    activeTasks: 0,
    milkProductionTrend: [],
    healthAlerts: []
  };

  // Main dashboard content
  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          Welcome back, {user?.name || "Farm Manager"}
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with your farm today
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Some data could not be loaded. Showing available information.
            <button
              className="ml-2 underline text-yellow-600"
              onClick={() => {
                clearError();
                fetchDashboardData();
              }}
            >
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Cattle Card */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <div className="text-green-600">
              <FaCow className="h-8 w-8" />
            </div>
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <IoMdTrendingUp className="text-green-500 mr-1" />
              <span>+2.5%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Total Cattle
          </h3>
          <div className="flex items-end">
            <p className="text-2xl font-bold text-gray-800">
              {safeData.totalCattle}
            </p>
            <p className="text-xs text-gray-500 ml-2 mb-1">animals</p>
          </div>
        </div>

        {/* Milk Production Card */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <div className="text-green-600">
              <MdProductionQuantityLimits className="h-8 w-8" />
            </div>
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <IoMdTrendingUp className="text-green-500 mr-1" />
              <span>+4.2%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Today&apos;s Production
          </h3>
          <div className="flex items-end">
            <p className="text-2xl font-bold text-gray-800">
              {safeData.milkProduction}
            </p>
            <p className="text-xs text-gray-500 ml-2 mb-1">liters</p>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <div className="text-green-600">
              <FaMoneyBillWave className="h-8 w-8" />
            </div>
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <IoMdTrendingDown className="text-red-500 mr-1" />
              <span>-0.8%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Monthly Revenue
          </h3>
          <div className="flex items-end">
            <p className="text-2xl font-bold text-gray-800">₹{safeData.revenue}</p>
            <p className="text-xs text-gray-500 ml-2 mb-1">INR</p>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <div className="text-green-600">
              <FaCalendarCheck className="h-8 w-8" />
            </div>
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <span>Today</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Active Tasks
          </h3>
          <div className="flex items-end">
            <p className="text-2xl font-bold text-gray-800">
              {safeData.activeTasks}
            </p>
            <p className="text-xs text-gray-500 ml-2 mb-1">tasks</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md col-span-2 border border-green-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">
              Milk Production Overview
            </h3>
            <button className="text-gray-400 hover:text-gray-600">
              <BsThreeDotsVertical />
            </button>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeData.milkProductionTrend && safeData.milkProductionTrend.length > 0 ? safeData.milkProductionTrend : [
                { day: "Mon", liters: 0 },
                { day: "Tue", liters: 0 },
                { day: "Wed", liters: 0 },
                { day: "Thu", liters: 0 },
                { day: "Fri", liters: 0 },
                { day: "Sat", liters: 0 },
                { day: "Sun", liters: 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="liters"
                  stroke="#16a34a"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Average</p>
              <p className="font-semibold">42L/cow</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Peak</p>
              <p className="font-semibold">58L/cow</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Low</p>
              <p className="font-semibold">35L/cow</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Projected</p>
              <p className="font-semibold">+3.2%</p>
            </div>
          </div>
        </div>

        {/* Health Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-green-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">
              Cattle Health Distribution
            </h3>
            <button 
              onClick={() => handleViewAll("health")}
              className="text-sm text-green-600 hover:text-green-700"
            >
              View All
            </button>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            {(safeData.healthyCattle > 0 || safeData.sickCattle > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Healthy', value: safeData.healthyCattle || 0 },
                      { name: 'Sick', value: safeData.sickCattle || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    <Cell fill="#4ade80" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} cattle`, ``]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-4">
                <p className="text-gray-500">No health data available</p>
                <p className="text-sm text-gray-400 mt-1">Add cattle to see health statistics</p>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">Healthy: {safeData.healthyCattle || 0}</p>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">Sick: {safeData.sickCattle || 0}</p>
            </div>
          </div>
        </div>

        {/* Health Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-green-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Health Alerts</h3>
            <button 
              onClick={() => handleViewAll("health")}
              className="text-sm text-green-600 hover:text-green-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {safeData.healthAlerts && safeData.healthAlerts.length > 0 ? (
              safeData.healthAlerts.map((alert, index) => (
                <div key={index} className="flex items-start p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex-shrink-0 mr-3">
                    <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <FaCow className="text-red-500" />
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800">
                      {alert.name} <span className="text-gray-500 text-sm">(Tag: {alert.tagId})</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="text-red-600 font-medium">{alert.healthStatus?.status}</span>
                    </p>
                    <div className="flex mt-1 text-xs text-gray-500">
                      <span className="mr-3">{alert.breed}</span>
                      <span>{alert.gender}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-green-100 mb-4">
                  <FaCow className="text-green-500 h-6 w-6" />
                </div>
                <p className="text-gray-700 font-medium">No health alerts at this time</p>
                <p className="text-sm text-gray-600 mt-1">All your cattle are in good health</p>
                <button 
                  onClick={() => navigate("/dashboard/disease-prediction")}
                  className="mt-4 text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Run Health Check
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cattle Health Status */}
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 border border-green-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Cattle Health Status</h3>
            <button
              onClick={() => handleViewAll("health")}
              className="text-sm text-green-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Breed
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  {
                    id: "C-1024",
                    name: "Bella",
                    breed: "Holstein",
                    age: "4 years",
                    health: "Good",
                  },
                  {
                    id: "C-1032",
                    name: "Daisy",
                    breed: "Jersey",
                    age: "3 years",
                    health: "Excellent",
                  },
                  {
                    id: "C-1045",
                    name: "Molly",
                    breed: "Holstein",
                    age: "5 years",
                    health: "Fair",
                  },
                  {
                    id: "C-1078",
                    name: "Lucy",
                    breed: "Brown Swiss",
                    age: "2 years",
                    health: "Good",
                  },
                ].map((cattle, index) => (
                  <tr key={index} className="hover:bg-gray-50 cursor-pointer">
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {cattle.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {cattle.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {cattle.breed}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {cattle.age}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          cattle.health === "Excellent"
                            ? "bg-green-100 text-green-800"
                            : cattle.health === "Good"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {cattle.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-green-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            <div className="bg-red-50 px-2 py-1 rounded-full text-xs font-medium text-red-600">
              3 New
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Vaccination Due",
                desc: "5 cattle need vaccination this week",
                type: "warning",
              },
              {
                title: "Low Feed Stock",
                desc: "Feed inventory below threshold",
                type: "alert",
              },
              {
                title: "Milk Quality Check",
                desc: "Schedule routine quality test",
                type: "info",
              },
            ].map((notification, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer hover:opacity-90 ${
                  notification.type === "warning"
                    ? "bg-yellow-50 border-l-4 border-yellow-400"
                    : notification.type === "alert"
                    ? "bg-red-50 border-l-4 border-red-400"
                    : "bg-blue-50 border-l-4 border-blue-400"
                }`}
              >
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {notification.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: "🐄", label: "Add Cattle" },
            { icon: "🥛", label: "Record Milk" },
            { icon: "🩺", label: "Health Check" },
            { icon: "🔬", label: "Veterinary Services" },
            { icon: "📋", label: "New Report" },
            { icon: "👨‍🌾", label: "Staff Roster" },
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.label)}
              className="bg-white flex flex-col items-center justify-center p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-green-100"
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="text-xs font-medium text-gray-700">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
