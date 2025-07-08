'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { getAuthToken } from '@/utils/auth';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const authToken = getAuthToken();
    if (authToken) {
      setUserInfo(authToken);
    }
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-green-500 dark:from-orange-500 dark:to-red-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-orange-600 dark:to-red-600 bg-clip-text text-transparent mb-2">
                Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Manage your account information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="feature-card">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{userInfo?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900 dark:text-white">{userInfo?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account Type
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {userInfo?.role === 'owner' ? 'Business Owner' : 'Customer'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="feature-card">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h3>
                <div className="space-y-4">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                    Edit Profile
                  </button>
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                    Change Password
                  </button>
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
