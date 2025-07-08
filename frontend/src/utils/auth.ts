interface AuthToken {
  token: string;
  userId: string;
  role: 'customer' | 'owner';
  name?: string;
  email?: string;
  exp: number;
}

export const getAuthToken = (): AuthToken | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    // Parse the JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp < currentTime) {
      // Token expired, remove it
      localStorage.removeItem('authToken');
      return null;
    }

    return {
      token,
      userId: payload.userId, // Backend uses 'userId' not 'id'
      role: payload.role,
      name: payload.name || 'User', // Fallback if name not in token
      email: payload.email || '', // Fallback if email not in token
      exp: payload.exp
    };
  } catch (error) {
    console.error('Error parsing auth token:', error);
    // Invalid token, remove it
    localStorage.removeItem('authToken');
    return null;
  }
};

export const getUserInitials = (name?: string): string => {
  if (!name) return 'U';
  
  const nameParts = name.split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

export const logout = (): void => {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
};

export const redirectToLogin = (): void => {
  window.location.href = '/login';
};

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
