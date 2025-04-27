import { useState } from "react";
import { toast } from "react-hot-toast";
import { FaCog, FaDatabase, FaUserShield, FaEnvelope } from "react-icons/fa";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    enableNotifications: true,
    notifyOnNewUser: true,
    notifyOnCriticalError: true,
  });
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
  });

  const handleEmailSettingsChange = (e) => {
    const { name, checked } = e.target;
    setEmailSettings({
      ...emailSettings,
      [name]: checked,
    });
  };

  const handleBackupSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBackupSettings({
      ...backupSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveSettings = async (settingType) => {
    setLoading(true);
    try {
      const data = settingType === "email" ? emailSettings : backupSettings;
      
      await axios.post(
        `${API_URL}/admin/settings/${settingType}`,
        data,
        { withCredentials: true }
      );
      
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseBackup = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/admin/backup/create`,
        {},
        { withCredentials: true }
      );
      
      toast.success("Backup created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create backup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        <FaCog className="mr-2 text-green-600" /> Admin Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Notification Settings */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4 flex items-center">
            <FaEnvelope className="mr-2 text-blue-500" /> Email Notifications
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Enable Notifications</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableNotifications"
                  className="sr-only peer"
                  checked={emailSettings.enableNotifications}
                  onChange={handleEmailSettingsChange}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Notify on New User Registration</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyOnNewUser"
                  className="sr-only peer"
                  checked={emailSettings.notifyOnNewUser}
                  onChange={handleEmailSettingsChange}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Notify on Critical Errors</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyOnCriticalError"
                  className="sr-only peer"
                  checked={emailSettings.notifyOnCriticalError}
                  onChange={handleEmailSettingsChange}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => saveSettings("email")}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Email Settings"}
            </button>
          </div>
        </div>

        {/* Database Backup Settings */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4 flex items-center">
            <FaDatabase className="mr-2 text-purple-500" /> Database Backup
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-gray-700">Automatic Backups</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="autoBackup"
                  className="sr-only peer"
                  checked={backupSettings.autoBackup}
                  onChange={handleBackupSettingsChange}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block mb-2 text-gray-700">Backup Frequency</label>
              <select
                name="backupFrequency"
                value={backupSettings.backupFrequency}
                onChange={handleBackupSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!backupSettings.autoBackup}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => saveSettings("backup")}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Backup Settings"}
            </button>
            
            <button
              onClick={runDatabaseBackup}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Run Backup Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="mt-8 border rounded-lg p-6">
        <h2 className="text-xl font-medium mb-4 flex items-center">
          <FaUserShield className="mr-2 text-red-500" /> Security Settings
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            <p>
              Security settings are managed through the server configuration.
              Please contact your system administrator for changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 