import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaCow, FaBell, FaUser, FaBars, FaUserShield } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import {
  MdDashboard,
  MdProductionQuantityLimits,
  MdReport,
} from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { BiLogOut } from "react-icons/bi";
import useAuthStore from "../../../store/authStore";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [hasNotifications, setHasNotifications] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    // Close mobile menu and dropdown when route changes
    setIsOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate("/auth/login");
  };

  // Regular user links
  const regularLinks = [
    {
      path: "/dashboard",
      icon: <MdDashboard className="text-lg" />,
      label: "Dashboard",
    },
    {
      path: "/dashboard/cattle",
      icon: <FaCow className="text-lg" />,
      label: "Cattle",
    },
    {
      path: "/dashboard/milk-management",
      icon: <MdProductionQuantityLimits className="text-lg" />,
      label: "Milk",
    },
  ];

  // Admin links
  const adminLinks = [
    {
      path: "/admin",
      icon: <FaUserShield className="text-lg" />,
      label: "Admin Dashboard",
    },
    {
      path: "/admin/users",
      icon: <FaUser className="text-lg" />,
      label: "User Management",
    },
    {
      path: "/admin/settings",
      icon: <IoMdSettings className="text-lg" />,
      label: "Settings",
    },
  ];

  // Display links based on user role
  const navLinks = isAdmin ? adminLinks : regularLinks;

  return (
    <nav className="bg-white bg-opacity-95 backdrop-blur-sm sticky top-0 z-50 shadow-sm border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link
              to={isAdmin ? "/admin" : "/"}
              className="flex items-center space-x-2 group"
            >
              <div className="relative">
                <FaCow className="h-8 w-8 text-green-600 transition-transform group-hover:scale-110 duration-300" />
                <div className="absolute -inset-1 rounded-full bg-green-100 animate-ping opacity-0 group-hover:opacity-75 duration-1000"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
                {isAdmin ? "FarmFlow Admin" : "FarmFlow"}
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden md:ml-10 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center mx-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      location.pathname === link.path
                        ? "text-green-600 bg-green-50"
                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                    }`}
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Side Icons */}
          <div className="hidden md:flex items-center space-x-1">
            {/* User Dropdown */}
            {isAuthenticated ? (
              <>
                <button className="relative text-gray-600 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition-all duration-300">
                  <FaBell className="h-5 w-5" />
                  {hasNotifications && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </button>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center ml-2 space-x-2 text-gray-600 hover:text-green-600 px-3 py-1.5 rounded-full hover:bg-green-50 transition-all duration-300"
                  >
                    <div className="h-7 w-7 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                      {user?.name?.charAt(0) || (
                        <FaUser className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {user?.name || "User"}
                      {isAdmin && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          Admin
                        </span>
                      )}
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 transform origin-top-right transition-all duration-200 border border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Logged in as</p>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {user?.email || "user@farmflow.com"}
                        </p>
                      </div>
                      <Link
                        to={isAdmin ? "/admin/profile" : "/profile"}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 transition-all"
                      >
                        <FaUser className="mr-3 h-4 w-4 text-gray-500" />
                        <span>Your Profile</span>
                      </Link>

                      <Link
                        to={isAdmin ? "/admin/settings" : "/settings"}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 transition-all"
                      >
                        <IoMdSettings className="mr-3 h-4 w-4 text-gray-500" />
                        <span>Settings</span>
                      </Link>
                      <div className="border-t border-gray-100 mt-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all"
                      >
                        <BiLogOut className="mr-3 h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-x-2">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-green-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-50 transition-all border border-transparent hover:border-green-200"
                >
                  Log in
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition-all"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <FaTimes className="h-5 w-5" />
              ) : (
                <FaBars className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-100">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-3 py-2.5 rounded-md transition-all ${
                    location.pathname.includes(link.path)
                      ? "text-green-600 font-medium bg-green-50"
                      : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                  } block`}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 pb-1 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <div className="h-9 w-9 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                    {user?.name?.charAt(0) || <FaUser className="h-4 w-4" />}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.name || "User"}
                      {isAdmin && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "user@farmflow.com"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to={isAdmin ? "/admin/profile" : "/profile"}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-md"
                  >
                    <FaUser className="mr-3 h-4 w-4 text-gray-500" /> Profile
                  </Link>
                  <Link
                    to={isAdmin ? "/admin/settings" : "/settings"}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-md"
                  >
                    <IoMdSettings className="mr-3 h-4 w-4 text-gray-500" />{" "}
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <BiLogOut className="mr-3 h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
