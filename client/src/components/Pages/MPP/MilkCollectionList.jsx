import { useState } from "react";
import { format } from "date-fns";
import { FiEdit, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import useMPPStore from "../../../store/mppStore";
import { toast } from "react-hot-toast";

const MilkCollectionList = ({ collections, onEdit }) => {
  const { deleteMilkCollection } = useMPPStore();
  const [expandedRow, setExpandedRow] = useState(null);

  // Format date for display
  const formatDate = (dateString) => {
    return format(new Date(dateString), "dd MMM yyyy");
  };

  // Format shift for display
  const formatShift = (shift) => {
    return shift.charAt(0).toUpperCase() + shift.slice(1);
  };

  // Format milk type for display
  const formatMilkType = (type) => {
    const types = {
      C: "Cow",
      B: "Buffalo",
      M: "Mixed",
    };
    return types[type] || type;
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteMilkCollection(id);
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // If no collections
  if (!collections || collections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <p className="text-gray-500">No milk collection records found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Shift
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Fat %
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                SNF %
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rate
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Total
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {collections.map((collection) => (
              <tr
                key={collection._id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleRowExpansion(collection._id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(collection.collectionDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatShift(collection.shift)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatMilkType(collection.milkType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {collection.fat.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {collection.snf.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{collection.rate.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {collection.quantity.toFixed(1)} L
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{collection.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(collection._id);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(collection._id);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                    {expandedRow === collection._id ? (
                      <FiChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <FiChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MilkCollectionList;
