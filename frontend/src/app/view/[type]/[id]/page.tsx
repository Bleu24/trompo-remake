'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { productApi, businessApi, customerApi, type Business, type Product } from '@/utils/api';

interface ViewPageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function ViewPage() {
  return (
    <ProtectedRoute>
      <ViewPageContent />
    </ProtectedRoute>
  );
}

function ViewPageContent() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Business | Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const type = params.type as string;
  const id = params.id as string;

  useEffect(() => {
    fetchItem();
  }, [type, id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (type === 'business') {
        response = await businessApi.getById(id);
      } else {
        response = await productApi.getById(id);
      }

      setItem(response);
    } catch (error: any) {
      console.error('Failed to fetch item:', error);
      setError(error.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await customerApi.saveItem(id, type as 'business' | 'product' | 'service');
      setSaved(true);
    } catch (error: any) {
      console.error('Failed to save item:', error);
      setError(error.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async () => {
    try {
      setSaving(true);
      await customerApi.unsaveItem(id, type as 'business' | 'product' | 'service');
      setSaved(false);
    } catch (error: any) {
      console.error('Failed to unsave item:', error);
      setError(error.message || 'Failed to unsave item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <svg className="mx-auto h-24 w-24 text-red-400 dark:text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || 'Item not found'}
            </h3>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {type === 'business' ? (
            <BusinessView business={item as Business} onSave={handleSave} onUnsave={handleUnsave} saved={saved} saving={saving} />
          ) : (
            <ProductView product={item as Product} onSave={handleSave} onUnsave={handleUnsave} saved={saved} saving={saving} />
          )}
        </div>
      </div>
    </div>
  );
}

// Business View Component
function BusinessView({ 
  business, 
  onSave, 
  onUnsave, 
  saved, 
  saving 
}: { 
  business: Business; 
  onSave: () => void; 
  onUnsave: () => void; 
  saved: boolean; 
  saving: boolean; 
}) {
  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {business.name}
          </h1>
          <div className="flex items-center space-x-4 mb-4">
            {business.categoryId && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                {business.categoryId.name}
              </span>
            )}
            {business.locationId && (
              <span className="text-gray-600 dark:text-gray-400">
                📍 {business.locationId.name}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              business.isVerified 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {business.isVerified ? '✓ Verified' : '⚠ Unverified'}
            </span>
          </div>
        </div>
        <button
          onClick={saved ? onUnsave : onSave}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Saving...' : saved ? 'Unsave' : 'Save Business'}
        </button>
      </div>

      {business.description && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">About</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {business.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {business.isVerified ? 'Verified Business' : 'Pending Verification'}
              </span>
            </div>
            {business.categoryId && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{business.categoryId.name}</span>
              </div>
            )}
            {business.locationId && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{business.locationId.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact & Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
              Contact Business
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
              View Products & Services
            </button>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors">
              Write Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product/Service View Component
function ProductView({ 
  product, 
  onSave, 
  onUnsave, 
  saved, 
  saving 
}: { 
  product: Product; 
  onSave: () => void; 
  onUnsave: () => void; 
  saved: boolean; 
  saving: boolean; 
}) {
  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {product.title}
          </h1>
          <p className="text-lg text-blue-600 dark:text-blue-400 mb-4 font-medium">
            by {product.businessId.name}
          </p>
          <div className="flex items-center space-x-4 mb-4">
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium capitalize">
              {product.type}
            </span>
            {product.inventory !== undefined && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.inventory > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            ₱{product.price.toLocaleString()}
          </div>
          <div className="space-y-2">
            <button
              onClick={saved ? onUnsave : onSave}
              disabled={saving}
              className={`block w-full px-6 py-2 rounded-lg font-medium transition-colors ${
                saved
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving...' : saved ? 'Unsave' : 'Save Item'}
            </button>
            <button
              disabled={product.inventory === 0}
              className={`block w-full px-6 py-2 rounded-lg font-medium transition-colors ${
                product.inventory === 0
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Description</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Details</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
              <span className="ml-2 text-gray-900 dark:text-white capitalize">{product.type}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Price:</span>
              <span className="ml-2 text-gray-900 dark:text-white">₱{product.price.toLocaleString()}</span>
            </div>
            {product.inventory !== undefined && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Availability:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {product.inventory > 0 ? `${product.inventory} available` : 'Out of stock'}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Business:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{product.businessId.name}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
              Contact Seller
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
              View Business Profile
            </button>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors">
              Write Review
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
              Share Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
