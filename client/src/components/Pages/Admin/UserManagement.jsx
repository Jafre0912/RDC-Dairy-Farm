import { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaCheck, FaTimes, FaUserCog, FaList, FaSearch, FaFilter, FaUserPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Form fields for editing
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");

  // Form fields for adding new user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        withCredentials: true,
      });
      setUsers(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to fetch users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (user) => {
    setEditingUser(user._id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUser(null);
  };

  const saveUser = async (userId) => {
    try {
      await axios.put(
        `${API_URL}/admin/users/${userId}`,
        {
          name: editName,
          email: editEmail,
          role: editRole,
        },
        { withCredentials: true }
      );
      
      // Update the local state
      setUsers(
        users.map((user) =>
          user._id === userId
            ? { ...user, name: editName, email: editEmail, role: editRole }
            : user
        )
      );
      
      setEditingUser(null);
      toast.success("User updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        withCredentials: true,
      });
      
      // Remove user from local state
      setUsers(users.filter((user) => user._id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/admin/users/${userId}/status`,
        {
          active: !currentStatus,
        },
        { withCredentials: true }
      );
      
      // Update the local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, active: !currentStatus } : user
        )
      );
      
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole
        },
        { withCredentials: true }
      );
      
      // Add new user to the local state
      setUsers([response.data.data, ...users]);
      
      // Reset form and close modal
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      setShowAddUserModal(false);
      
      toast.success("User added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add user");
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(
    (user) =>
      (filterRole === "" || user.role === filterRole) &&
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Add User button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-800 flex items-center">
            <FaUserCog className="mr-2 text-amber-600" /> FarmFlow User Management
          </h1>
          <p className="text-amber-700">Manage system users, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center shadow-sm transition-colors"
        >
          <FaUserPlus className="mr-2" />
          Add New User
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-amber-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-amber-400" />
              </div>
              <select
                className="w-full md:w-48 pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="farmer">Farmer</option>
                <option value="manager">Manager</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <button 
              onClick={fetchUsers}
              className="w-full md:w-auto px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-100">
              <thead className="bg-amber-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-amber-700 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-amber-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-amber-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user._id ? (
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user._id ? (
                          <input
                            type="email"
                            className="w-full px-2 py-1 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-gray-500">{user.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user._id ? (
                          <select
                            className="w-full px-2 py-1 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="farmer">Farmer</option>
                            <option value="manager">Manager</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : user.role === 'farmer' 
                              ? 'bg-amber-100 text-amber-800' 
                              : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          {editingUser === user._id ? (
                            <>
                              <button
                                onClick={() => saveUser(user._id)}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Save changes"
                              >
                                <FaCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Cancel editing"
                              >
                                <FaTimes className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(user)}
                                className="p-1 text-amber-600 hover:text-amber-800"
                                title="Edit user"
                              >
                                <FaEdit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteUser(user._id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete user"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleUserStatus(user._id, user.active)}
                                className={`p-1 ${
                                  user.active
                                    ? "text-red-600 hover:text-red-800"
                                    : "text-green-600 hover:text-green-800"
                                }`}
                                title={user.active ? "Deactivate user" : "Activate user"}
                              >
                                {user.active ? <FaTimes className="h-4 w-4" /> : <FaCheck className="h-4 w-4" />}
                              </button>
                              {user.role === 'farmer' && (
                                <Link
                                  to={`/admin/farmers/${user._id}/milk-transactions`}
                                  className="p-1 text-amber-600 hover:text-amber-800"
                                  title="View milk transactions"
                                >
                                  <FaList className="h-4 w-4" />
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-amber-800">Add New User</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-amber-400 hover:text-amber-500 focus:outline-none"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-amber-700">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-amber-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-amber-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-amber-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-amber-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="mt-1 block w-full px-3 py-2 border border-amber-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-amber-700">
                    Role
                  </label>
                  <select
                    id="role"
                    className="mt-1 block w-full px-3 py-2 border border-amber-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="farmer">Farmer</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 border border-amber-300 rounded-lg text-amber-700 bg-white hover:bg-amber-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    Add User
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 