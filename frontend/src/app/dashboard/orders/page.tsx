'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import { getAuthToken } from '@/utils/auth';
import { 
  transactionApi, 
  businessOwnerApi, 
  customerApi,
  type Transaction,
  type Business,
  type Product
} from '@/utils/api';
import Link from 'next/link';

interface OrderFilters {
  status: 'all' | 'pending' | 'completed' | 'cancelled';
  business: string;
  dateRange: 'all' | '7days' | '30days' | '90days';
  sortBy: 'date' | 'amount' | 'customer';
  sortOrder: 'asc' | 'desc';
}

export default function OrdersPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'customer' | 'owner' | null>(null);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Transaction[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Transaction | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    business: 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  useEffect(() => {
    const authToken = getAuthToken();
    if (authToken) {
      setUser(authToken);
      setUserRole(authToken.role);
      loadOrdersData(authToken.role);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const loadOrdersData = async (role: 'customer' | 'owner') => {
    try {
      setLoading(true);
      setError(null);

      if (role === 'customer') {
        const customerOrders = await transactionApi.getAll();
        setOrders(customerOrders);
      } else if (role === 'owner') {
        const [ownerOrders, ownerBusinesses] = await Promise.all([
          businessOwnerApi.getBusinessTransactions(),
          businessOwnerApi.getMyBusinesses()
        ]);
        setOrders(ownerOrders);
        setBusinesses(ownerBusinesses);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Business filter (for owners)
    if (filters.business !== 'all' && userRole === 'owner') {
      filtered = filtered.filter(order => 
        typeof order.businessId === 'object' && order.businessId._id === filters.business
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = filters.dateRange === '7days' ? 7 : filters.dateRange === '30days' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(order => new Date(order.createdAt) >= cutoffDate);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'customer':
          aValue = typeof a.customerId === 'object' && a.customerId?.userId ? 
            (a.customerId.userId.name || a.customerId.userId.email) : '';
          bValue = typeof b.customerId === 'object' && b.customerId?.userId ? 
            (b.customerId.userId.name || b.customerId.userId.email) : '';
          break;
        default: // date
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      await transactionApi.updateStatus(orderId, newStatus);
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
      setSelectedOrder(null);
      setShowOrderModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const handleOrderClick = (order: Transaction) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/dashboard"
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {userRole === 'owner' ? 'Order Management' : 'My Orders'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                      {userRole === 'owner' 
                        ? 'Manage and track orders for your businesses' 
                        : 'View and track your order history'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Filters */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Business Filter (for owners) */}
                {userRole === 'owner' && businesses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business
                    </label>
                    <select
                      value={filters.business}
                      onChange={(e) => setFilters({ ...filters, business: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Businesses</option>
                      {businesses.map((business) => (
                        <option key={business._id} value={business._id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    {userRole === 'owner' && <option value="customer">Customer</option>}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{filteredOrders.length}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-lg p-3">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {filteredOrders.filter(o => o.status === 'completed').length}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-800 rounded-lg p-3">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                      {filteredOrders.filter(o => o.status === 'pending').length}
                    </p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-800 rounded-lg p-3">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Total Value</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      ₱{filteredOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-800 rounded-lg p-3">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No orders found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {orders.length === 0 
                    ? "You don't have any orders yet" 
                    : "No orders match your current filters"
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Product/Service
                        </th>
                        {userRole === 'owner' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Customer
                          </th>
                        )}
                        {userRole === 'customer' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Business
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                            #{order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {typeof order.sellableId === 'object' ? order.sellableId?.title : 'N/A'}
                          </td>
                          {userRole === 'owner' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                              {typeof order.customerId === 'object' && order.customerId?.userId ? 
                                order.customerId.userId.name || order.customerId.userId.email || 'N/A' : 'N/A'}
                            </td>
                          )}
                          {userRole === 'customer' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                              {typeof order.businessId === 'object' ? order.businessId?.name : 'N/A'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            ₱{order.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleOrderClick(order)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order Details
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Order Information */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Order ID
                      </label>
                      <p className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        #{selectedOrder._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product/Service
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {typeof selectedOrder.sellableId === 'object' ? selectedOrder.sellableId?.title : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount
                      </label>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₱{selectedOrder.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {userRole === 'owner' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {typeof selectedOrder.customerId === 'object' && selectedOrder.customerId?.userId ? 
                          selectedOrder.customerId.userId.name || selectedOrder.customerId.userId.email || 'N/A' : 'N/A'}
                      </p>
                    </div>
                  )}

                  {userRole === 'customer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {typeof selectedOrder.businessId === 'object' ? selectedOrder.businessId?.name : 'N/A'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Method
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedOrder.paymentMethod || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Update Actions (for business owners) */}
                  {userRole === 'owner' && selectedOrder.status !== 'cancelled' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Update Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder._id, 'pending')}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            Mark as Pending
                          </button>
                        )}
                        {selectedOrder.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder._id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Mark as Completed
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
