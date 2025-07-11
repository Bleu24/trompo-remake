'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import InteractiveChart from '@/components/InteractiveChart';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { businessOwnerApi, businessApi, type Business, type BusinessAnalytics } from '@/utils/api';
import Link from 'next/link';

export default function BusinessAnalyticsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (businessId) {
      loadBusinessAnalytics();
    }
  }, [businessId]);

  const loadBusinessAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load business data and specific analytics
      const [businessData, analyticsData] = await Promise.all([
        businessApi.getById(businessId),
        businessOwnerApi.getBusinessAnalytics(businessId)
      ]);

      setBusiness(businessData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load business analytics');
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
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-64 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !business || !analytics) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Analytics Not Available
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {error || 'Unable to load analytics for this business.'}
                </p>
                <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Generate chart data
  const revenueData = analytics.salesOverTime?.map(item => ({
    name: item.date,
    value: item.revenue,
  })) || [];

  const ordersData = [
    { name: 'Completed', value: Math.floor(analytics.totalOrders * 0.7) },
    { name: 'Pending', value: Math.floor(analytics.totalOrders * 0.2) },
    { name: 'Cancelled', value: Math.floor(analytics.totalOrders * 0.1) },
  ];

  const conversionData = [
    { name: 'Converted', value: Math.floor(analytics.conversionRate) },
    { name: 'Not Converted', value: Math.floor(100 - analytics.conversionRate) },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/manage/business/${businessId}`}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {business.name} Analytics
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Performance insights for this business
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  business.isVerified 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {business.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₱{analytics.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalOrders.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.pageViews.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Page Views</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analytics.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue Over Time
              </h3>
              <InteractiveChart
                title="Revenue Trend"
                data={revenueData}
                value={analytics.totalRevenue}
                description="Total revenue over time"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>}
                color="#10B981"
                colorClasses="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Status Distribution
              </h3>
              <InteractiveChart
                title="Order Status"
                data={ordersData}
                value={analytics.totalOrders}
                description="Distribution of order statuses"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>}
                color="#3B82F6"
                colorClasses="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Conversion Rate
              </h3>
              <InteractiveChart
                title="Conversion Rate"
                data={conversionData}
                value={`${analytics.conversionRate.toFixed(1)}%`}
                description="Visitor to customer conversion rate"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>}
                color="#8B5CF6"
                colorClasses="text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sales Performance
              </h3>
              <InteractiveChart
                title="Sales Count"
                data={analytics.salesOverTime?.map(item => ({
                  name: item.date,
                  value: item.sales,
                })) || []}
                value={analytics.totalSales}
                description="Number of sales over time"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>}
                color="#F59E0B"
                colorClasses="text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30"
              />
            </div>
          </div>

          {/* Top Products */}
          {analytics.topProducts && analytics.topProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Performing Products
              </h3>
              <div className="space-y-4">
                {analytics.topProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.product?.title || 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.totalSales} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        ₱{item.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Revenue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sales */}
          {analytics.recentSales && analytics.recentSales.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Sales
              </h3>
              <div className="space-y-4">
                {analytics.recentSales.map((sale, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {typeof sale.sellableId === 'object' ? sale.sellableId?.title : 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        ₱{sale.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {sale.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
