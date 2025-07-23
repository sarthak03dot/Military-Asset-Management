import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Menu as MenuIcon,
  X as XIcon,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Users,
  LogOut,
  Settings,
  Shield,
  Briefcase,
  Package,
  Home,
} from "lucide-react";

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userRole, logout } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "base_commander", "logistics_officer"],
    },
    {
      name: "Purchases",
      href: "/purchases",
      icon: ShoppingCart,
      roles: ["admin", "logistics_officer"],
    },
    {
      name: "Transfers",
      href: "/transfers",
      icon: Truck,
      roles: ["admin", "logistics_officer"],
    },
    {
      name: "Assignments & Expenditures",
      href: "/assignments-expenditures",
      icon: Users,
      roles: ["admin", "base_commander", "logistics_officer"],
    },
    {
      name: "All Assets",
      href: "/assets",
      icon: Package,
      roles: ["admin", "base_commander", "logistics_officer"],
    }, // New link for Assets
    { name: "User Management", href: "/users", icon: Shield, roles: ["admin"] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="flex h-screen bg-gray-800 font-inter">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primary-800 text-white transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out shadow-lg`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-primary-900">
          <span className="text-xl font-bold">MAMS</span>
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-lg font-medium rounded-r-full transition-colors duration-200 ease-in-out
                ${
                  isActive
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-primary-200 hover:bg-primary-700 hover:text-white"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className="flex items-center justify-between text-primary-200 mb-4">
            <div>
              <p className="text-sm font-semibold">Logged in as:</p>
              <p className="text-lg font-bold">{user?.username || "Guest"}</p>
              <p className="text-xs text-primary-300 capitalize">{userRole}</p>
            </div>
            <Settings className="h-5 w-5" />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center py-2 px-4 border border-primary-600 rounded-lg shadow-sm text-base font-medium text-primary-100 bg-primary-700 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-300 ease-in-out"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar / Header */}
        <header className="flex items-center justify-between h-16 bg-gray-800 border-b border-gray-200 px-6 shadow-sm">
          <button
            className="md:hidden text-gray-500 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-white hidden md:block">
            {navigation.find((item) => item.href === window.location.pathname)
              ?.name || "Dashboard"}
          </h1>
          {/* User info/profile dropdown can go here */}
          <div className="flex items-center">
            <span className="text-white text-sm mr-2 hidden sm:block">
              Welcome, {user?.username}!
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
