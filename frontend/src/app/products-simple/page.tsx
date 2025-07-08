'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function SimpleProductsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-orange-600 dark:to-red-600 bg-clip-text text-transparent mb-4">
                Products Page
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                This page loaded successfully! Authentication is working.
              </p>
              
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                ✅ ProtectedRoute is working correctly
              </div>
              
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                Now testing API integration...
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
