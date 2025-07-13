const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

const getAuthHeaders = (): Record<string, string> => {
  const authData = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authData) {
    let token: string;
    try {
      // Check if it's a JSON object (from profile update) or just a token string
      const parsed = JSON.parse(authData);
      token = parsed.token || authData; // If it's an object, get the token property
    } catch {
      // If parsing fails, it's just a token string
      token = authData;
    }
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function to extract token for FormData requests (no Content-Type header)
const getAuthHeadersForFormData = (): Record<string, string> => {
  const authData = localStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  
  if (authData) {
    let token: string;
    try {
      // Check if it's a JSON object (from profile update) or just a token string
      const parsed = JSON.parse(authData);
      token = parsed.token || authData; // If it's an object, get the token property
    } catch {
      // If parsing fails, it's just a token string
      token = authData;
    }
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new ApiError(response.status, errorData.message || 'An error occurred');
  }
  return response.json();
};

// Product API
export const productApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Product[]>(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Product>(response);
  },

  getByBusiness: async (businessId: string) => {
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/products`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Product[]>(response);
  },

  create: async (productData: any) => {
    const formData = new FormData();
    formData.append('title', productData.title);
    formData.append('description', productData.description || '');
    formData.append('price', productData.price.toString());
    formData.append('categoryId', productData.categoryId);
    formData.append('type', productData.type);
    formData.append('businessId', productData.businessId);
    
    if (productData.inventory !== undefined) {
      formData.append('inventory', productData.inventory.toString());
    }

    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image: File) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    return handleResponse<{ product: Product }>(response);
  },

  update: async (id: string, productData: any) => {
    const formData = new FormData();
    formData.append('title', productData.title);
    formData.append('description', productData.description || '');
    formData.append('price', productData.price.toString());
    formData.append('categoryId', productData.categoryId);
    formData.append('type', productData.type);
    
    if (productData.inventory !== undefined) {
      formData.append('inventory', productData.inventory.toString());
    }

    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image: File) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    return handleResponse<{ product: Product }>(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },

  search: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Product[]>(response);
  },
};

// Customer API
export const customerApi = {
  getSavedBusinesses: async () => {
    const response = await fetch(`${API_BASE_URL}/customers/saved-businesses`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<SavedBusiness[]>(response);
  },

  getSavedItems: async () => {
    const response = await fetch(`${API_BASE_URL}/customers/saved-items`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      businesses: Business[];
      products: Product[];
      services: Product[];
    }>(response);
  },

  saveItem: async (itemId: string, itemType: 'business' | 'product' | 'service') => {
    const response = await fetch(`${API_BASE_URL}/customers/save-item`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId, itemType }),
    });
    return handleResponse<{ message: string }>(response);
  },

  unsaveItem: async (itemId: string, itemType: 'business' | 'product' | 'service') => {
    const response = await fetch(`${API_BASE_URL}/customers/unsave-item`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId, itemType }),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Transaction API
export const transactionApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Transaction[]>(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Transaction>(response);
  },

  create: async (data: {
    businessId: string;
    sellableId: string;
    amount: number;
    paymentMethod: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Transaction>(response);
  },

  updateStatus: async (id: string, status: 'pending' | 'completed' | 'cancelled') => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<Transaction>(response);
  },
};

// Search API
export const searchApi = {
  globalSearch: async (params: {
    q?: string;
    type?: 'business' | 'product' | 'service' | 'all';
    location?: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'price' | 'newest';
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/search?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    const result = await handleResponse<{ success: boolean; data: SearchResults }>(response);
    return result.data;
  },

  getSuggestions: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ suggestions: SearchSuggestion[] }>(response);
  },
};

// Business API
export const businessApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/businesses`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Business[]>(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Business>(response);
  },

  create: async (businessData: CreateBusinessRequest) => {
    const formData = new FormData();
    formData.append('name', businessData.name);
    formData.append('description', businessData.description || '');
    formData.append('categoryId', businessData.categoryId);
    formData.append('locationId', businessData.locationId);

    if (businessData.coverPhoto) {
      formData.append('coverPhoto', businessData.coverPhoto);
    }
    if (businessData.profilePhoto) {
      formData.append('profilePhoto', businessData.profilePhoto);
    }

    const response = await fetch(`${API_BASE_URL}/businesses`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    return handleResponse<{ message: string; business: Business }>(response);
  },

  update: async (businessId: string, businessData: UpdateBusinessRequest) => {
    const formData = new FormData();
    formData.append('name', businessData.name);
    formData.append('description', businessData.description || '');
    formData.append('categoryId', businessData.categoryId);
    formData.append('locationId', businessData.locationId);

    if (businessData.coverPhoto) {
      formData.append('coverPhoto', businessData.coverPhoto);
    }
    if (businessData.profilePhoto) {
      formData.append('profilePhoto', businessData.profilePhoto);
    }

    // Handle photo deletion flags
    if (businessData.deleteCoverPhoto) {
      formData.append('deleteCoverPhoto', 'true');
    }
    if (businessData.deleteProfilePhoto) {
      formData.append('deleteProfilePhoto', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}`, {
      method: 'PUT',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    return handleResponse<{ message: string; business: Business }>(response);
  },

  // Get categories
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/businesses/categories`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Category[]>(response);
  },

  // Get locations
  getLocations: async () => {
    const response = await fetch(`${API_BASE_URL}/businesses/locations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Location[]>(response);
  },

  // Track business page visit
  trackVisit: async (businessId: string) => {
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/visit`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; notification?: any }>(response);
  },
};

// Chat API
export const chatApi = {
  // Get user's conversations
  getConversations: async () => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Conversation[]>(response);
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ChatMessage[]>(response);
  },

  // Get unread count for a conversation
  getUnreadCount: async (conversationId: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/unread`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ unreadCount: number }>(response);
  },

  // Start a new conversation
  startConversation: async (participantId: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ participantId }),
    });
    return handleResponse<Conversation>(response);
  },

  // Send a message
  sendMessage: async (conversationId: string, text: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ conversationId, text }),
    });
    return handleResponse<ChatMessage>(response);
  },

  // Mark messages as read
  markAsRead: async (conversationId: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; count: number }>(response);
  },

  // Search users
  searchUsers: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/users/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ChatUser[]>(response);
  },
};

// Business Owner API
export const businessOwnerApi = {
  // Get owner profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/owner/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BusinessOwner>(response);
  },

  // Get owner's businesses
  getMyBusinesses: async () => {
    const response = await fetch(`${API_BASE_URL}/businesses/owner`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Business[]>(response);
  },

  // Get business analytics/KPIs
  getBusinessAnalytics: async (businessId?: string) => {
    const url = businessId 
      ? `${API_BASE_URL}/owner/analytics/${businessId}`
      : `${API_BASE_URL}/owner/analytics`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BusinessAnalytics>(response);
  },

  // Get owner products
  getMyProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/owner/products`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Product[]>(response);
  },

  // Get business transactions/sales
  getBusinessTransactions: async (businessId?: string) => {
    const url = businessId 
      ? `${API_BASE_URL}/owner/transactions/${businessId}`
      : `${API_BASE_URL}/owner/transactions`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Transaction[]>(response);
  },

  // Request business verification
  requestVerification: async (businessId: string, verificationData: VerificationRequest) => {
    const formData = new FormData();
    formData.append('businessId', businessId);
    formData.append('personalId', verificationData.personalId);
    formData.append('businessPermit', verificationData.businessPermit);
    formData.append('notes', verificationData.notes || '');

    const response = await fetch(`${API_BASE_URL}/owner/verification/request`, {
      method: 'POST',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    return handleResponse<{ message: string; requestId: string }>(response);
  },

  // Get verification status
  getVerificationStatus: async (businessId: string) => {
    const response = await fetch(`${API_BASE_URL}/owner/verification/status/${businessId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<VerificationStatus>(response);
  },
};

// Review API
export const reviewApi = {
  // Create a review
  createReview: async (reviewData: { businessId: string; rating: number; comment: string }) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse<{ message: string; review: Review }>(response);
  },

  // Get reviews for a business
  getBusinessReviews: async (businessId: string) => {
    const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/reviews`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Review[]>(response);
  },

  // Update a review
  updateReview: async (reviewId: string, reviewData: { rating?: number; comment?: string }) => {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse<{ message: string; review: Review }>(response);
  },

  // Delete a review
  deleteReview: async (reviewId: string) => {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Types
export interface Product {
  _id: string;
  businessId: {
    _id: string;
    name: string;
    locationId?: {
      _id: string;
      name: string;
      region?: string;
    };
  };
  title: string;
  description?: string;
  type: 'product' | 'service';
  price: number;
  categoryId: {
    _id: string;
    name: string;
  } | string;
  inventory?: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  _id: string;
  name: string;
  description?: string;
  isVerified: boolean;
  coverPhoto?: string;
  profilePhoto?: string;
  categoryId?: {
    _id: string;
    name: string;
  };
  locationId?: {
    _id: string;
    name: string;
    region?: string;
  };
  ownerId?: {
    _id: string;
    userId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SavedBusiness {
  _id: string;
  customerId: string;
  businessId: Business;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  customerId: {
    _id: string;
    userId: {
      _id: string;
      name?: string;
      email: string;
    };
    address?: string;
    phone?: string;
  } | string;
  businessId: {
    _id: string;
    name: string;
  } | string;
  sellableId: {
    _id: string;
    title: string;
    price: number;
  } | string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResults {
  businesses: Business[];
  products: Product[];
  services: Product[]; // Services use the same structure as products
  totalResults: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'business' | 'product' | 'service';
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'order_placed' | 'order_confirmed' | 'order_completed' | 'order_cancelled' 
       | 'payment_received' | 'review_received' | 'business_verified' 
       | 'verification_rejected' | 'message_received' | 'dispute_opened' 
       | 'dispute_resolved' | 'business_visited' | 'upcoming_order';
  title: string;
  message: string;
  data: {
    transactionId?: string;
    businessId?: string;
    orderId?: string;
    reviewId?: string;
    conversationId?: string;
    disputeId?: string;
    amount?: number;
    customerName?: string;
    businessName?: string;
    visitorId?: string;
    customerId?: string;
  };
  read: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: ChatUser[];
  lastMessage?: {
    _id: string;
    text: string;
    createdAt: string;
    senderId: {
      _id: string;
      name: string;
    };
  };
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  text: string;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Business Owner types
export interface BusinessOwner {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessAnalytics {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  recentSales: Transaction[];
  topProducts: Array<{
    product: Product;
    totalSales: number;
    totalRevenue: number;
  }>;
  salesOverTime: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  customerRetention: number;
}

export interface OwnerDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  pageViews: number;
  conversionRate: number;
  averageOrderValue: number;
}

// Verification types
export interface VerificationRequest {
  personalId: File;
  businessPermit: File;
  notes?: string;
}

export interface VerificationStatus {
  _id: string;
  businessId: string;
  status: 'pending' | 'approved' | 'rejected';
  personalIdUrl?: string;
  businessPermitUrl?: string;
  notes?: string;
  adminNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// Additional types for business creation
export interface CreateBusinessRequest {
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  coverPhoto?: File;
  profilePhoto?: File;
}

export interface UpdateBusinessRequest {
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  coverPhoto?: File;
  profilePhoto?: File;
  deleteCoverPhoto?: boolean;
  deleteProfilePhoto?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  _id: string;
  name: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

// User profile types
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  profilePicture?: File;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User API
export const userApi = {
  // Update profile
  updateProfile: async (profileData: UpdateProfileRequest) => {
    const formData = new FormData();
    if (profileData.name) formData.append('name', profileData.name);
    if (profileData.email) formData.append('email', profileData.email);
    if (profileData.profilePicture) formData.append('profilePicture', profileData.profilePicture);

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeadersForFormData(),
      body: formData,
    });
    return handleResponse<{ message: string; user: any }>(response);
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordRequest) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });
    return handleResponse<{ message: string }>(response);
  },

  // Delete account
  deleteAccount: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Notification API
export const notificationApi = {
  // Get user notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly.toString());

    const response = await fetch(`${API_BASE_URL}/notifications?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      notifications: Notification[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalNotifications: number;
        hasMore: boolean;
      };
      unreadCount: number;
    }>(response);
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ unreadCount: number }>(response);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; notification: Notification }>(response);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Review interface
export interface Review {
  _id: string;
  customerId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
  };
  businessId: string | Business;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
