import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  PackageCheck,
  PackageX,
  Calendar,
  Building,
  Box,
  Info,
  X as XIcon,
} from 'lucide-react';

function Dashboard() {
  const { userRole, user } = useAuth();
  const [metrics, setMetrics] = useState({
    total_opening_balance: 0,
    total_closing_balance: 0,
    total_net_movement: 0,
    total_assigned: 0,
    total_expended: 0,
  });
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today
    baseId: '',
    equipmentTypeId: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNetMovementDetails, setShowNetMovementDetails] = useState(false);
  const [netMovementDetails, setNetMovementDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [basesRes, equipmentTypesRes] = await Promise.all([
          api.get('/bases'),
          api.get('/equipment-types'),
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(equipmentTypesRes.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data (bases, equipment types).');
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.baseId) params.append('baseId', filters.baseId);
        if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);

        const response = await api.get(`/dashboard/metrics?${params.toString()}`);
        setMetrics(response.data);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError(err.response?.data?.message || 'Failed to fetch dashboard metrics.');
        setMetrics({ // Reset metrics on error
          total_opening_balance: 0,
          total_closing_balance: 0,
          total_net_movement: 0,
          total_assigned: 0,
          total_expended: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [filters, userRole, user]); // Re-fetch when filters or user role changes

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleNetMovementClick = async () => {
    setDetailsLoading(true);
    setDetailsError('');
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);

      const response = await api.get(`/dashboard/net-movement-details?${params.toString()}`);
      setNetMovementDetails(response.data);
      setShowNetMovementDetails(true);
    } catch (err) {
      console.error('Error fetching net movement details:', err);
      setDetailsError(err.response?.data?.message || 'Failed to fetch net movement details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg shadow-inner">
        <div className="flex items-center space-x-2">
          <Calendar className="text-gray-500" size={20} />
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {(userRole === 'admin' || userRole === 'logistics_officer') && (
          <div className="flex items-center space-x-2">
            <Building className="text-gray-500" size={20} />
            <select
              name="baseId"
              value={filters.baseId}
              onChange={handleFilterChange}
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
            value={filters.equipmentTypeId}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 focus:ring-primary-500 focus:border-primary-500 rounded-md"
          >
            <option value="">All Equipment Types</option>
            {equipmentTypes.map((type) => (
              <option key={type.equipment_type_id} value={type.equipment_type_id}>
                {type.type_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-lg text-gray-700">Loading metrics...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Metric Card: Opening Balance */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center transition-transform duration-200 hover:scale-105">
            <DollarSign className="h-10 w-10 text-primary-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">Opening Balance</h3>
            <p className="text-4xl font-bold text-gray-900">{metrics.total_opening_balance}</p>
          </div>

          {/* Metric Card: Closing Balance */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center transition-transform duration-200 hover:scale-105">
            <DollarSign className="h-10 w-10 text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">Closing Balance</h3>
            <p className="text-4xl font-bold text-gray-900">{metrics.total_closing_balance}</p>
          </div>

          {/* Metric Card: Net Movement */}
          <div
            className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:bg-primary-50"
            onClick={handleNetMovementClick}
          >
            <Info className="h-10 w-10 text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">Net Movement</h3>
            <p className={`text-4xl font-bold ${metrics.total_net_movement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.total_net_movement}
            </p>
            <span className="text-sm text-gray-500 mt-2">Click for details</span>
          </div>

          {/* Metric Card: Assigned Assets */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center transition-transform duration-200 hover:scale-105">
            <PackageCheck className="h-10 w-10 text-purple-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">Assigned Assets</h3>
            <p className="text-4xl font-bold text-gray-900">{metrics.total_assigned}</p>
          </div>

          {/* Metric Card: Expended Assets */}
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center transition-transform duration-200 hover:scale-105">
            <PackageX className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">Expended Assets</h3>
            <p className="text-4xl font-bold text-gray-900">{metrics.total_expended}</p>
          </div>
        </div>
      )}

      {/* Net Movement Details Modal */}
      {showNetMovementDetails && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={() => setShowNetMovementDetails(false)}
            >
              <XIcon className="h-6 w-6" />
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Net Movement Details</h3>

            {detailsLoading ? (
              <div className="flex items-center justify-center h-32">
                <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-700">Loading details...</span>
              </div>
            ) : detailsError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <span className="block sm:inline">{detailsError}</span>
              </div>
            ) : netMovementDetails.length === 0 ? (
              <p className="text-gray-600">No detailed net movement data available for the selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfers In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfers Out</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {netMovementDetails.map((detail, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(detail.balance_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.base_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.equipment_type_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.purchases}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.transfers_in}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detail.transfers_out}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
