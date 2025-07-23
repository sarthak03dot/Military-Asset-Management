import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingCart,
  PlusCircle,
  Calendar,
  Building,
  Box,
  CircleCheck,
  CircleX,
} from 'lucide-react';

function Purchases() {
  const { userRole, user } = useAuth();
  const [newPurchase, setNewPurchase] = useState({
    asset_id: '',
    base_id: '',
    quantity: 1,
    unit_cost: '',
    total_cost: '',
  });
  const [purchases, setPurchases] = useState([]);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({
    date: '',
    baseId: '',
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

        if (userRole === 'logistics_officer' && user?.base_id) {
          setNewPurchase((prev) => ({ ...prev, base_id: user.base_id }));
          setFilters((prev) => ({ ...prev, baseId: user.base_id }));
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data for purchase form.');
      }
    };
    fetchInitialData();
  }, [userRole, user]);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.baseId) params.append('baseId', filters.baseId);
        if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);

        const response = await api.get(`/purchases?${params.toString()}`);
        setPurchases(response.data);
      } catch (err) {
        console.error('Error fetching purchases:', err);
        setError(err.response?.data?.message || 'Failed to fetch historical purchases.');
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, [filters, userRole, user]); 

  const handleNewPurchaseChange = (e) => {
    const { name, value } = e.target;
    setNewPurchase((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'unit_cost' || name === 'quantity') {
        const unitCost = parseFloat(updated.unit_cost);
        const quantity = parseInt(updated.quantity);
        if (!isNaN(unitCost) && !isNaN(quantity) && quantity > 0) {
          updated.total_cost = (unitCost * quantity).toFixed(2);
        } else {
          updated.total_cost = '';
        }
      }
      return updated;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitLoading(true);

    try {
      const payload = {
        ...newPurchase,
        quantity: parseInt(newPurchase.quantity),
        unit_cost: parseFloat(newPurchase.unit_cost),
        total_cost: parseFloat(newPurchase.total_cost),
      };

      const response = await api.post('/purchases', payload);
      setSuccessMessage(response.data.message);
      setNewPurchase({ // Reset form
        asset_id: '',
        base_id: userRole === 'logistics_officer' && user?.base_id ? user.base_id : '',
        quantity: 1,
        unit_cost: '',
        total_cost: '',
      });
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);
      const updatedPurchases = await api.get(`/purchases?${params.toString()}`);
      setPurchases(updatedPurchases.data);
    } catch (err) {
      console.error('Error recording purchase:', err);
      setError(err.response?.data?.message || 'Failed to record purchase.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isBaseSelectDisabled = userRole === 'logistics_officer' && user?.base_id;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <ShoppingCart className="mr-3 h-8 w-8 text-primary-600" /> Purchases Management
      </h2>

      <div className="mb-8 p-6 bg-primary-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <PlusCircle className="mr-2 h-6 w-6 text-primary-600" /> Record New Purchase
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
        <form onSubmit={handleRecordPurchase} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="asset_id" className="block text-sm font-medium text-gray-700 mb-1">
              Asset (Serial Number)
            </label>
            <select
              id="asset_id"
              name="asset_id"
              value={newPurchase.asset_id}
              onChange={handleNewPurchaseChange}
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
            <label htmlFor="base_id" className="block text-sm font-medium text-gray-700 mb-1">
              Purchased For Base
            </label>
            <select
              id="base_id"
              name="base_id"
              value={newPurchase.base_id}
              onChange={handleNewPurchaseChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitLoading || isBaseSelectDisabled}
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
              value={newPurchase.quantity}
              onChange={handleNewPurchaseChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              min="1"
              required
              disabled={submitLoading}
            />
          </div>
          <div>
            <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost
            </label>
            <input
              type="number"
              id="unit_cost"
              name="unit_cost"
              value={newPurchase.unit_cost}
              onChange={handleNewPurchaseChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              step="0.01"
              min="0"
              disabled={submitLoading}
            />
          </div>
          <div>
            <label htmlFor="total_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Total Cost
            </label>
            <input
              type="text"
              id="total_cost"
              name="total_cost"
              value={newPurchase.total_cost}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              readOnly
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
                <PlusCircle className="mr-2 h-5 w-5" />
              )}
              Record Purchase
            </button>
          </div>
        </form>
      </div>

      {/* Historical Purchases Section */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <ShoppingCart className="mr-2 h-6 w-6 text-gray-600" /> Historical Purchases
      </h3>

      {/* Filters for historical purchases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
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
          <span className="ml-3 text-lg text-gray-700">Loading purchases...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      ) : purchases.length === 0 ? (
        <p className="text-gray-600">No purchases found for the selected filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Serial #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.purchase_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.asset_serial_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.equipment_type_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.base_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(purchase.unit_cost).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(purchase.total_cost).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.purchased_by_username || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Purchases;
