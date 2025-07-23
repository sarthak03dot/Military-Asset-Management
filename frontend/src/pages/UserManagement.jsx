import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  CircleCheck,
  CircleX,
  UserPlus,
} from "lucide-react";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "logistics_officer", // Default role
    base_id: "",
  });
  const [editingUser, setEditingUser] = useState(null); // Stores user object being edited
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    role: "",
    base_id: "",
    password: "", 
  });

  useEffect(() => {
    fetchUsersAndBases();
  }, []);

  const fetchUsersAndBases = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, basesRes] = await Promise.all([
        api.get("/users"),
        api.get("/bases"),
      ]);
      setUsers(usersRes.data);
      setBases(basesRes.data);
    } catch (err) {
      console.error("Error fetching users or bases:", err);
      setError(
        err.response?.data?.message || "Failed to fetch users or bases."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post("/users", newUser);
      setSuccessMessage(response.data.message);
      setNewUser({
        // Reset form
        username: "",
        email: "",
        password: "",
        role: "logistics_officer",
        base_id: "",
      });
      fetchUsersAndBases(); // Refresh the list
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.response?.data?.message || "Failed to create user.");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      base_id: user.base_id || "", // Handle null base_id
      password: "", 
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      const payload = { ...editFormData };
      if (!payload.password) {
        delete payload.password;
      }

      const response = await api.put(`/users/${editingUser.user_id}`, payload);
      setSuccessMessage(response.data.message);
      setEditingUser(null); // Exit edit mode
      fetchUsersAndBases(); // Refresh the list
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.message || "Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${username}"? This action cannot be undone.`
      )
    ) {
      setError("");
      setSuccessMessage("");
      try {
        const response = await api.delete(`/users/${userId}`);
        setSuccessMessage(response.data.message);
        fetchUsersAndBases(); // Refresh the list
      } catch (err) {
        console.error("Error deleting user:", err);
        setError(err.response?.data?.message || "Failed to delete user.");
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Users className="mr-3 h-8 w-8 text-primary-600" /> User Management
      </h2>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="mb-8 p-6 bg-primary-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <UserPlus className="mr-2 h-6 w-6 text-primary-600" /> Create New User
        </h3>
        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div>
            <label
              htmlFor="new_username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              type="text"
              id="new_username"
              name="username"
              value={newUser.username}
              onChange={handleNewUserChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="new_email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="new_email"
              name="email"
              value={newUser.email}
              onChange={handleNewUserChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="new_password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="new_password"
              name="password"
              value={newUser.password}
              onChange={handleNewUserChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="new_role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="new_role"
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="logistics_officer">Logistics Officer</option>
              <option value="base_commander">Base Commander</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {newUser.role === "base_commander" && (
            <div>
              <label
                htmlFor="new_base_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assigned Base
              </label>
              <select
                id="new_base_id"
                name="base_id"
                value={newUser.base_id}
                onChange={handleNewUserChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required={newUser.role === "base_commander"}
              >
                <option value="">Select Base</option>
                {bases.map((base) => (
                  <option key={base.base_id} value={base.base_id}>
                    {base.base_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create User
            </button>
          </div>
        </form>
      </div>

      {/* User List Section */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <Users className="mr-2 h-6 w-6 text-gray-600" /> Existing Users
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <svg
            className="animate-spin h-8 w-8 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-lg text-gray-700">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-600">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {user.role.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.base_id
                      ? bases.find((b) => b.base_id === user.base_id)
                          ?.base_name || "N/A"
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-primary-600 hover:text-primary-900 mr-3 p-1 rounded-md hover:bg-primary-100 transition-colors"
                      title="Edit User"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteUser(user.user_id, user.username)
                      }
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-100 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={() => setEditingUser(null)}
            >
              <XIcon className="h-6 w-6" />
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Edit User: {editingUser.username}
            </h3>
            <form
              onSubmit={handleUpdateUser}
              className="grid grid-cols-1 gap-5"
            >
              <div>
                <label
                  htmlFor="edit_username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="edit_username"
                  name="username"
                  value={editFormData.username}
                  onChange={handleEditFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit_email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="edit_email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="edit_role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role
                </label>
                <select
                  id="edit_role"
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="logistics_officer">Logistics Officer</option>
                  <option value="base_commander">Base Commander</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editFormData.role === "base_commander" && (
                <div>
                  <label
                    htmlFor="edit_base_id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Assigned Base
                  </label>
                  <select
                    id="edit_base_id"
                    name="base_id"
                    value={editFormData.base_id}
                    onChange={handleEditFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required={editFormData.role === "base_commander"}
                  >
                    <option value="">Select Base</option>
                    {bases.map((base) => (
                      <option key={base.base_id} value={base.base_id}>
                        {base.base_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label
                  htmlFor="edit_password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password (optional)
                </label>
                <input
                  type="password"
                  id="edit_password"
                  name="password"
                  value={editFormData.password}
                  onChange={handleEditFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <CircleCheck className="mr-2 h-4 w-4" />
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
