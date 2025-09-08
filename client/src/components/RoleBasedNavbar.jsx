import React, { useState, useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  FaMotorcycle, 
  FaUser, 
  FaSignOutAlt, 
  FaShoppingCart,
  FaHome,
  FaUtensils,
  FaHeart,
  FaPhone,
  FaTachometerAlt,
  FaUsers,
  FaShoppingBag,
  FaChartBar,
  FaCog
} from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import CartContext from '../context/CartContext';
import { getNavLinksForRole } from '../config/navConfig';

const RoleBasedNavbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useContext(CartContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const navLinks = getNavLinksForRole(user?.role);

  const iconMap = {
    FaHome, FaUtensils, FaHeart, FaPhone, FaTachometerAlt, 
    FaUsers, FaShoppingBag, FaChartBar, FaCog
  };

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const UserDropdown = () => (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
      {!isAdmin && (
        <>
          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-inter"
            onClick={() => setShowDropdown(false)}
          >
            <FaUser className="mr-2" /> Profile
          </Link>
          <Link
            to="/orders"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-inter"
            onClick={() => setShowDropdown(false)}
          >
            <FaShoppingBag className="mr-2" /> My Orders
          </Link>
        </>
      )}
      <button
        onClick={handleLogout}
        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t font-inter"
      >
        <FaSignOutAlt className="mr-2" /> Logout
      </button>
    </div>
  );

  return (
    <nav className="bg-white shadow-sm font-body fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-2">
            <FaMotorcycle className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold text-gray-800 font-poppins">
              FoodDelivery
            </span>
          </div>

          {/* Center: Nav Links (Desktop) - Hidden for admin */}
          {!isAdmin && (
            <div className="hidden md:flex flex-1 justify-center gap-6">
              {navLinks.map(({ to, text, icon }) => {
                const IconComponent = iconMap[icon];
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `text-sm font-medium px-3 py-2 rounded-md transition-colors font-inter ${
                        isActive ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-700 hover:text-red-600'
                      }`
                    }
                  >
                    {text}
                  </NavLink>
                );
              })}
            </div>
          )}

          {/* Right: Admin Panel + Auth Buttons + Cart (Desktop) */}
          <div className="hidden md:flex justify-end gap-4 items-center">
            {isAdmin && (
              <span className="text-sm font-medium text-gray-600">
                Admin Panel
              </span>
            )}
            {/* Cart (only for non-admin users) */}
            {!isAdmin && isAuthenticated && (
              <Link to="/cart" className="relative p-2 text-gray-700 hover:text-red-600">
                <FaShoppingCart className="text-xl" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center text-sm rounded-full focus:outline-none"
                >
                  <FaUser className="h-8 w-8 rounded-full bg-gray-200 p-1.5 text-gray-700" />
                </button>
                {showDropdown && <UserDropdown />}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium px-4 py-2 text-gray-700 hover:text-red-600 transition-colors font-inter"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-inter"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Hidden for admin */}
          {!isAdmin && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-red-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Menu - Hidden for admin */}
        {isMobileMenuOpen && !isAdmin && (
          <div className="md:hidden py-2 space-y-1 bg-white border-t">
            {navLinks.map(({ to, text, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm font-medium rounded-md ${
                    isActive ? 'text-red-600 bg-red-50' : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {text}
              </NavLink>
            ))}
            
            <div className="pt-2 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  {!isAdmin && (
                    <>
                      <Link
                        to="/profile"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 font-inter"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 font-inter"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 font-inter"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 font-inter"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-md mt-2 font-inter"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default RoleBasedNavbar;