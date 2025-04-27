/* eslint-disable react/prop-types */
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiEye,
  FiEdit2,
  FiHeart,
  FiBriefcase,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";
import { createPortal } from "react-dom";

const ActionPopup = ({
  isOpen,
  onClose,
  position,
  cattleId,
  onHealthStatusChange,
  onStatusChange,
  onDelete,
  currentHealthStatus = "healthy",
  currentStatus = "active",
}) => {
  const popupRef = useRef(null);

  useEffect(() => {
    // Handle clicks outside the popup
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    }

    // Only add listener if the popup is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Position calculation based on click position
  const style = {
    top: `${position.y + 10}px`,
    left: `${position.x - 250}px`, // Offset to align correctly
  };

  // Helper function for status button styling
  const getHealthStatusButtonStyle = (status) => {
    const isActive = currentHealthStatus === status;

    const baseClasses =
      "px-3 py-1.5 text-xs font-medium rounded relative flex items-center justify-center";

    switch (status) {
      case "healthy":
        return `${baseClasses} ${
          isActive
            ? "bg-green-200 text-green-800 border border-green-400"
            : "bg-green-50 text-green-700 hover:bg-green-100"
        }`;
      case "sick":
        return `${baseClasses} ${
          isActive
            ? "bg-red-200 text-red-800 border border-red-400"
            : "bg-red-50 text-red-700 hover:bg-red-100"
        }`;
      case "quarantined":
        return `${baseClasses} ${
          isActive
            ? "bg-purple-200 text-purple-800 border border-purple-400"
            : "bg-purple-50 text-purple-700 hover:bg-purple-100"
        }`;
      case "pregnant":
        return `${baseClasses} ${
          isActive
            ? "bg-yellow-200 text-yellow-800 border border-yellow-400"
            : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
        }`;
      default:
        return baseClasses;
    }
  };

  const getStatusButtonStyle = (status) => {
    const isActive = currentStatus === status;

    const baseClasses =
      "px-2 py-1.5 text-xs font-medium rounded relative flex items-center justify-center";

    switch (status) {
      case "active":
        return `${baseClasses} ${
          isActive
            ? "bg-green-200 text-green-800 border border-green-400"
            : "bg-green-50 text-green-700 hover:bg-green-100"
        }`;
      case "sold":
        return `${baseClasses} ${
          isActive
            ? "bg-blue-200 text-blue-800 border border-blue-400"
            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
        }`;
      case "deceased":
        return `${baseClasses} ${
          isActive
            ? "bg-gray-300 text-gray-800 border border-gray-400"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`;
      default:
        return baseClasses;
    }
  };

  // Create portal to render at the document body level (prevents z-index issues)
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-transparent"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={popupRef}
        className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 w-64 overflow-hidden animate-popup"
        style={style}
      >
        <div className="py-2">
          <Link
            to={`/dashboard/cattle/${cattleId}`}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            <FiEye className="mr-3 text-green-600" size={18} />
            View Details
          </Link>

          <Link
            to={`/dashboard/cattle/edit/${cattleId}`}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            <FiEdit2 className="mr-3 text-blue-600" size={18} />
            Edit
          </Link>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Health Status Section with current status highlighted */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center text-sm font-medium">
                <FiHeart className="mr-3 text-red-500" size={18} />
                Health Status
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => onHealthStatusChange("healthy")}
                className={getHealthStatusButtonStyle("healthy")}
              >
                {currentHealthStatus === "healthy" && (
                  <FiCheck size={12} className="absolute right-1.5 top-1.5" />
                )}
                Healthy
              </button>
              <button
                onClick={() => onHealthStatusChange("sick")}
                className={getHealthStatusButtonStyle("sick")}
              >
                {currentHealthStatus === "sick" && (
                  <FiCheck size={12} className="absolute right-1.5 top-1.5" />
                )}
                Sick
              </button>
              <button
                onClick={() => onHealthStatusChange("quarantined")}
                className={getHealthStatusButtonStyle("quarantined")}
              >
                {currentHealthStatus === "quarantined" && (
                  <FiCheck size={12} className="absolute right-1.5 top-1.5" />
                )}
                Quarantined
              </button>
              <button
                onClick={() => onHealthStatusChange("pregnant")}
                className={getHealthStatusButtonStyle("pregnant")}
              >
                {currentHealthStatus === "pregnant" && (
                  <FiCheck size={12} className="absolute right-1.5 top-1.5" />
                )}
                Pregnant
              </button>
            </div>
          </div>

          {/* Status Section with current status highlighted */}
          <div className="border-t border-gray-100 my-0"></div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center text-sm font-medium">
                <FiBriefcase className="mr-3 text-indigo-500" size={18} />
                Status
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => onStatusChange("active")}
                className={getStatusButtonStyle("active")}
              >
                {currentStatus === "active" && (
                  <FiCheck size={12} className="absolute right-1 top-1" />
                )}
                Active
              </button>
              <button
                onClick={() => onStatusChange("sold")}
                className={getStatusButtonStyle("sold")}
              >
                {currentStatus === "sold" && (
                  <FiCheck size={12} className="absolute right-1 top-1" />
                )}
                Sold
              </button>
              <button
                onClick={() => onStatusChange("deceased")}
                className={getStatusButtonStyle("deceased")}
              >
                {currentStatus === "deceased" && (
                  <FiCheck size={12} className="absolute right-1 top-1" />
                )}
                Deceased
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 my-1"></div>

          <button
            onClick={onDelete}
            className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="mr-3" size={18} />
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActionPopup;
