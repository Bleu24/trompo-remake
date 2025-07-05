'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';

interface SearchResults {
  totalResults: number;
  businesses?: any[];
  products?: any[];
  services?: any[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
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
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: query,
        ...filters
      });
      
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filter Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
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
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
            
            <input
              type="text"
              placeholder="Category"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="relevance">Most Relevant</option>
              <option value="price">Price: Low to High</option>
              <option value="newest">Newest First</option>
            </select>
            
            <button
              onClick={() => performSearch(searchParams.get('q') || '')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Searching...</p>
          </div>
        ) : results ? (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold mb-2">
                Search Results for "{searchParams.get('q')}"
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Found {results.totalResults} results
              </p>
            </div>

            {/* Business Results */}
            {(results.businesses?.length ?? 0) > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Businesses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.businesses?.map((business: any) => (
                    <div key={business._id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
                      <h4 className="font-semibold text-lg mb-2">{business.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{business.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-600">{business.categoryId?.name}</span>
                        <span className="text-sm text-gray-500">{business.locationId?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Results */}
            {(results.products?.length ?? 0) > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.products?.map((product: any) => (
                    <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
                      <h4 className="font-semibold text-lg mb-2">{product.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-600">${product.price}</span>
                        <span className="text-sm text-gray-500">{product.businessId?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Results */}
            {(results.services?.length ?? 0) > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.services?.map((service: any) => (
                    <div key={service._id} className="border rounded-lg p-4 hover:shadow-md transition duration-200">
                      <h4 className="font-semibold text-lg mb-2">{service.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-600">${service.price}</span>
                        <span className="text-sm text-gray-500">{service.businessId?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
}