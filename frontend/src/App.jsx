import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import AssignmentsExpenditures from './pages/AssignmentsExpenditures';
import UserManagement from './pages/UserManagement';
import AssetList from './pages/AssetList'; 
import AssetDetails from './pages/AssetDetails'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} /> 

          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute allowedRoles={['admin', 'base_commander', 'logistics_officer']}>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/purchases"
              element={
                <PrivateRoute allowedRoles={['admin', 'logistics_officer']}>
                  <Purchases />
                </PrivateRoute>
              }
            />
            <Route
              path="/transfers"
              element={
                <PrivateRoute allowedRoles={['admin', 'logistics_officer']}>
                  <Transfers />
                </PrivateRoute>
              }
            />
            <Route
              path="/assignments-expenditures"
              element={
                <PrivateRoute allowedRoles={['admin', 'base_commander', 'logistics_officer']}>
                  <AssignmentsExpenditures />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <UserManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <PrivateRoute allowedRoles={['admin', 'base_commander', 'logistics_officer']}>
                  <AssetList />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/:id"
              element={
                <PrivateRoute allowedRoles={['admin', 'base_commander', 'logistics_officer']}>
                  <AssetDetails />
                </PrivateRoute>
              }
            />
          </Route>

          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <h1 className="text-3xl font-bold text-gray-800">404 - Page Not Found</h1>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
