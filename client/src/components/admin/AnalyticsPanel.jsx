import React, { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPanel = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    orders: [],
    popularItems: [],
    customerData: {},
  });

  // Generate mock data based on time range
  const generateMockData = (range) => {
    const now = new Date();
    let labels = [];
    let revenueData = [];
    let ordersData = [];

    if (range === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        revenueData.push(Math.floor(Math.random() * 1000) + 500);
        ordersData.push(Math.floor(Math.random() * 50) + 10);
      }
    } else if (range === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        if (i % 5 === 0 || i === 29) {
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else {
          labels.push('');
        }
        revenueData.push(Math.floor(Math.random() * 1000) + 500);
        ordersData.push(Math.floor(Math.random() * 50) + 10);
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        revenueData.push(Math.floor(Math.random() * 5000) + 1000);
        ordersData.push(Math.floor(Math.random() * 200) + 50);
      }
    }

    // Mock popular items
    const popularItems = [
      { name: 'Pizza Margherita', orders: Math.floor(Math.random() * 100) + 50 },
      { name: 'Chicken Burger', orders: Math.floor(Math.random() * 90) + 40 },
      { name: 'Caesar Salad', orders: Math.floor(Math.random() * 80) + 30 },
      { name: 'Pasta Carbonara', orders: Math.floor(Math.random() * 70) + 20 },
      { name: 'Chocolate Cake', orders: Math.floor(Math.random() * 60) + 10 },
    ].sort((a, b) => b.orders - a.orders);

    // Mock customer data
    const customerData = {
      total: 1200,
      newThisMonth: Math.floor(Math.random() * 100) + 50,
      returning: Math.floor(Math.random() * 500) + 200,
    };

    return {
      labels,
      revenue: revenueData,
      orders: ordersData,
      popularItems,
      customerData,
    };
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/analytics/detailed?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transform API data to match chart format
          const transformedData = {
            labels: data.analytics.revenueData.map(item => 
              new Date(item._id).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })
            ),
            revenue: data.analytics.revenueData.map(item => item.revenue),
            orders: data.analytics.orderData.map(item => item.count),
            popularItems: data.analytics.popularItems.map(item => ({
              name: item._id,
              orders: item.orders
            })),
            customerData: data.analytics.customerData
          };
          setAnalyticsData(transformedData);
        } else {
          // Fallback to mock data if API fails
          const mockData = generateMockData(timeRange);
          setAnalyticsData(mockData);
        }
      } else {
        // Fallback to mock data if API fails
        const mockData = generateMockData(timeRange);
        setAnalyticsData(mockData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to mock data
      const mockData = generateMockData(timeRange);
      setAnalyticsData(mockData);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, timeRange]);

  // Chart options and data
  const revenueChartData = {
    labels: analyticsData.labels,
    datasets: [
      {
        label: 'Revenue ($)',
        data: analyticsData.revenue,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const ordersChartData = {
    labels: analyticsData.labels,
    datasets: [
      {
        label: 'Number of Orders',
        data: analyticsData.orders,
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  const popularItemsData = {
    labels: analyticsData.popularItems.map(item => item.name),
    datasets: [
      {
        data: analyticsData.popularItems.map(item => item.orders),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Insights and metrics about your restaurant's performance
          </p>
        </div>
        <div className="mt-3 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      ${analyticsData.revenue.reduce((a, b) => a + b, 0).toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analyticsData.orders.reduce((a, b) => a + b, 0).toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {analyticsData.customerData?.totalCustomers?.toLocaleString() || '0'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Order Value</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      ${analyticsData.customerData?.avgOrderValue?.toFixed(2) || '0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Over Time</h3>
          <div className="h-80">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Over Time</h3>
          <div className="h-80">
            <Bar data={ordersChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Items</h3>
          <div className="h-96">
            <Pie data={popularItemsData} options={pieOptions} />
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Top Selling Items</h4>
            <ul className="divide-y divide-gray-200">
              {analyticsData.popularItems.map((item, index) => (
                <li key={index} className="py-2 flex justify-between">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">{item.orders} orders</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Insights</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">New Customers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData.customerData?.newCustomers?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Repeat Customer Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {analyticsData.customerData?.repeatRate || '0'}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Generate Sales Report
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Export Customer Data
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              View Detailed Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
