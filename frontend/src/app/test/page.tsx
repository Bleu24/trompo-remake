'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from '@/utils/auth';

export default function TestPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test auth token parsing
    const token = getAuthToken();
    setAuthData(token);

    // Test API call
    testApi();
  }, []);

  const testApi = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No token found');
        return;
      }

      console.log('Testing API with token:', token);

      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        setApiTest(data);
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
        setError(`API Error: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Network error:', err);
      setError(`Network Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Local Auth Token</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(authData, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Test Response</h2>
            {error ? (
              <div className="text-red-600 bg-red-50 p-4 rounded">
                {error}
              </div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(apiTest, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Raw Token</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto break-all">
            {localStorage.getItem('authToken')}
          </pre>
        </div>

        <div className="mt-6">
          <button 
            onClick={testApi}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry API Test
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('authToken');
              window.location.reload();
            }}
            className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Clear Token
          </button>
        </div>
      </div>
    </div>
  );
}
