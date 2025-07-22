'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { businessApi, productApi, type Business, type Product, type Category } from '@/utils/api';
import Link from 'next/link';
import Image from 'next/image';

interface CreateProductRequest {
  title: string;
  description?: string;
  price: number;
  categoryId: string;
  type: 'product' | 'service';
  inventory?: number;
  images?: File[];
}

interface UpdateProductRequest {
  title: string;
  description?: string;
  price: number;
  categoryId: string;
  type: 'product' | 'service';
  inventory?: number;
  images?: File[];
}

export default function ManageProductsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form states
  const [createFormData, setCreateFormData] = useState<CreateProductRequest>({
    title: '',
    description: '',
    price: 0,
    categoryId: '',
    type: 'product',
    inventory: 0,
  });

  const [editFormData, setEditFormData] = useState<UpdateProductRequest>({
    title: '',
    description: '',
    price: 0,
    categoryId: '',
    type: 'product',
    inventory: 0,
  });

  // Image states
  const [createImages, setCreateImages] = useState<File[]>([]);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [createImagePreviews, setCreateImagePreviews] = useState<string[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);

  // Loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (businessId) {
      loadData();
    }
  }, [businessId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [businessData, productsData, categoriesData] = await Promise.all([
        businessApi.getById(businessId),
        productApi.getByBusiness(businessId),
        businessApi.getCategories()
      ]);

      setBusiness(businessData);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageChange = (files: FileList | null, isEdit = false) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const previews: string[] = [];

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        previews.push(result);
        
        if (previews.length === newFiles.length) {
          if (isEdit) {
            setEditImages(prev => [...prev, ...newFiles]);
            setEditImagePreviews(prev => [...prev, ...previews]);
          } else {
            setCreateImages(prev => [...prev, ...newFiles]);
            setCreateImagePreviews(prev => [...prev, ...previews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditImages(prev => prev.filter((_, i) => i !== index));
      setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      setCreateImages(prev => prev.filter((_, i) => i !== index));
      setCreateImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreateLoading(true);
      
      const productData = {
        ...createFormData,
        businessId,
        images: createImages
      };

      await productApi.create(productData);
      
      // Reset form and reload products
      setCreateFormData({
        title: '',
        description: '',
        price: 0,
        categoryId: '',
        type: 'product',
        inventory: 0,
      });
      setCreateImages([]);
      setCreateImagePreviews([]);
      setShowCreateModal(false);
      
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditFormData({
      title: product.title,
      description: product.description || '',
      price: product.price,
      categoryId: typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId,
      type: product.type,
      inventory: product.inventory || 0,
    });
    
    // Set existing images as previews
    if (product.images && product.images.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      setEditImagePreviews(product.images.map(img => `${baseUrl}/uploads/${img}`));
    }
    
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    try {
      setEditLoading(true);
      
      const updateData = {
        ...editFormData,
        images: editImages.length > 0 ? editImages : undefined
      };

      await productApi.update(selectedProduct._id, updateData);
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setEditImages([]);
      setEditImagePreviews([]);
      
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      
      await productApi.delete(selectedProduct._id);
      
      setShowDeleteModal(false);
      setSelectedProduct(null);
      
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Manage Products
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {business?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Products Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 p-8">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No products yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by adding your first product or service
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Your First Product
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Your Products & Services
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Showing {products.length} items
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product._id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      {/* Product Image */}
                      {product.images && product.images.length > 0 ? (
                        <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 overflow-hidden">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${product.images[0]}`}
                            alt={product.title}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                          {product.description || 'No description'}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Price:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ₱{product.price.toLocaleString()}
                            </span>
                          </div>
                          
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

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Category:</span>
                            <span className="text-gray-900 dark:text-white">
                              {typeof product.categoryId === 'object' ? product.categoryId.name : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Product</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      title: '',
                      description: '',
                      price: 0,
                      categoryId: '',
                      type: 'product',
                      inventory: 0,
                    });
                    setCreateImages([]);
                    setCreateImagePreviews([]);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="create-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="create-title"
                    name="title"
                    value={createFormData.title}
                    onChange={handleCreateInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Product or service name"
                  />
                </div>

                <div>
                  <label htmlFor="create-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
                  <select
                    id="create-type"
                    name="type"
                    value={createFormData.type}
                    onChange={handleCreateInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="create-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="create-description"
                  name="description"
                  value={createFormData.description}
                  onChange={handleCreateInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your product or service..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="create-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    id="create-price"
                    name="price"
                    value={createFormData.price}
                    onChange={handleCreateInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="create-categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    id="create-categoryId"
                    name="categoryId"
                    value={createFormData.categoryId}
                    onChange={handleCreateInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {createFormData.type === 'product' && (
                  <div>
                    <label htmlFor="create-inventory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      id="create-inventory"
                      name="inventory"
                      value={createFormData.inventory}
                      onChange={handleCreateInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files)}
                      className="hidden"
                      id="create-images"
                    />
                    <label htmlFor="create-images" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload images
                      </span>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </label>
                  </div>

                  {createImagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {createImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      title: '',
                      description: '',
                      price: 0,
                      categoryId: '',
                      type: 'product',
                      inventory: 0,
                    });
                    setCreateImages([]);
                    setCreateImagePreviews([]);
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={createLoading || !createFormData.title || !createFormData.categoryId || createFormData.price <= 0}
                  className={`px-8 py-3 font-medium rounded-lg transition-colors ${
                    createLoading || !createFormData.title || !createFormData.categoryId || createFormData.price <= 0
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {createLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    setEditImages([]);
                    setEditImagePreviews([]);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Similar form structure as create modal but with edit data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Product or service name"
                  />
                </div>

                <div>
                  <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
                  <select
                    id="edit-type"
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your product or service..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    id="edit-price"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="edit-categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    id="edit-categoryId"
                    name="categoryId"
                    value={editFormData.categoryId}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editFormData.type === 'product' && (
                  <div>
                    <label htmlFor="edit-inventory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      id="edit-inventory"
                      name="inventory"
                      value={editFormData.inventory}
                      onChange={handleEditInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files, true)}
                      className="hidden"
                      id="edit-images"
                    />
                    <label htmlFor="edit-images" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload new images
                      </span>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </label>
                  </div>

                  {editImagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {editImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index, true)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    setEditImages([]);
                    setEditImagePreviews([]);
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={editLoading || !editFormData.title || !editFormData.categoryId || editFormData.price <= 0}
                  className={`px-8 py-3 font-medium rounded-lg transition-colors ${
                    editLoading || !editFormData.title || !editFormData.categoryId || editFormData.price <= 0
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Product
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete "<strong>{selectedProduct.title}</strong>"? 
                This will permanently remove the product and all its data.
              </p>

              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                    deleteLoading
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {deleteLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    'Delete Product'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
