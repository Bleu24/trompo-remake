'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/auth';
import { customerApi, transactionApi, type Business, type Product, type Transaction } from '@/utils/api';
import Link from 'next/link';

interface DashboardStats {
  savedItems: number;
  recentTransactions: number;
  totalSpent: number;
}

interface SavedItems {
  businesses: Business[];
  products: Product[];
  services: Product[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    savedItems: 0,
    recentTransactions: 0,
    totalSpent: 0,
  });
  const [savedItems, setSavedItems] = useState<SavedItems>({
    businesses: [],
    products: [],
    services: []
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = getAuthToken();
    console.log('Dashboard component mounted, auth token:', authToken);
    if (authToken) {
      setUser(authToken);
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      setLoading(true);
      setError(null);

      // Load saved items
      console.log('Fetching saved items...');
      const savedItemsData = await customerApi.getSavedItems();
      console.log('Saved items data:', savedItemsData);
      setSavedItems(savedItemsData);

      // Load recent transactions
      console.log('Fetching transactions...');
      const transactionsData = await transactionApi.getAll();
      console.log('Transactions data:', transactionsData);
      setRecentTransactions(transactionsData.slice(0, 5));

      // Update stats
      const totalSavedItems = savedItemsData.businesses.length + savedItemsData.products.length + savedItemsData.services.length;
      setStats({
        savedItems: totalSavedItems,
        recentTransactions: transactionsData.length,
        totalSpent: transactionsData
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.amount, 0),
      });
      console.log('Dashboard data loaded successfully');
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-orange-600 dark:to-red-600 bg-clip-text text-transparent mb-4">
                Customer Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Welcome back, {user?.name || 'Customer'}!
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="feature-card">
                <div className="feature-icon bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.savedItems}</h3>
                <p className="text-gray-600 dark:text-gray-300">Saved Items</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h2M7 13H5.4M9 19v2m6-2v2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.recentTransactions}</h3>
                <p className="text-gray-600 dark:text-gray-300">Recent Orders</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">₱{stats.totalSpent.toLocaleString()}</h3>
                <p className="text-gray-600 dark:text-gray-300">Total Spent</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link href="/products" className="feature-card hover:scale-105 transition-transform">
                <div className="feature-icon bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Products</h3>
              </Link>

              <Link href="/search" className="feature-card hover:scale-105 transition-transform">
                <div className="feature-icon bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Businesses</h3>
              </Link>

              <Link href="/chat" className="feature-card hover:scale-105 transition-transform">
                <div className="feature-icon bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h3>
              </Link>

              <Link href="/profile" className="feature-card hover:scale-105 transition-transform">
                <div className="feature-icon bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
              </Link>
            </div>

            {/* Saved Items */}
            {(savedItems.businesses.length > 0 || savedItems.products.length > 0 || savedItems.services.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Saved Items</h2>
                  <Link href="/search" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    View All
                  </Link>
                </div>

                {/* Saved Businesses */}
                {savedItems.businesses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Businesses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {savedItems.businesses.slice(0, 3).map((business) => (
                        <div key={business._id} className="feature-card">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {business.name}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {business.description || 'No description available'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              business.isVerified 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {business.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                            <Link href={`/view/business/${business._id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Products */}
                {savedItems.products.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Products</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {savedItems.products.slice(0, 3).map((product) => (
                        <div key={product._id} className="feature-card">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {product.title}
                          </h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                            {product.businessId.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {product.description || 'No description available'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              ₱{product.price.toLocaleString()}
                            </span>
                            <Link href={`/view/product/${product._id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Services */}
                {savedItems.services.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {savedItems.services.slice(0, 3).map((service) => (
                        <div key={service._id} className="feature-card">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {service.title}
                          </h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                            {service.businessId.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {service.description || 'No description available'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              ₱{service.price.toLocaleString()}
                            </span>
                            <Link href={`/view/service/${service._id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Transactions */}
            {recentTransactions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    View All
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Business
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {recentTransactions.map((transaction) => (
                          <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {typeof transaction.sellableId === 'object' ? transaction.sellableId?.title : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {typeof transaction.businessId === 'object' ? transaction.businessId?.name : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              ₱{transaction.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : transaction.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}