import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Truck,
  ArrowRightCircle,
  Calendar,
  Building,
  Box,
  CircleCheck,
  CircleX,
} from 'lucide-react';

function Transfers() {
  const { userRole, user } = useAuth();
  const [newTransfer, setNewTransfer] = useState({
    asset_id: '',
    from_base_id: '',
    to_base_id: '',
    quantity: 1,
  });
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({
    date: '',
    fromBaseId: '',
    toBaseId: '',
    equipmentTypeId: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [assetsRes, basesRes, equipmentTypesRes] = await Promise.all([
          api.get('/assets'), // Fetch all assets
          api.get('/bases'),
          api.get('/equipment-types'),
        ]);
        setAssets(assetsRes.data);
        setBases(basesRes.data);
        setEquipmentTypes(equipmentTypesRes.data);

        if ((userRole === 'base_commander' || userRole === 'logistics_officer') && user?.base_id) {
          setNewTransfer((prev) => ({ ...prev, from_base_id: user.base_id }));
          setFilters((prev) => ({ ...prev, fromBaseId: user.base_id }));
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data for transfer form.');
      }
    };
    fetchInitialData();
  }, [userRole, user]);

  useEffect(() => {
    const fetchTransfers = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.fromBaseId) params.append('fromBaseId', filters.fromBaseId);
        if (filters.toBaseId) params.append('toBaseId', filters.toBaseId);
        if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);

        const response = await api.get(`/transfers?${params.toString()}`);
        setTransfers(response.data);
      } catch (err) {
        console.error('Error fetching transfers:', err);
        setError(err.response?.data?.message || 'Failed to fetch historical transfers.');
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, [filters, userRole, user]);
  const handleNewTransferChange = (e) => {
    const { name, value } = e.target;
    setNewTransfer((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecordTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitLoading(true);

    if (newTransfer.from_base_id === newTransfer.to_base_id) {
      setError('Cannot transfer an asset to the same base.');
      setSubmitLoading(false);
      return;
    }

    try {
      const payload = {
        ...newTransfer,
        quantity: parseInt(newTransfer.quantity),
      };

      const response = await api.post('/transfers', payload);
      setSuccessMessage(response.data.message);
      setNewTransfer({ // Reset form
        asset_id: '',
        from_base_id: (userRole === 'base_commander' || userRole === 'logistics_officer') && user?.base_id ? user.base_id : '',
        to_base_id: '',
        quantity: 1,
      });
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.fromBaseId) params.append('fromBaseId', filters.fromBaseId);
      if (filters.toBaseId) params.append('toBaseId', filters.toBaseId);
      if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);
      const updatedTransfers = await api.get(`/transfers?${params.toString()}`);
      setTransfers(updatedTransfers.data);
    } catch (err) {
      console.error('Error recording transfer:', err);
      setError(err.response?.data?.message || 'Failed to record transfer.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isFromBaseSelectDisabled = (userRole === 'base_commander' || userRole === 'logistics_officer') && user?.base_id;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Truck className="mr-3 h-8 w-8 text-primary-600" /> Asset Transfers
      </h2>

      <div className="mb-8 p-6 bg-primary-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <ArrowRightCircle className="mr-2 h-6 w-6 text-primary-600" /> Record New Transfer
        </h3>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        <form onSubmit={handleRecordTransfer} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="asset_id" className="block text-sm font-medium text-gray-700 mb-1">
              Asset (Serial Number)
            </label>
            <select
              id="asset_id"
              name="asset_id"
              value={newTransfer.asset_id}
              onChange={handleNewTransferChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitLoading}
            >
              <option value="">Select an Asset</option>
              {assets.map((asset) => (
                <option key={asset.asset_id} value={asset.asset_id}>
                  {asset.serial_number} ({asset.equipment_type}) - {asset.current_base}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="from_base_id" className="block text-sm font-medium text-gray-700 mb-1">
              From Base
            </label>
            <select
              id="from_base_id"
              name="from_base_id"
              value={newTransfer.from_base_id}
              onChange={handleNewTransferChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitLoading || isFromBaseSelectDisabled}
            >
              <option value="">Select Base</option>
              {bases.map((base) => (
                <option key={base.base_id} value={base.base_id}>
                  {base.base_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="to_base_id" className="block text-sm font-medium text-gray-700 mb-1">
              To Base
            </label>
            <select
              id="to_base_id"
              name="to_base_id"
              value={newTransfer.to_base_id}
              onChange={handleNewTransferChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitLoading}
            >
              <option value="">Select Base</option>
              {bases.map((base) => (
                <option key={base.base_id} value={base.base_id}>
                  {base.base_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={newTransfer.quantity}
              onChange={handleNewTransferChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              min="1"
              required
              disabled={submitLoading}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <ArrowRightCircle className="mr-2 h-5 w-5" />
              )}
              Record Transfer
            </button>
          </div>
        </form>
      </div>

      {/* Historical Transfers Section */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <Truck className="mr-2 h-6 w-6 text-gray-600" /> Historical Transfers
      </h3>

      {/* Filters for historical transfers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
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
        <div className="flex items-center space-x-2">
          <Building className="text-gray-500" size={20} />
          <select
            name="fromBaseId"
            value={filters.fromBaseId}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">From Any Base</option>
            {bases.map((base) => (
              <option key={base.base_id} value={base.base_id}>
                {base.base_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Building className="text-gray-500" size={20} />
          <select
            name="toBaseId"
            value={filters.toBaseId}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">To Any Base</option>
            {bases.map((base) => (
              <option key={base.base_id} value={base.base_id}>
                {base.base_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Box className="text-gray-500" size={20} />
          <select
            name="equipmentTypeId"
            value={filters.equipmentTypeId}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
          <span className="ml-3 text-lg text-gray-700">Loading transfers...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : transfers.length === 0 ? (
        <p className="text-gray-600">No transfers found for the selected filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Serial #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer.transfer_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transfer.transfer_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.asset_serial_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.equipment_type_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.from_base_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.to_base_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transfer.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.transferred_by_username || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transfers;
