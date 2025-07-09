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

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
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

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/owner/verification/request`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type to let browser set it with boundary for FormData
      },
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

// Types
export interface Product {
  _id: string;
  businessId: {
    _id: string;
    name: string;
  };
  title: string;
  description: string;
  type: 'product' | 'service';
  price: number;
  inventory?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  _id: string;
  name: string;
  description?: string;
  isVerified: boolean;
  categoryId?: {
    _id: string;
    name: string;
  };
  locationId?: {
    _id: string;
    name: string;
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
  customerId: string;
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
