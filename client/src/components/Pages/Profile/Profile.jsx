import { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaUserTie,
  FaPhone,
  FaSpinner,
} from "react-icons/fa";
import useAuthStore from "../../../store/authStore";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const { user } = useAuthStore();

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "",
    phoneNumber: "",
  });

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Replace with actual API call
        const data = {
          name: user?.name || "John Doe",
          email: user?.email || "john.doe@example.com",
          role: user?.role || "Farm Manager",
          phoneNumber: user?.phoneNumber || "(555) 123-4567",
        };
        setProfileData(data);
      } catch (error) {
        setMessage({
          type: "error",
          text: "Failed to load profile data",
          error,
        });
      }
    };

    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Add actual API call here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile", error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-green-800">
            Profile Settings
          </h2>
          {message.text && (
            <div
              className={`px-4 py-2 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="form-group">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="form-group">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Input */}
          <div className="form-group">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUserTie className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="role"
                name="role"
                value={profileData.role}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="form-group">
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleInputChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg 
                       hover:bg-green-700 focus:outline-none focus:ring-2 
                       focus:ring-green-500 focus:ring-offset-2 
                       transition-colors duration-200
                       disabled:bg-green-400 disabled:cursor-not-allowed
                       flex items-center space-x-2"
            >
              {loading && <FaSpinner className="animate-spin" />}
              <span>{loading ? "Updating..." : "Update Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
