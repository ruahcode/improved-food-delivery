import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/main.css';
import HeroSection from '../components/home/HeroSection';
import RestaurantCategories from '../components/home/RestaurantCategories';
import PopularRestaurants from '../components/home/PopularRestaurants';
import SpecialOffers from '../components/home/SpecialOffers';
import HowItWorks from '../components/home/HowItWorks';
import useAuth from '../hooks/useAuth';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {user?.role === 'admin' && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Admin Access</h3>
                <p className="text-xs text-blue-700">You have administrator privileges</p>
              </div>
            </div>
            <Link
              to="/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Go to Admin Panel
            </Link>
          </div>
        </div>
      )}
      <HeroSection />
      <RestaurantCategories />
      <PopularRestaurants />
      <SpecialOffers />
      <HowItWorks />
    </div>
  );
};

export default Home;