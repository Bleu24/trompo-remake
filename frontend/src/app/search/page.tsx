'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { searchApi, productApi, businessApi, type SearchResults, type Business, type Product } from '@/utils/api';

interface SearchFilters {
  type: 'all' | 'business' | 'product' | 'service';
  location: string;
  category: string;
  priceMin: string;
  priceMax: string;
  sortBy: 'relevance' | 'price' | 'newest';
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <SearchPageContent />
    </ProtectedRoute>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    location: '',
    category: '',
    priceMin: '',
    priceMax: '',
    sortBy: 'relevance'
  });

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query, filters);
    } else {
      // Load all data when no search query
      performSearch('', filters);
    }
  }, [searchParams]);

  const performSearch = async (query: string, currentFilters: SearchFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Performing search with:', { query, filters: currentFilters });
      
      // Use the same approach as products page - get all products and filter client-side
      const allProducts = await productApi.getAll();
      const allBusinesses = await businessApi.getAll();
      
      // Filter products based on search query (same logic as products page)
      let filteredProducts = allProducts;
      let filteredBusinesses = allBusinesses;
      
      if (query.trim() !== '') {
        // Filter products
        filteredProducts = allProducts.filter(product =>
          product.title.toLowerCase().includes(query.toLowerCase()) ||
          product.description?.toLowerCase().includes(query.toLowerCase()) ||
          product.businessId.name.toLowerCase().includes(query.toLowerCase())
        );
        
        // Filter businesses
        filteredBusinesses = allBusinesses.filter(business =>
          business.name.toLowerCase().includes(query.toLowerCase()) ||
          business.description?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Separate products and services
      const products = filteredProducts.filter(p => p.type === 'product');
      const services = filteredProducts.filter(p => p.type === 'service');
      
      // Apply type filter
      let finalProducts = products;
      let finalServices = services;
      let finalBusinesses = filteredBusinesses;
      
      if (currentFilters.type === 'product') {
        finalServices = [];
        finalBusinesses = [];
      } else if (currentFilters.type === 'service') {
        finalProducts = [];
        finalBusinesses = [];
      } else if (currentFilters.type === 'business') {
        finalProducts = [];
        finalServices = [];
      }
      
      // Apply price filter
      if (currentFilters.priceMin || currentFilters.priceMax) {
        const minPrice = currentFilters.priceMin ? parseFloat(currentFilters.priceMin) : 0;
        const maxPrice = currentFilters.priceMax ? parseFloat(currentFilters.priceMax) : Infinity;
        
        finalProducts = finalProducts.filter(p => p.price >= minPrice && p.price <= maxPrice);
        finalServices = finalServices.filter(p => p.price >= minPrice && p.price <= maxPrice);
      }
      
      // Apply location filter (simplified - just check business name for now)
      if (currentFilters.location) {
        const locationFilter = currentFilters.location.toLowerCase();
        finalProducts = finalProducts.filter(p => 
          p.businessId.name.toLowerCase().includes(locationFilter)
        );
        finalServices = finalServices.filter(p => 
          p.businessId.name.toLowerCase().includes(locationFilter)
        );
        finalBusinesses = finalBusinesses.filter(b => 
          b.name.toLowerCase().includes(locationFilter)
        );
      }
      
      // Apply category filter (simplified - check if categoryId is an object with name)
      if (currentFilters.category) {
        const categoryFilter = currentFilters.category.toLowerCase();
        finalProducts = finalProducts.filter(p => {
          const productCategoryName = typeof p.categoryId === 'object' ? p.categoryId.name : '';
          return productCategoryName.toLowerCase().includes(categoryFilter);
        });
        finalServices = finalServices.filter(p => {
          const serviceCategoryName = typeof p.categoryId === 'object' ? p.categoryId.name : '';
          return serviceCategoryName.toLowerCase().includes(categoryFilter);
        });
        finalBusinesses = finalBusinesses.filter(b => {
          const businessCategoryName = typeof b.categoryId === 'object' ? b.categoryId.name : '';
          return businessCategoryName.toLowerCase().includes(categoryFilter);
        });
      }
      
      // Apply sorting
      const sortProducts = (items: Product[]) => {
        switch (currentFilters.sortBy) {
          case 'price':
            return [...items].sort((a, b) => a.price - b.price);
          case 'newest':
            return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          default:
            return items;
        }
      };
      
      const sortBusinesses = (items: Business[]) => {
        switch (currentFilters.sortBy) {
          case 'newest':
            return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          default:
            return items;
        }
      };
      
      finalProducts = sortProducts(finalProducts);
      finalServices = sortProducts(finalServices);
      finalBusinesses = sortBusinesses(finalBusinesses);
      
      const searchResults: SearchResults = {
        businesses: finalBusinesses,
        products: finalProducts,
        services: finalServices,
        totalResults: finalProducts.length + finalServices.length + finalBusinesses.length
      };
      
      console.log('Search results:', searchResults);
      setResults(searchResults);
    } catch (error: any) {
      console.error('Search failed:', error);
      setError(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search query
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    performSearch(searchQuery, updatedFilters);
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return results.totalResults;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for businesses, products, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-12 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
              />
              <svg 
                className="absolute left-4 top-4 h-6 w-6 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ type: e.target.value as any })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="business">Businesses</option>
              <option value="product">Products</option>
              <option value="service">Services</option>
            </select>
            
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange({ location: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="text"
              placeholder="Category"
              value={filters.category}
              onChange={(e) => handleFilterChange({ category: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="number"
              placeholder="Min Price"
              value={filters.priceMin}
              onChange={(e) => handleFilterChange({ priceMin: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="number"
              placeholder="Max Price"
              value={filters.priceMax}
              onChange={(e) => handleFilterChange({ priceMax: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Searching...</p>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div>
            {/* Results Summary */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Search Results
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Found {getTotalResults()} result{getTotalResults() !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            {getTotalResults() === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Businesses */}
                {results.businesses.length > 0 && (
                  <BusinessResults businesses={results.businesses} />
                )}

                {/* Products */}
                {results.products.length > 0 && (
                  <ProductResults products={results.products} title="Products" />
                )}

                {/* Services */}
                {results.services.length > 0 && (
                  <ProductResults products={results.services} title="Services" />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Business Results Component
function BusinessResults({ businesses }: { businesses: Business[] }) {
  const router = useRouter();
  
  return (
    <section>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Businesses ({businesses.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <div key={business._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {business.name}
                </h4>
                {business.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {business.description}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              {business.categoryId && (
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {business.categoryId.name}
                </span>
              )}
              {business.locationId && (
                <span>{business.locationId.name}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                business.isVerified 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {business.isVerified ? 'Verified' : 'Unverified'}
              </span>
              
              <button 
                onClick={() => router.push(`/view/business/${business._id}`)}
                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Product/Service Results Component
function ProductResults({ products, title }: { products: Product[]; title: string }) {
  const router = useRouter();
  
  return (
    <section>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {title} ({products.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            {/* Product Image */}
            <div className="aspect-video bg-gray-200 dark:bg-gray-600 overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={`http://localhost:5000/uploads/${product.images[0]}`}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {product.title}
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
                  {product.businessId.name}
                </p>
                {product.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
              
              {product.inventory !== undefined && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {product.inventory > 0 
                    ? `${product.inventory} in stock` 
                    : 'Out of stock'
                  }
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₱{product.price.toLocaleString()}
                </span>
                <button 
                  onClick={() => router.push(`/view/${product.type}/${product._id}`)}
                  disabled={product.inventory === 0}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    product.inventory === 0
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {product.inventory === 0 ? 'Out of Stock' : 'View Details'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
