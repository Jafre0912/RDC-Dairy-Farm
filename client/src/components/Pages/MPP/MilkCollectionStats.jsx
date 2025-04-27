import { useEffect } from "react";
import useMPPStore from "../../../store/mppStore";
import { FiDroplet, FiBarChart2, FiCalendar, FiClock } from "react-icons/fi";

const MilkCollectionStats = () => {
  const { stats, shiftStats, isLoading } = useMPPStore();

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  // Get shift data safely
  const getShiftData = (shift, property, defaultValue = 0) => {
    if (!shiftStats || !shiftStats[shift]) return defaultValue;
    return shiftStats[shift][property] || defaultValue;
  };

  // Calculate morning/evening percentage
  const calculatePercentage = (shift) => {
    if (!shiftStats) return 0;

    const shiftTotal = getShiftData(shift, "totalQuantity", 0);
    const morningTotal = getShiftData("morning", "totalQuantity", 0);
    const eveningTotal = getShiftData("evening", "totalQuantity", 0);
    const grandTotal = morningTotal + eveningTotal;

    if (grandTotal === 0) return 0;
    return (shiftTotal / grandTotal) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Collection Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Total Collection
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>
                  {formatNumber(stats?.totalQuantity?.toFixed(1) || 0)} L
                </span>
              )}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <FiDroplet className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded p-2">
            <span className="text-xs text-gray-500">Morning</span>
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span>
                  {formatNumber(
                    getShiftData("morning", "totalQuantity", 0).toFixed(1)
                  )}{" "}
                  L
                </span>
              )}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-green-600 h-1.5 rounded-full"
                style={{ width: `${calculatePercentage("morning")}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded p-2">
            <span className="text-xs text-gray-500">Evening</span>
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span>
                  {formatNumber(
                    getShiftData("evening", "totalQuantity", 0).toFixed(1)
                  )}{" "}
                  L
                </span>
              )}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${calculatePercentage("evening")}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>
                  ₹{formatNumber(stats?.totalAmount?.toFixed(2) || 0)}
                </span>
              )}
            </p>
          </div>
          <div className="bg-indigo-100 p-3 rounded-full">
            <FiBarChart2 className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded p-2">
            <span className="text-xs text-gray-500">Morning</span>
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span>
                  ₹
                  {formatNumber(
                    getShiftData("morning", "totalAmount", 0).toFixed(2)
                  )}
                </span>
              )}
            </p>
          </div>

          <div className="bg-gray-50 rounded p-2">
            <span className="text-xs text-gray-500">Evening</span>
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span>
                  ₹
                  {formatNumber(
                    getShiftData("evening", "totalAmount", 0).toFixed(2)
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Average Quality Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Average Quality
            </h3>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>
                  Fat: {(stats?.avgFat || 0).toFixed(1)}% | SNF:{" "}
                  {(stats?.avgSnf || 0).toFixed(1)}%
                </span>
              )}
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <FiCalendar className="h-6 w-6 text-yellow-600" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded p-2">
            <span className="text-xs text-gray-500">Morning Avg</span>
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span>
                  Fat: {getShiftData("morning", "avgFat", 0).toFixed(1)}% | SNF:{" "}
                  {getShiftData("morning", "avgSnf", 0).toFixed(1)}%
                </span>
              )}
            </p>
          </div>

          <div className="bg-gray-50 rounded p-2">
            <span className="text-xs text-gray-500">Evening Avg</span>
            <p className="text-sm font-medium text-gray-700">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                <span>
                  Fat: {getShiftData("evening", "avgFat", 0).toFixed(1)}% | SNF:{" "}
                  {getShiftData("evening", "avgSnf", 0).toFixed(1)}%
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Average Rate Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Records & Rate
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>{stats?.recordCount || 0} Records</span>
              )}
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <FiClock className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="mt-4">
          <div className="bg-gray-50 rounded p-2">
            <span className="text-xs text-gray-500">Average Rate</span>
            <p className="text-lg font-medium text-gray-700">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>₹{(stats?.avgRate || 0).toFixed(2)}/L</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilkCollectionStats;
