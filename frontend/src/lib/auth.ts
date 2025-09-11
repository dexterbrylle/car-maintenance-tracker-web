import axios from 'axios';
import { AuthTokens } from '@/types/auth';

// Local storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'car_maintenance_tracker_access_token',
  REFRESH_TOKEN: 'car_maintenance_tracker_refresh_token',
  TOKEN_EXPIRY: 'car_maintenance_tracker_token_expiry',
};

// Get stored access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

// Get stored refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// Check if token is expired or needs refresh
export const isTokenExpired = (): boolean => {
  const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiryTime) return true;
  
  const expiry = parseInt(expiryTime, 10);
  const buffer = 5 * 60 * 1000; // 5 minutes buffer
  return Date.now() >= (expiry - buffer);
};

// Store tokens in localStorage
export const storeTokens = (tokens: AuthTokens): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
  const expiryTime = Date.now() + (tokens.expires_in * 1000);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
};

// Clear tokens from localStorage
export const clearTokens = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
};

// Get authorization header
export const getAuthHeader = (): { Authorization: string } | Record<string, never> => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Decode JWT token (simple version - for production use proper JWT library)
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// Check if token is valid (not expired)
export const isTokenValid = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return false;
  
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() < expiryTime;
};

// Get token payload
export const getTokenPayload = (): any => {
  const token = getAccessToken();
  if (!token) return null;
  
  return decodeToken(token);
};

// Get user ID from token
export const getUserIdFromToken = (): string | null => {
  const payload = getTokenPayload();
  return payload?.sub || payload?.user_id || null;
};

// Get token expiry time
export const getTokenExpiryTime = (): number | null => {
  const payload = getTokenPayload();
  return payload?.exp ? payload.exp * 1000 : null; // Convert to milliseconds
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate strength
  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[a-z]/.test(password)) strengthScore++;
  if (/\d/.test(password)) strengthScore++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (strengthScore >= 4) strength = 'medium';
  if (strengthScore >= 6) strength = 'strong';
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Generate random string for CSRF token
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Store CSRF token
export const storeCSRFToken = (): void => {
  const token = generateCSRFToken();
  localStorage.setItem('csrf_token', token);
};

// Get CSRF token
export const getCSRFToken = (): string | null => {
  return localStorage.getItem('csrf_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token && !isTokenExpired() && isTokenValid(token);
};

// Get authentication state
export const getAuthState = (): {
  isAuthenticated: boolean;
  token: string | null;
  isExpired: boolean;
  userId: string | null;
  expiryTime: number | null;
} => {
  const token = getAccessToken();
  const userId = getUserIdFromToken();
  const expiryTime = getTokenExpiryTime();
  
  return {
    isAuthenticated: !!token && !isTokenExpired() && isTokenValid(token),
    token,
    isExpired: isTokenExpired(),
    userId,
    expiryTime,
  };
};

// Logout function
export const logout = (): void => {
  clearTokens();
  // Clear other auth-related data
  localStorage.removeItem('car_maintenance_tracker_user_data');
  localStorage.removeItem('csrf_token');
};

// Refresh token function
export const refreshToken = async (): Promise<boolean> => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    return false;
  }

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/auth/refresh-token`,
      { refresh_token: refreshTokenValue },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCSRFToken(),
        },
      }
    );

    if (response.status === 200 && response.data) {
      const newTokens: AuthTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshTokenValue,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type || 'Bearer',
      };
      
      storeTokens(newTokens);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Format date for display
export const formatDate = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  
  if (format === 'short') {
    return date.toLocaleDateString();
  }
  
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate time since date
export const timeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};

// Debounce function for API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Retry function for failed API calls
export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw new Error('Max retries reached');
};

// Handle API errors
export const handleApiError = (error: any): { message: string; code: string; details?: any } => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    switch (status) {
      case 401:
        return { message: 'Unauthorized access', code: 'UNAUTHORIZED' };
      case 403:
        return { message: 'Access forbidden', code: 'FORBIDDEN' };
      case 404:
        return { message: 'Resource not found', code: 'NOT_FOUND' };
      case 429:
        return { message: 'Too many requests', code: 'RATE_LIMITED' };
      case 500:
        return { message: 'Internal server error', code: 'SERVER_ERROR' };
      default:
        return {
          message: data?.message || error.message || 'Unknown error occurred',
          code: data?.code || 'UNKNOWN_ERROR',
          details: data,
        };
    }
  }
  
  return {
    message: error.message || 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: error,
  };
};