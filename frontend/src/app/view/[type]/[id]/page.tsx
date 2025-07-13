'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { productApi, businessApi, customerApi, chatApi, reviewApi, type Business, type Product, type Review, type ChatUser, type Conversation } from '@/utils/api';

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
    
    // Track business visit if viewing a business
    if (type === 'business') {
      trackBusinessVisit();
    }
  }, [type, id]);

  const trackBusinessVisit = async () => {
    try {
      await businessApi.trackVisit(id);
    } catch (error) {
      // Silently fail - visit tracking is not critical
      console.log('Visit tracking failed:', error);
    }
  };

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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const handleContactBusiness = () => {
    setShowContactModal(true);
  };

  const handleViewProducts = async () => {
    setShowProductsModal(true);
    if (products.length === 0) {
      setLoadingProducts(true);
      try {
        const businessProducts = await productApi.getByBusiness(business._id);
        setProducts(businessProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleWriteReview = async () => {
    setShowReviewModal(true);
    if (reviews.length === 0) {
      setLoadingReviews(true);
      try {
        const businessReviews = await reviewApi.getBusinessReviews(business._id);
        setReviews(businessReviews);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    }
  };
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
            <button 
              onClick={handleContactBusiness}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Contact Business
            </button>
            <button 
              onClick={handleViewProducts}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              View Products & Services
            </button>
            <button 
              onClick={handleWriteReview}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Write Review
            </button>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal 
          business={business}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {/* Products Modal */}
      {showProductsModal && (
        <ProductsModal 
          business={business}
          products={products}
          loading={loadingProducts}
          onClose={() => setShowProductsModal(false)}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal 
          business={business}
          reviews={reviews}
          loading={loadingReviews}
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={() => {
            // Refresh reviews after submitting
            handleWriteReview();
          }}
        />
      )}
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);

  const handleContactSeller = async () => {
    if (!businessData) {
      await loadBusinessData();
    }
    setShowContactModal(true);
  };

  const handleViewBusiness = async () => {
    if (!businessData) {
      await loadBusinessData();
    }
    setShowBusinessModal(true);
  };

  const handleWriteReview = async () => {
    if (!businessData) {
      await loadBusinessData();
    }
    setShowReviewModal(true);
  };

  const loadBusinessData = async () => {
    try {
      setLoadingBusiness(true);
      const business = await businessApi.getById(product.businessId._id);
      setBusinessData(business);
    } catch (error) {
      console.error('Failed to load business data:', error);
    } finally {
      setLoadingBusiness(false);
    }
  };
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
            <button 
              onClick={handleContactSeller}
              disabled={loadingBusiness}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingBusiness ? 'Loading...' : 'Contact Seller'}
            </button>
            <button 
              onClick={handleViewBusiness}
              disabled={loadingBusiness}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingBusiness ? 'Loading...' : 'View Business Profile'}
            </button>
            <button 
              onClick={handleWriteReview}
              disabled={loadingBusiness}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingBusiness ? 'Loading...' : 'Write Review'}
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
              Share Item
            </button>
          </div>
        </div>
      </div>

      {/* Modals for ProductView */}
      {businessData && showContactModal && (
        <ContactModal 
          business={businessData}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {businessData && showBusinessModal && (
        <BusinessProfileModal 
          business={businessData}
          onClose={() => setShowBusinessModal(false)}
        />
      )}

      {businessData && showReviewModal && (
        <ProductReviewModal 
          business={businessData}
          product={product}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
}

// Modal Components

// Contact Modal Component
function ContactModal({ business, onClose }: { business: Business; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleStartConversation = async () => {
    if (!business.ownerId?.userId) {
      alert('Unable to contact business owner');
      return;
    }

    try {
      setLoading(true);
      
      // Check if conversation already exists
      const conversations = await chatApi.getConversations();
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p._id === business.ownerId?.userId)
      );

      let conversationId;
      if (existingConversation) {
        conversationId = existingConversation._id;
      } else {
        const newConversation = await chatApi.startConversation(business.ownerId.userId);
        conversationId = newConversation._id;
      }
      
      if (message.trim()) {
        await chatApi.sendMessage(conversationId, message);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Redirect to chat page
        window.location.href = '/chat';
      }, 1500);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Contact {business.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Message Sent!
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Your conversation has been started. Redirecting to chat...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Send a message to {business.name} to start a conversation.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here... (optional)"
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartConversation}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Starting...' : 'Start Conversation'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Products Modal Component
function ProductsModal({ 
  business, 
  products, 
  loading, 
  onClose 
}: { 
  business: Business; 
  products: Product[]; 
  loading: boolean; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {business.name} - Products & Services
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Products or Services
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                This business hasn't added any products or services yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {product.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      product.type === 'product' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {product.type}
                    </span>
                  </div>
                  
                  {product.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₱{product.price.toLocaleString()}
                    </span>
                    <a
                      href={`/view/${product.type}/${product._id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      View Details
                    </a>
                  </div>
                  
                  {product.inventory !== undefined && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.inventory > 0
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Review Modal Component
function ReviewModal({ 
  business, 
  reviews, 
  loading, 
  onClose, 
  onReviewSubmitted 
}: { 
  business: Business; 
  reviews: Review[]; 
  loading: boolean; 
  onClose: () => void; 
  onReviewSubmitted: () => void; 
}) {
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      await reviewApi.createReview({
        businessId: business._id,
        rating,
        comment,
      });
      setShowWriteReview(false);
      setRating(5);
      setComment('');
      onReviewSubmitted();
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Reviews for {business.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Write Review Section */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {showWriteReview ? (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Write Your Review
                </h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                        } hover:text-yellow-500 transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this business..."
                    rows={4}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowWriteReview(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting || !comment.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowWriteReview(true)}
                className="w-full text-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                + Write a Review
              </button>
            )}
          </div>

          {/* Reviews Summary */}
          {reviews.length > 0 && (
            <div className="mb-6 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xl ${
                      star <= Math.round(averageRating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Reviews Yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to review this business!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <div key={review._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {review.customerId.userId.name}
                      </h5>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= review.rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Business Profile Modal Component (for product view)
function BusinessProfileModal({ business, onClose }: { business: Business; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {business.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
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

            {business.description && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {business.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">Status:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {business.isVerified ? 'Verified Business' : 'Pending Verification'}
                </span>
              </div>
              {business.categoryId && (
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{business.categoryId.name}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onClose();
                  window.location.href = `/view/business/${business._id}`;
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Visit Business Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Review Modal Component (simplified review modal for products)
function ProductReviewModal({ 
  business, 
  product, 
  onClose 
}: { 
  business: Business; 
  product: Product; 
  onClose: () => void; 
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      await reviewApi.createReview({
        businessId: business._id,
        rating,
        comment: `Review for ${product.title}: ${comment}`,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Review {product.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Review Submitted!
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Thank you for your feedback.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Share your experience with {product.title} from {business.name}.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        star <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                      } hover:text-yellow-500 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others about your experience with this product..."
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !comment.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
