import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaUser, FaCog, FaUsers, FaBox, FaChartBar } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100';
  };

  const userLinks = [
    { to: '/dashboard', icon: <FaHome className="mr-3" />, text: 'Overview' },
    { to: '/dashboard/orders', icon: <FaShoppingCart className="mr-3" />, text: 'My Orders' },
    { to: '/dashboard/profile', icon: <FaUser className="mr-3" />, text: 'Profile' },
    { to: '/dashboard/settings', icon: <FaCog className="mr-3" />, text: 'Settings' },
  ];

  const adminLinks = [
    { to: '/dashboard/admin', icon: <FaChartBar className="mr-3" />, text: 'Dashboard' },
    { to: '/dashboard/admin/users', icon: <FaUsers className="mr-3" />, text: 'Users' },
    { to: '/dashboard/admin/products', icon: <FaBox className="mr-3" />, text: 'Products' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </p>
          {userLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive(link.to)}`}
            >
              {link.icon}
              {link.text}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <>
              <p className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </p>
              {adminLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive(link.to)}`}
                >
                  {link.icon}
                  {link.text}
                </Link>
              ))}
            </>
          )}
        </div>
      </nav>
      
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
