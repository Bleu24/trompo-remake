'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import { productApi, type Product } from '@/utils/api';
import { getImageUrl } from '@/utils/imageUtils';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search query
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.businessId.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await productApi.getAll();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    // Show a brief success indication
    alert(`${product.title} added to cart!`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The filtering is handled by the useEffect above
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 dark:from-orange-600 dark:to-red-600 bg-clip-text text-transparent mb-4">
                Products
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Discover amazing products from local businesses
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg 
                  className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
                <button 
                  onClick={loadProducts}
                  className="ml-4 text-red-800 underline hover:text-red-900"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No products found' : 'No products available'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Check back later for new products'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="bg-white dark:bg-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-600 overflow-hidden group hover:scale-105 transition-transform">
                      {/* Product Image */}
                      {product.images && product.images.length > 0 ? (
                        <div className="aspect-video bg-gray-200 dark:bg-gray-600 overflow-hidden">
                          <Image
                            src={getImageUrl(product.images[0]) || '/api/placeholder/400/225'}
                            alt={product.title}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center">
                          <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {product.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.type === 'product'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {product.type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-3 font-medium">
                          {typeof product.businessId === 'object' ? product.businessId.name : 'N/A'}
                        </p>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 text-sm">
                          {product.description || 'No description available'}
                        </p>
                        
                        <div className="space-y-2 text-sm mb-4">
                          {product.inventory !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                              <span className={`font-medium ${
                                product.inventory > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {product.inventory > 0 ? `${product.inventory} units` : 'Out of stock'}
                              </span>
                            </div>
                          )}

                          {typeof product.categoryId === 'object' && product.categoryId?.name && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Category:</span>
                              <span className="text-gray-900 dark:text-white">
                                {product.categoryId.name}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ₱{product.price.toLocaleString()}
                          </span>
                          <button 
                            disabled={product.inventory === 0}
                            onClick={() => handleAddToCart(product)}
                            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                              product.inventory === 0
                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Added {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
