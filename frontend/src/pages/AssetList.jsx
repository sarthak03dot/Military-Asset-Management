import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Package, Search } from "lucide-react";

function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/assets");
        setAssets(response.data);
      } catch (err) {
        console.error("Error fetching assets:", err);
        setError(err.response?.data?.message || "Failed to fetch assets.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.current_base.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Package className="mr-3 h-8 w-8 text-primary-600" /> All Assets
      </h2>

      <div className="mb-6 flex items-center space-x-3 p-4 bg-gray-50 rounded-lg shadow-inner">
        <Search className="text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by serial #, type, or base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

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
          <span className="ml-3 text-lg text-gray-700">Loading assets...</span>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <p className="text-gray-600">
          No assets found matching your search criteria.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => (
                <tr key={asset.asset_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.serial_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.equipment_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.model || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.manufacturer || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.current_base}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asset.status === "available"
                          ? "bg-green-100 text-green-800"
                          : asset.status === "assigned"
                          ? "bg-blue-100 text-blue-800"
                          : asset.status === "expended"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/assets/${asset.asset_id}`}
                      className="text-primary-600 hover:text-primary-900 mr-3 p-1 bg-blue-200 rounded-md hover:bg-blue-400 transition-colors"
                      title="View Details"
                    >
                      View Details
                    </Link>
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

export default AssetList;
