import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Package, History, ArrowLeft, ShoppingCart, Truck, Users, PackageX } from 'lucide-react';

function AssetDetails() {
  const { id } = useParams(); 
  const [assetDetails, setAssetDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssetDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/assets/${id}/details`);
        setAssetDetails(response.data);
      } catch (err) {
        console.error('Error fetching asset details:', err);
        setError(err.response?.data?.message || 'Failed to fetch asset details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssetDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-lg text-gray-700">Loading asset details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
        <Link to="/assets" className="inline-flex items-center text-primary-600 hover:text-primary-800">
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Asset List
        </Link>
      </div>
    );
  }

  if (!assetDetails) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
        <p className="text-gray-600">Asset details not found.</p>
        <Link to="/assets" className="inline-flex items-center text-primary-600 hover:text-primary-800">
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Asset List
        </Link>
      </div>
    );
  }

  const { assetInfo, history } = assetDetails;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <Package className="mr-3 h-8 w-8 text-primary-600" /> Asset Details: {assetInfo.serial_number}
        </h2>
        <Link to="/assets" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to List
        </Link>
      </div>

      {/* Asset Information */}
      <div className="mb-8 p-6 bg-primary-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Asset Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
          <p><strong>Serial Number:</strong> {assetInfo.serial_number}</p>
          <p><strong>Equipment Type:</strong> {assetInfo.equipment_type_name}</p>
          <p><strong>Model:</strong> {assetInfo.model || 'N/A'}</p>
          <p><strong>Manufacturer:</strong> {assetInfo.manufacturer || 'N/A'}</p>
          <p><strong>Current Base:</strong> {assetInfo.current_base_name}</p>
          <p><strong>Status:</strong>
            <span className={`ml-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              assetInfo.status === 'available' ? 'bg-green-100 text-green-800' :
              assetInfo.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
              assetInfo.status === 'expended' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {assetInfo.status}
            </span>
          </p>
          <p><strong>Created At:</strong> {new Date(assetInfo.created_at).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> {new Date(assetInfo.last_updated_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Asset History Section */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <History className="mr-2 h-6 w-6 text-gray-600" /> Asset History
      </h3>

      {/* Purchases History */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5 text-primary-500" /> Purchases
        </h4>
        {history.purchases.length === 0 ? (
          <p className="text-gray-600">No purchase history found for this asset.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased For Base</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.purchases.map((item) => (
                  <tr key={item.purchase_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.purchase_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(item.unit_cost).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(item.total_cost).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.purchased_by_username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.purchased_for_base_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfers History */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <Truck className="mr-2 h-5 w-5 text-blue-500" /> Transfers
        </h4>
        {history.transfers.length === 0 ? (
          <p className="text-gray-600">No transfer history found for this asset.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.transfers.map((item) => (
                  <tr key={item.transfer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.transfer_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.from_base_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.to_base_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transferred_by_username || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignments History */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <Users className="mr-2 h-5 w-5 text-purple-500" /> Assignments
        </h4>
        {history.assignments.length === 0 ? (
          <p className="text-gray-600">No assignment history found for this asset.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.assignments.map((item) => (
                  <tr key={item.assignment_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.assigned_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assigned_to_username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assigned_by_username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'returned' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.return_date ? new Date(item.return_date).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expenditures History */}
      <div>
        <h4 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
          <PackageX className="mr-2 h-5 w-5 text-red-500" /> Expenditures
        </h4>
        {history.expenditures.length === 0 ? (
          <p className="text-gray-600">No expenditure history found for this asset.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expended By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expended At Base</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.expenditures.map((item) => (
                  <tr key={item.expenditure_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.expenditure_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reason || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.expended_by_username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.expended_at_base_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssetDetails;
