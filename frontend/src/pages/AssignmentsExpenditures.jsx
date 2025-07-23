import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  PackagePlus,
  PackageMinus,
  Calendar,
  Building,
  Box,
  User,
  CircleCheck,
  CircleX,
} from "lucide-react";

function AssignmentsExpenditures() {
  const { userRole, user } = useAuth();

  const [newAssignment, setNewAssignment] = useState({
    asset_id: "",
    assigned_to_user_id: "",
  });
  const [newExpenditure, setNewExpenditure] = useState({
    asset_id: "",
    quantity: 1,
    reason: "",
  });

  const [assets, setAssets] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);

  const [assignmentFilters, setAssignmentFilters] = useState({
    date: "",
    baseId: "",
    equipmentTypeId: "",
    assignedToUserId: "",
  });
  const [expenditureFilters, setExpenditureFilters] = useState({
    date: "",
    baseId: "",
    equipmentTypeId: "",
  });

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingExpenditures, setLoadingExpenditures] = useState(true);
  const [submitAssignmentLoading, setSubmitAssignmentLoading] = useState(false);
  const [submitExpenditureLoading, setSubmitExpenditureLoading] =
    useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [expenditureError, setExpenditureError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [expenditureSuccess, setExpenditureSuccess] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [assetsRes, basesRes, equipmentTypesRes, personnelRes] =
          await Promise.all([
            api.get("/assets"),
            api.get("/bases"),
            api.get("/equipment-types"),
            api.get("/users"),
          ]);
        setAssets(assetsRes.data);
        setBases(basesRes.data);
        setEquipmentTypes(equipmentTypesRes.data);
        setPersonnel(personnelRes.data.filter((p) => p.role !== "admin"));
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setAssignmentError("Failed to load initial data for forms.");
        setExpenditureError("Failed to load initial data for forms.");
      }
    };
    fetchInitialData();
  }, [userRole, user]);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadingAssignments(true);
      setAssignmentError("");
      try {
        const params = new URLSearchParams();
        if (assignmentFilters.date)
          params.append("date", assignmentFilters.date);
        if (assignmentFilters.baseId)
          params.append("baseId", assignmentFilters.baseId);
        if (assignmentFilters.equipmentTypeId)
          params.append("equipmentTypeId", assignmentFilters.equipmentTypeId);
        if (assignmentFilters.assignedToUserId)
          params.append("assignedToUserId", assignmentFilters.assignedToUserId);

        const response = await api.get(`/assignments?${params.toString()}`);
        setAssignments(response.data);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setAssignmentError(
          err.response?.data?.message ||
            "Failed to fetch historical assignments."
        );
        setAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [assignmentFilters, userRole, user]);

  useEffect(() => {
    const fetchExpenditures = async () => {
      setLoadingExpenditures(true);
      setExpenditureError("");
      try {
        const params = new URLSearchParams();
        if (expenditureFilters.date)
          params.append("date", expenditureFilters.date);
        if (expenditureFilters.baseId)
          params.append("baseId", expenditureFilters.baseId);
        if (expenditureFilters.equipmentTypeId)
          params.append("equipmentTypeId", expenditureFilters.equipmentTypeId);

        const response = await api.get(`/expenditures?${params.toString()}`);
        setExpenditures(response.data);
      } catch (err) {
        console.error("Error fetching expenditures:", err);
        setExpenditureError(
          err.response?.data?.message ||
            "Failed to fetch historical expenditures."
        );
        setExpenditures([]);
      } finally {
        setLoadingExpenditures(false);
      }
    };
    fetchExpenditures();
  }, [expenditureFilters, userRole, user]);

  const handleNewAssignmentChange = (e) => {
    const { name, value } = e.target;
    setNewAssignment((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecordAssignment = async (e) => {
    e.preventDefault();
    setAssignmentError("");
    setAssignmentSuccess("");
    setSubmitAssignmentLoading(true);

    try {
      const response = await api.post("/assignments", newAssignment);
      setAssignmentSuccess(response.data.message);
      setNewAssignment({ asset_id: "", assigned_to_user_id: "" }); // Reset form
      const params = new URLSearchParams();
      if (assignmentFilters.date) params.append("date", assignmentFilters.date);
      if (assignmentFilters.baseId)
        params.append("baseId", assignmentFilters.baseId);
      if (assignmentFilters.equipmentTypeId)
        params.append("equipmentTypeId", assignmentFilters.equipmentTypeId);
      if (assignmentFilters.assignedToUserId)
        params.append("assignedToUserId", assignmentFilters.assignedToUserId);
      const updatedAssignments = await api.get(
        `/assignments?${params.toString()}`
      );
      setAssignments(updatedAssignments.data);
    } catch (err) {
      console.error("Error recording assignment:", err);
      setAssignmentError(
        err.response?.data?.message || "Failed to record assignment."
      );
    } finally {
      setSubmitAssignmentLoading(false);
    }
  };

  const handleNewExpenditureChange = (e) => {
    const { name, value } = e.target;
    setNewExpenditure((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecordExpenditure = async (e) => {
    e.preventDefault();
    setExpenditureError("");
    setExpenditureSuccess("");
    setSubmitExpenditureLoading(true);

    try {
      const payload = {
        ...newExpenditure,
        quantity: parseInt(newExpenditure.quantity),
      };

      const response = await api.post("/expenditures", payload);
      setExpenditureSuccess(response.data.message);
      setNewExpenditure({ asset_id: "", quantity: 1, reason: "" }); // Reset form
      const params = new URLSearchParams();
      if (expenditureFilters.date)
        params.append("date", expenditureFilters.date);
      if (expenditureFilters.baseId)
        params.append("baseId", expenditureFilters.baseId);
      if (expenditureFilters.equipmentTypeId)
        params.append("equipmentTypeId", expenditureFilters.equipmentTypeId);
      const updatedExpenditures = await api.get(
        `/expenditures?${params.toString()}`
      );
      setExpenditures(updatedExpenditures.data);
    } catch (err) {
      console.error("Error recording expenditure:", err);
      setExpenditureError(
        err.response?.data?.message || "Failed to record expenditure."
      );
    } finally {
      setSubmitExpenditureLoading(false);
    }
  };

  const handleAssignmentFilterChange = (e) => {
    const { name, value } = e.target;
    setAssignmentFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExpenditureFilterChange = (e) => {
    const { name, value } = e.target;
    setExpenditureFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Users className="mr-3 h-8 w-8 text-primary-600" /> Assignments &
        Expenditures
      </h2>

      <div className="mb-10 p-6 bg-primary-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <PackagePlus className="mr-2 h-6 w-6 text-primary-600" /> Record New
          Assignment
        </h3>
        {assignmentError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{assignmentError}</span>
          </div>
        )}
        {assignmentSuccess && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{assignmentSuccess}</span>
          </div>
        )}
        <form
          onSubmit={handleRecordAssignment}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div>
            <label
              htmlFor="assign_asset_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Asset (Serial Number)
            </label>
            <select
              id="assign_asset_id"
              name="asset_id"
              value={newAssignment.asset_id}
              onChange={handleNewAssignmentChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitAssignmentLoading}
            >
              <option value="">Select an Asset</option>
              {assets
                .filter((asset) => asset.status === "available")
                .map((asset) => (
                  <option key={asset.asset_id} value={asset.asset_id}>
                    {asset.serial_number} ({asset.equipment_type}) -{" "}
                    {asset.current_base}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="assigned_to_user_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Assign To Personnel
            </label>
            <select
              id="assigned_to_user_id"
              name="assigned_to_user_id"
              value={newAssignment.assigned_to_user_id}
              onChange={handleNewAssignmentChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitAssignmentLoading}
            >
              <option value="">Select Personnel</option>
              {personnel.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.username} ({p.role})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              disabled={submitAssignmentLoading}
            >
              {submitAssignmentLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white mr-2"
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
              ) : (
                <PackagePlus className="mr-2 h-5 w-5" />
              )}
              Record Assignment
            </button>
          </div>
        </form>
      </div>

      {/* Record New Expenditure Section */}
      <div className="mb-10 p-6 bg-red-50 rounded-lg shadow-inner border border-red-200">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <PackageMinus className="mr-2 h-6 w-6 text-red-600" /> Record New
          Expenditure
        </h3>
        {expenditureError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{expenditureError}</span>
          </div>
        )}
        {expenditureSuccess && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{expenditureSuccess}</span>
          </div>
        )}
        <form
          onSubmit={handleRecordExpenditure}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div>
            <label
              htmlFor="expend_asset_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Asset (Serial Number)
            </label>
            <select
              id="expend_asset_id"
              name="asset_id"
              value={newExpenditure.asset_id}
              onChange={handleNewExpenditureChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitExpenditureLoading}
            >
              <option value="">Select an Asset</option>
              {assets
                .filter((asset) => asset.status !== "expended")
                .map((asset) => (
                  <option key={asset.asset_id} value={asset.asset_id}>
                    {asset.serial_number} ({asset.equipment_type}) -{" "}
                    {asset.current_base}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="expend_quantity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Quantity
            </label>
            <input
              type="number"
              id="expend_quantity"
              name="quantity"
              value={newExpenditure.quantity}
              onChange={handleNewExpenditureChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              min="1"
              required
              disabled={submitExpenditureLoading}
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reason for Expenditure
            </label>
            <textarea
              id="reason"
              name="reason"
              value={newExpenditure.reason}
              onChange={handleNewExpenditureChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              disabled={submitExpenditureLoading}
            ></textarea>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              disabled={submitExpenditureLoading}
            >
              {submitExpenditureLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white mr-2"
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
              ) : (
                <PackageMinus className="mr-2 h-5 w-5" />
              )}
              Record Expenditure
            </button>
          </div>
        </form>
      </div>

      {/* Historical Assignments Section */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <Users className="mr-2 h-6 w-6 text-gray-600" /> Historical Assignments
      </h3>

      {/* Filters for historical assignments */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
        <div className="flex items-center space-x-2">
          <Calendar className="text-gray-500" size={20} />
          <input
            type="date"
            name="date"
            value={assignmentFilters.date}
            onChange={handleAssignmentFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {(userRole === "admin" || userRole === "logistics_officer") && (
          <div className="flex items-center space-x-2">
            <Building className="text-gray-500" size={20} />
            <select
              name="baseId"
              value={assignmentFilters.baseId}
              onChange={handleAssignmentFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Bases</option>
              {bases.map((base) => (
                <option key={base.base_id} value={base.base_id}>
                  {base.base_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Box className="text-gray-500" size={20} />
          <select
            name="equipmentTypeId"
            value={assignmentFilters.equipmentTypeId}
            onChange={handleAssignmentFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Equipment Types</option>
            {equipmentTypes.map((type) => (
              <option
                key={type.equipment_type_id}
                value={type.equipment_type_id}
              >
                {type.type_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <User className="text-gray-500" size={20} />
          <select
            name="assignedToUserId"
            value={assignmentFilters.assignedToUserId}
            onChange={handleAssignmentFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Personnel</option>
            {personnel.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingAssignments ? (
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
          <span className="ml-3 text-lg text-gray-700">
            Loading assignments...
          </span>
        </div>
      ) : assignmentError ? (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{assignmentError}</span>
        </div>
      ) : assignments.length === 0 ? (
        <p className="text-gray-600">
          No assignments found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 mb-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset Serial #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment.assignment_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(assignment.assigned_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.asset_serial_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.equipment_type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.current_base_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.assigned_to_username || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assignment.assigned_by_username || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        assignment.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : assignment.status === "returned"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Historical Expenditures Section */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <PackageMinus className="mr-2 h-6 w-6 text-gray-600" /> Historical
        Expenditures
      </h3>

      {/* Filters for historical expenditures */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
        <div className="flex items-center space-x-2">
          <Calendar className="text-gray-500" size={20} />
          <input
            type="date"
            name="date"
            value={expenditureFilters.date}
            onChange={handleExpenditureFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {(userRole === "admin" || userRole === "logistics_officer") && (
          <div className="flex items-center space-x-2">
            <Building className="text-gray-500" size={20} />
            <select
              name="baseId"
              value={expenditureFilters.baseId}
              onChange={handleExpenditureFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Bases</option>
              {bases.map((base) => (
                <option key={base.base_id} value={base.base_id}>
                  {base.base_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Box className="text-gray-500" size={20} />
          <select
            name="equipmentTypeId"
            value={expenditureFilters.equipmentTypeId}
            onChange={handleExpenditureFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Equipment Types</option>
            {equipmentTypes.map((type) => (
              <option
                key={type.equipment_type_id}
                value={type.equipment_type_id}
              >
                {type.type_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingExpenditures ? (
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
          <span className="ml-3 text-lg text-gray-700">
            Loading expenditures...
          </span>
        </div>
      ) : expenditureError ? (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{expenditureError}</span>
        </div>
      ) : expenditures.length === 0 ? (
        <p className="text-gray-600">
          No expenditures found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenditure Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset Serial #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expended By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenditures.map((expenditure) => (
                <tr
                  key={expenditure.expenditure_id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(
                      expenditure.expenditure_date
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expenditure.asset_serial_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expenditure.equipment_type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expenditure.base_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expenditure.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expenditure.reason || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expenditure.expended_by_username || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AssignmentsExpenditures;
