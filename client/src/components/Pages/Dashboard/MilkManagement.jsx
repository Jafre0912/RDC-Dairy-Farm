import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiBarChart2, FiDroplet, FiTruck, FiRefreshCw } from "react-icons/fi";
import { Tab } from "@headlessui/react";
import MilkProduction from "./MilkProduction";
import MPPDashboard from "../MPP/MPPDashboard";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const MilkManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize tab from URL query parameter (default to 0 if not provided)
  const initialTab = parseInt(searchParams.get("tab") || "0", 10);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update URL when tab changes
  const handleTabChange = (index) => {
    setActiveTab(index);
    navigate(`/dashboard/milk-management?tab=${index}`, { replace: true });
  };

  // Set initial tab based on URL query parameter
  useEffect(() => {
    const tabParam = parseInt(searchParams.get("tab") || "0", 10);
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="py-6 px-4 sm:px-6 md:px-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Milk Management
        </h1>
        <p className="text-gray-600">
          Manage milk production from your cattle and milk procurement in one
          place
        </p>
      </div>

      <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
        <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm mb-6 border border-gray-200">
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-3 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-700"
              )
            }
          >
            <div className="flex items-center justify-center">
              <FiDroplet className="mr-2" />
              <span>Production</span>
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-3 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-700 hover:bg-green-50 hover:text-green-700"
              )
            }
          >
            <div className="flex items-center justify-center">
              <FiTruck className="mr-2" />
              <span>Procurement & Processing</span>
            </div>
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow p-6">
              <MilkProduction embedded={true} />
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow p-6">
              <MPPDashboard embedded={true} />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default MilkManagement;
