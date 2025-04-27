import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHouseUser,
  FaMoneyBillWave,
  FaUserMd,
  FaChartLine,
  FaCogs,
  FaUserCircle,
  FaSearch,
  FaHistory,
  FaTint,
} from "react-icons/fa";
import { FaCow } from "react-icons/fa6";
import { MdProductionQuantityLimits } from "react-icons/md";

const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 1024);
  const location = useLocation();
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsCollapsed(window.innerWidth <= 1024);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Hide sidebar completely on mobile
  if (isMobile) return null;

  // Define navigation categories and items
  const navigationCategories = [
    {
      id: "main",
      title: "Main",
      items: [
        {
          icon: <FaHouseUser className="w-5 h-5" />,
          text: "Dashboard",
          path: "/dashboard",
        },
      ],
    },
    {
      id: "livestock",
      title: "Livestock Management",
      items: [
        {
          icon: <FaCow className="w-5 h-5" />,
          text: "Cattle",
          path: "/dashboard/cattle",
        },
        {
          icon: <FaTint className="w-5 h-5" />,
          text: "Milk Management",
          path: "/dashboard/milk-management",
        },
      ],
    },
    {
      id: "health",
      title: "Health & Veterinary",
      items: [
        {
          icon: <FaSearch className="w-5 h-5" />,
          text: "Disease Prediction",
          path: "/dashboard/disease-prediction",
        },
        {
          icon: <FaHistory className="w-5 h-5" />,
          text: "Disease History",
          path: "/dashboard/disease-history",
        },
        {
          icon: <FaUserMd className="w-5 h-5" />,
          text: "Veterinary Services",
          path: "/dashboard/veterinary-services",
        },
      ],
    },
    {
      id: "business",
      title: "Business",
      items: [
        {
          icon: <FaMoneyBillWave className="w-5 h-5" />,
          text: "Finance",
          path: "/dashboard/finance",
        },
        /*{
          icon: <FaChartLine className="w-5 h-5" />,
          text: "Reports",
          path: "/dashboard/reports",
        },*/
      ],
    },
    {
      id: "user",
      title: "User",
      items: [
        {
          icon: <FaUserCircle className="w-5 h-5" />,
          text: "Profile & Settings",
          path: "/dashboard/profile-settings",
        },
      ],
    },
  ];

  const toggleCategory = (categoryId) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedCategory(categoryId);
    } else {
      setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    }
  };

  return (
    <aside
      className={`
        hidden md:block fixed top-16 left-0 
        h-[calc(100vh-4rem)] bg-white shadow-lg 
        transition-all duration-300 ease-in-out z-20
        ${isCollapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Toggle Button */}
      <button
        className="absolute -right-3 top-6 bg-green-600 text-white 
                 rounded-full p-1 w-6 h-6 flex items-center justify-center 
                 shadow-lg hover:bg-green-700 focus:outline-none z-30"
        onClick={() => {
          setIsCollapsed(!isCollapsed);
          if (!isCollapsed) {
            setExpandedCategory(null);
          }
        }}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className="text-sm">{isCollapsed ? "→" : "←"}</span>
      </button>

      {/* Navigation Menu */}
      <nav className="h-full py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        <div className="space-y-4">
          {navigationCategories.map((category) => (
            <div key={category.id} className="space-y-1">
              {!isCollapsed && (
                <h3
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 cursor-pointer hover:text-green-600"
                  onClick={() => toggleCategory(category.id)}
                >
                  {category.title}
                </h3>
              )}
              <ul className="space-y-1">
                {category.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`
                        flex items-center ${
                          isCollapsed ? "justify-center" : ""
                        } 
                        p-2 rounded-lg transition-colors duration-200
                        ${
                          location.pathname === item.path ||
                          (item.path === "/dashboard/profile-settings" &&
                            (location.pathname === "/dashboard/profile" ||
                              location.pathname === "/dashboard/settings"))
                            ? "bg-green-100 text-green-800 font-medium border-l-4 border-green-600"
                            : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                        }
                      `}
                      title={isCollapsed ? item.text : ""}
                    >
                      <span
                        className={`text-lg ${
                          isCollapsed ? "mx-auto" : "min-w-[24px]"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="ml-3 whitespace-nowrap overflow-hidden text-sm">
                          {item.text}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
