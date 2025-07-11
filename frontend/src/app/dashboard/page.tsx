'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import InteractiveChart from '@/components/InteractiveChart';
import { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/auth';
import { 
  customerApi, 
  transactionApi, 
  businessOwnerApi, 
  type Business, 
  type Product, 
  type Transaction,
  type BusinessAnalytics,
  type OwnerDashboardStats
} from '@/utils/api';
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
  const [userRole, setUserRole] = useState<'customer' | 'owner' | null>(null);
  
  // Customer states
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
  
  // Business Owner states
  const [ownerStats, setOwnerStats] = useState<OwnerDashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    pageViews: 0,
    conversionRate: 0,
    averageOrderValue: 0,
  });
  const [businessAnalytics, setBusinessAnalytics] = useState<BusinessAnalytics | null>(null);
  const [ownerBusinesses, setOwnerBusinesses] = useState<Business[]>([]);
  const [ownerProducts, setOwnerProducts] = useState<Product[]>([]);
  const [businessTransactions, setBusinessTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = getAuthToken();
    console.log('Dashboard component mounted, auth token:', authToken);
    if (authToken) {
      setUser(authToken);
      setUserRole(authToken.role);
      loadDashboardData(authToken.role);
    }
  }, []);

  const loadDashboardData = async (role: 'customer' | 'owner') => {
    try {
      console.log('Loading dashboard data for role:', role);
      setLoading(true);
      setError(null);

      if (role === 'customer') {
        await loadCustomerData();
      } else if (role === 'owner') {
        await loadBusinessOwnerData();
      }
      
      console.log('Dashboard data loaded successfully');
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async () => {
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
  };

  const loadBusinessOwnerData = async () => {
    console.log('Fetching business owner data...');
    
    // Load owner's businesses
    const businesses = await businessOwnerApi.getMyBusinesses();
    console.log('Owner businesses:', businesses);
    setOwnerBusinesses(businesses);

    // Load owner's products
    const products = await businessOwnerApi.getMyProducts();
    console.log('Owner products:', products);
    setOwnerProducts(products);

    // Load business transactions
    const transactions = await businessOwnerApi.getBusinessTransactions();
    console.log('Business transactions:', transactions);
    setBusinessTransactions(transactions.slice(0, 10));

    // Load business analytics
    const analytics = await businessOwnerApi.getBusinessAnalytics();
    console.log('Business analytics:', analytics);
    setBusinessAnalytics(analytics);

    // Calculate owner stats
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = completedTransactions.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    setOwnerStats({
      totalRevenue,
      totalOrders,
      activeProducts: products.length,
      pageViews: analytics.pageViews || 0,
      conversionRate: analytics.conversionRate || 0,
      averageOrderValue,
    });
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
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-orange-600 dark:to-red-600 bg-clip-text text-transparent mb-4">
                {userRole === 'owner' ? 'Business Owner Global Dashboard' : 'Customer Dashboard'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {userRole === 'owner' 
                  ? `Welcome back, ${user?.name || 'Business Owner'}! Overview of all your businesses.`
                  : `Welcome back, ${user?.name || 'Customer'}!`
                }
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Role-based Dashboard Content */}
            {userRole === 'customer' ? (
              <CustomerDashboard 
                stats={stats}
                savedItems={savedItems}
                recentTransactions={recentTransactions}
              />
            ) : userRole === 'owner' ? (
              <BusinessOwnerDashboard 
                stats={ownerStats}
                analytics={businessAnalytics}
                businesses={ownerBusinesses}
                products={ownerProducts}
                transactions={businessTransactions}
              />
            ) : null}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Customer Dashboard Component
function CustomerDashboard({ stats, savedItems, recentTransactions }: {
  stats: DashboardStats;
  savedItems: SavedItems;
  recentTransactions: Transaction[];
}) {
  // Generate data for charts
  const savedItemsData = [
    { name: 'Businesses', value: savedItems.businesses.length },
    { name: 'Products', value: savedItems.products.length },
    { name: 'Services', value: savedItems.services.length },
  ].filter(item => item.value > 0);

  const transactionData = recentTransactions.slice(0, 7).map((transaction, index) => ({
    name: `Order ${index + 1}`,
    value: transaction.amount,
  }));

  const spendingData = [
    { name: 'Completed', value: stats.totalSpent },
    { name: 'Pending', value: recentTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0) },
  ].filter(item => item.value > 0);

  return (
    <>
      {/* Interactive Stats Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <InteractiveChart
          title="Saved Items"
          data={savedItemsData}
          value={stats.savedItems}
          description="Saved Items"
          color="#3b82f6"
          colorClasses="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />

        <InteractiveChart
          title="Recent Orders"
          data={transactionData}
          value={stats.recentTransactions}
          description="Recent Orders"
          color="#10b981"
          colorClasses="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5H21M7 13v6a2 2 0 002 2h2M7 13H5.4M9 19v2m6-2v2" />
            </svg>
          }
        />

        <InteractiveChart
          title="Total Spending"
          data={spendingData}
          value={`₱${stats.totalSpent.toLocaleString()}`}
          description="Total Spent"
          color="#8b5cf6"
          colorClasses="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
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
            <Link href="/dashboard/orders" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              View All
            </Link>
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
    </>
  );
}

// Business Owner Dashboard Component
function BusinessOwnerDashboard({ stats, analytics, businesses, products, transactions }: {
  stats: OwnerDashboardStats;
  analytics: BusinessAnalytics | null;
  businesses: Business[];
  products: Product[];
  transactions: Transaction[];
}) {
  // Generate data for charts
  const revenueData = analytics?.salesOverTime?.map(item => ({
    name: item.date,
    value: item.revenue,
  })) || [
    { name: 'Week 1', value: stats.totalRevenue * 0.2 },
    { name: 'Week 2', value: stats.totalRevenue * 0.3 },
    { name: 'Week 3', value: stats.totalRevenue * 0.25 },
    { name: 'Week 4', value: stats.totalRevenue * 0.25 },
  ];

  const ordersData = [
    { name: 'Completed', value: transactions.filter(t => t.status === 'completed').length },
    { name: 'Pending', value: transactions.filter(t => t.status === 'pending').length },
    { name: 'Cancelled', value: transactions.filter(t => t.status === 'cancelled').length },
  ].filter(item => item.value > 0);

  const productData = [
    { name: 'Products', value: products.filter(p => p.type === 'product').length },
    { name: 'Services', value: products.filter(p => p.type === 'service').length },
  ].filter(item => item.value > 0);

  const pageViewsData = [
    { name: 'Jan', value: Math.floor(stats.pageViews * 0.15) },
    { name: 'Feb', value: Math.floor(stats.pageViews * 0.18) },
    { name: 'Mar', value: Math.floor(stats.pageViews * 0.16) },
    { name: 'Apr', value: Math.floor(stats.pageViews * 0.17) },
    { name: 'May', value: Math.floor(stats.pageViews * 0.19) },
    { name: 'Jun', value: Math.floor(stats.pageViews * 0.15) },
  ];

  const conversionData = [
    { name: 'Converted', value: Math.floor(stats.conversionRate) },
    { name: 'Not Converted', value: Math.floor(100 - stats.conversionRate) },
  ];

  const orderValueData = transactions.slice(0, 7).map((transaction, index) => ({
    name: `Order ${index + 1}`,
    value: transaction.amount,
  }));

  return (
    <>
      {/* Global KPIs Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Global Business Performance
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Key metrics aggregated across all your {businesses.length} business{businesses.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Business Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {businesses.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Businesses
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {businesses.filter(b => b.isVerified).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Verified Businesses
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.activeProducts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Products
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              ₱{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Revenue
            </div>
          </div>
        </div>
      </div>

      {/* Interactive KPI Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <InteractiveChart
          title="Total Revenue"
          data={revenueData}
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          description="Across All Businesses"
          color="#10b981"
          colorClasses="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <InteractiveChart
          title="Total Orders"
          data={ordersData}
          value={stats.totalOrders}
          description="Across All Businesses"
          color="#3b82f6"
          colorClasses="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />

        <InteractiveChart
          title="Active Products"
          data={productData}
          value={stats.activeProducts}
          description="Across All Businesses"
          color="#8b5cf6"
          colorClasses="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <InteractiveChart
          title="Page Views"
          data={pageViewsData}
          value={stats.pageViews.toLocaleString()}
          description="Across All Businesses"
          color="#f59e0b"
          colorClasses="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />

        <InteractiveChart
          title="Conversion Rate"
          data={conversionData}
          value={`${stats.conversionRate.toFixed(1)}%`}
          description="Across All Businesses"
          color="#6366f1"
          colorClasses="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />

        <InteractiveChart
          title="Average Order Value"
          data={orderValueData}
          value={`₱${stats.averageOrderValue.toLocaleString()}`}
          description="Across All Businesses"
          color="#ec4899"
          colorClasses="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href={businesses.length > 0 ? `/manage/business/${businesses[0]._id}/products` : '/dashboard/create-business'} className="feature-card hover:scale-105 transition-transform">
          <div className="feature-icon bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Product</h3>
        </Link>

        <Link href="/dashboard/orders" className="feature-card hover:scale-105 transition-transform">
          <div className="feature-icon bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Orders</h3>
        </Link>

        <Link href="/dashboard/analytics" className="feature-card hover:scale-105 transition-transform">
          <div className="feature-icon bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>
        </Link>

        {businesses.length > 0 && (
          <Link href="/dashboard/manage-businesses" className="feature-card hover:scale-105 transition-transform">
            <div className="feature-icon bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {businesses.length === 1 ? 'Manage Business' : 'Manage Businesses'}
            </h3>
          </Link>
        )}

        <Link href="/dashboard/create-business" className="feature-card hover:scale-105 transition-transform">
          <div className="feature-icon bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {businesses.length > 0 ? 'Add Another Business' : 'Create Your First Business'}
          </h3>
        </Link>
      </div>

      {/* Recent Sales */}
      {transactions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Sales (All Businesses)</h2>
            <Link href="/dashboard/orders" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              View All
            </Link>
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
                      Customer
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
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {typeof transaction.sellableId === 'object' ? transaction.sellableId?.title : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {typeof transaction.customerId === 'object' && transaction.customerId?.userId ? 
                          transaction.customerId.userId.name || transaction.customerId.userId.email || 'N/A' : 'N/A'}
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

      {/* Top Products */}
      {analytics?.topProducts && analytics.topProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Top Performing Products (All Businesses)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topProducts.slice(0, 6).map((item, index) => (
              <div key={item.product._id} className="feature-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.product.title}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">#{index + 1}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {item.product.description || 'No description available'}
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sales: {item.totalSales}</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₱{item.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/dashboard/products/${item.product._id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Overview */}
      {businesses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map((business) => (
              <div key={business._id} className="feature-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {business.name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    business.isVerified 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {business.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {business.description || 'No description available'}
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Category: {business.categoryId?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Location: {business.locationId?.name || 'N/A'}
                    </p>
                  </div>
                  <Link href={`/manage/business/${business._id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}