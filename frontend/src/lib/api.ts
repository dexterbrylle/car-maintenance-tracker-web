import axios from 'axios';
import { Vehicle, MaintenanceItem, ServiceRecord, DashboardData, FuelRecord, FuelPerformanceMetrics as FuelPerformanceMetricsType, FuelMaintenanceInsightsData } from '../types';
import { cachedFetch, CACHE_KEYS, CACHE_EXPIRY, invalidateVehicleCache } from './cache';
import { debounce } from './debounce';
import { getAccessToken, refreshToken, getAuthHeader, storeTokens, handleApiError } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
  ? '/api'  // Production: proxy through nginx
  : 'http://localhost:5005/api');  // Development

// Create axios instance with default configuration
const axiosInstance = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication and logging
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add authentication header
    const authHeader = getAuthHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    
    // Add CSRF token if available
    const csrfToken = localStorage.getItem('csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          // Update the authorization header with new token
          const authHeader = getAuthHeader();
          if (authHeader.Authorization) {
            originalRequest.headers.Authorization = authHeader.Authorization;
          }
          
          // Retry the original request
          return axiosInstance(originalRequest);
        } else {
          // Refresh failed, logout user
          localStorage.removeItem('car_maintenance_tracker_user_data');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('car_maintenance_tracker_user_data');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }
    
    // Handle other errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url);
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.status);
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    return Promise.reject(error);
  }
);

// API wrapper functions with caching
export const api = {
  // Vehicles
  getVehicles: () => cachedFetch(
    CACHE_KEYS.VEHICLES,
    () => axiosInstance.get<Vehicle[]>(`${API_BASE}/vehicles`).then(res => res.data),
    CACHE_EXPIRY.VEHICLES,
    true // Use memory cache
  ),
  
  addVehicle: async (data: Partial<Vehicle>) => {
    const result = await axiosInstance.post<{ id: string; message: string }>(`${API_BASE}/vehicles`, data);
    // Invalidate vehicles cache after adding
    invalidateVehicleCache(result.data.id || '');
    return result.data;
  },
  
  updateVehicle: async (id: string, data: Partial<Vehicle>) => {
    const result = await axiosInstance.put<{ message: string }>(`${API_BASE}/vehicles/${id}`, data);
    // Invalidate cache for this vehicle
    invalidateVehicleCache(id);
    return result.data;
  },
  
  updateVehicleMileage: async (id: string, mileage: number) => {
    const result = await axiosInstance.patch<{ message: string; current_mileage: number }>(`${API_BASE}/vehicles/${id}/mileage`, { current_mileage: mileage });
    // Invalidate cache for this vehicle as mileage affects many calculations
    invalidateVehicleCache(id);
    return result.data;
  },
  
  deleteVehicle: async (id: string) => {
    const result = await axiosInstance.delete<{ message: string }>(`${API_BASE}/vehicles/${id}`);
    // Invalidate cache for this vehicle
    invalidateVehicleCache(id);
    return result.data;
  },

  // Dashboard
  getDashboard: (vehicleId: string) => cachedFetch(
    CACHE_KEYS.DASHBOARD_DATA(vehicleId),
    () => axiosInstance.get<DashboardData>(`${API_BASE}/dashboard/${vehicleId}`).then(res => res.data),
    CACHE_EXPIRY.DASHBOARD_DATA,
    true // Use memory cache for frequent access
  ),

  // Maintenance
  getMaintenance: (vehicleId: string) => cachedFetch(
    CACHE_KEYS.MAINTENANCE_ITEMS(vehicleId),
    () => axiosInstance.get<MaintenanceItem[]>(`${API_BASE}/maintenance/simple/${vehicleId}`).then(res => res.data),
    CACHE_EXPIRY.MAINTENANCE_ITEMS,
    true
  ),
  
  addMaintenanceItem: async (data: Partial<MaintenanceItem>) => {
    const result = await axiosInstance.post<{ id: string; message: string }>(`${API_BASE}/maintenance`, data);
    // Invalidate maintenance cache for this vehicle
    invalidateVehicleCache(data.vehicle_id || '');
    return result.data;
  },

  // Services
  getServices: (vehicleId: string) => cachedFetch(
    CACHE_KEYS.SERVICE_RECORDS(vehicleId),
    () => axiosInstance.get<ServiceRecord[]>(`${API_BASE}/services/${vehicleId}`).then(res => res.data),
    CACHE_EXPIRY.SERVICE_RECORDS,
    false // Don't use memory cache for service records (changes frequently)
  ),
  
  addService: async (data: Partial<ServiceRecord>) => {
    const result = await axiosInstance.post<{ id: string; message: string }>(`${API_BASE}/services`, data);
    // Invalidate cache for this vehicle
    invalidateVehicleCache(data.vehicle_id || '');
    return result.data;
  },
  
  updateService: async (id: string, data: Partial<ServiceRecord>) => {
    const result = await axiosInstance.put<{ message: string }>(`${API_BASE}/services/${id}`, data);
    // We don't have vehicle_id here, so we'll invalidate all vehicle caches
    // In a real app, you'd want to include vehicle_id in the response
    return result.data;
  },
  
  deleteService: async (id: string) => {
    const result = await axiosInstance.delete<{ message: string }>(`${API_BASE}/services/${id}`);
    // Similar to update, we don't have vehicle_id
    return result.data;
  },

  // Health check
  healthCheck: () => axiosInstance.get<{ status: string; database?: string }>(`${API_BASE}/health`),
  
  // Export
  exportServiceHistory: (vehicleId: string) =>
    axiosInstance.get(`${API_BASE}/services/export/${vehicleId}`, { responseType: 'blob' }),
  exportFuelHistory: (vehicleId: string) =>
    axiosInstance.get(`${API_BASE}/fillups/export/${vehicleId}`, { responseType: 'blob' }),
  exportMaintenanceSchedule: (vehicleId: string) =>
    axiosInstance.get(`${API_BASE}/maintenance/export/${vehicleId}`, { responseType: 'blob' }),
  exportVehicleInfo: (vehicleId: string) =>
    axiosInstance.get(`${API_BASE}/vehicles/export/${vehicleId}`, { responseType: 'blob' }),
  exportCombinedReport: (vehicleId: string) =>
    axiosInstance.get(`${API_BASE}/export/combined/${vehicleId}`, { responseType: 'blob' }),
  
  // Maintenance Schedule
  getMaintenanceSchedule: (vehicleId: string) =>
    axiosInstance.get(`${API_BASE}/maintenance/${vehicleId}`).then(res => res.data),

  // Fuel Records
  getFuelRecords: (vehicleId: string) => cachedFetch(
    CACHE_KEYS.FUEL_RECORDS(vehicleId),
    () => axiosInstance.get<FuelRecord[]>(`${API_BASE}/fillups/${vehicleId}`).then(res => res.data),
    CACHE_EXPIRY.FUEL_RECORDS,
    false // Don't use memory cache for fuel records (changes frequently)
  ),
  
  addFuelRecord: async (data: Partial<FuelRecord>) => {
    const result = await axiosInstance.post<{ id: string; message: string }>(`${API_BASE}/fillups`, data);
    // Invalidate cache for this vehicle
    invalidateVehicleCache(data.vehicle_id || '');
    return result.data;
  },
  
  updateFuelRecord: async (id: string, data: Partial<FuelRecord>) => {
    const result = await axiosInstance.put<{ message: string }>(`${API_BASE}/fillups/${id}`, data);
    // Invalidate cache for this vehicle
    // In a real app, you'd want to include vehicle_id in the response
    return result.data;
  },
  
  deleteFuelRecord: async (id: string) => {
    const result = await axiosInstance.delete<{ message: string }>(`${API_BASE}/fillups/${id}`);
    // Similar to update, we don't have vehicle_id
    return result.data;
  },
  
  // Fuel Performance Metrics
  getFuelPerformanceMetrics: (vehicleId: string) => cachedFetch(
    CACHE_KEYS.FUEL_METRICS(vehicleId),
    () => axiosInstance.get<FuelPerformanceMetricsType>(`${API_BASE}/fillups/stats/${vehicleId}`).then(res => res.data),
    CACHE_EXPIRY.FUEL_METRICS,
    true // Use memory cache for metrics
  ),
  
  // Fuel Maintenance Insights
  getFuelMaintenanceInsights: (vehicleId: string) =>
    axiosInstance.get<FuelMaintenanceInsightsData>(`${API_BASE}/dashboard/${vehicleId}/insights`),
  
  // Recent fill-ups for dashboard
  getRecentFillups: (vehicleId: string, limit = 5) =>
    axiosInstance.get<FuelRecord[]>(`${API_BASE}/fillups/${vehicleId}?limit=${limit}`),
  
  // Enhanced dashboard with fuel data
  getEnhancedDashboard: (vehicleId: string) => cachedFetch(
    CACHE_KEYS.DASHBOARD_DATA(vehicleId),
    () => axiosInstance.get<DashboardData>(`${API_BASE}/dashboard/${vehicleId}`).then(res => res.data),
    CACHE_EXPIRY.DASHBOARD_DATA,
    true // Use memory cache for frequent access
  ),

  // Authentication endpoints
  auth: {
    // Login
    login: async (credentials: { email: string; password: string; remember_me?: boolean }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/login`, credentials);
      return response.data;
    },

    // Register
    register: async (data: { 
      email: string; 
      password: string; 
      first_name: string; 
      last_name: string; 
      phone?: string;
      timezone?: string;
      accept_terms: boolean;
      newsletter_opt_in?: boolean;
    }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/register`, data);
      return response.data;
    },

    // Logout
    logout: async (data?: { refresh_token?: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/logout`, data);
      return response.data;
    },

    // Refresh token
    refreshToken: async (data: { refresh_token: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/refresh-token`, data);
      return response.data;
    },

    // Update profile
    updateProfile: async (data: Partial<{
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      timezone: string;
      preferences: {
        theme: 'light' | 'dark' | 'system';
        notifications: {
          email: boolean;
          push: boolean;
          maintenance_reminders: boolean;
          fuel_alerts: boolean;
          subscription_reminders: boolean;
        };
        currency: string;
        distance_unit: 'km' | 'mi';
        fuel_unit: 'L' | 'gal';
        timezone: string;
        language: string;
      };
    }>) => {
      const response = await axiosInstance.put(`${API_BASE}/auth/profile`, data);
      return response.data;
    },

    // Change password
    changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/change-password`, data);
      return response.data;
    },

    // Forgot password
    forgotPassword: async (data: { email: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/forgot-password`, data);
      return response.data;
    },

    // Reset password
    resetPassword: async (data: { token: string; password: string; confirm_password: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/reset-password`, data);
      return response.data;
    },

    // Verify email
    verifyEmail: async (data: { token: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/verify-email`, data);
      return response.data;
    },

    // Request email verification
    requestEmailVerification: async () => {
      const response = await axiosInstance.post(`${API_BASE}/auth/request-email-verification`);
      return response.data;
    },

    // Get subscription info
    getSubscription: async () => {
      const response = await axiosInstance.get(`${API_BASE}/auth/subscription`);
      return response.data;
    },

    // Update subscription
    updateSubscription: async (data: { tier: string; payment_method_id?: string }) => {
      const response = await axiosInstance.put(`${API_BASE}/auth/subscription`, data);
      return response.data;
    },

    // Cancel subscription
    cancelSubscription: async () => {
      const response = await axiosInstance.delete(`${API_BASE}/auth/subscription`);
      return response.data;
    },

    // Reactivate subscription
    reactivateSubscription: async () => {
      const response = await axiosInstance.post(`${API_BASE}/auth/subscription/reactivate`);
      return response.data;
    },

    // Get subscription plans
    getSubscriptionPlans: async () => {
      const response = await axiosInstance.get(`${API_BASE}/auth/subscription/plans`);
      return response.data;
    },

    // Get user profile
    getProfile: async () => {
      const response = await axiosInstance.get(`${API_BASE}/auth/profile`);
      return response.data;
    },

    // Get usage stats
    getUsageStats: async () => {
      const response = await axiosInstance.get(`${API_BASE}/auth/usage-stats`);
      return response.data;
    },

    // Get activity log
    getActivityLog: async (limit?: number, offset?: number) => {
      const response = await axiosInstance.get(`${API_BASE}/auth/activity-log`, {
        params: { limit, offset }
      });
      return response.data;
    },

    // Update security settings
    updateSecuritySettings: async (data: {
      two_factor_enabled?: boolean;
      login_notifications?: boolean;
      session_timeout?: number;
    }) => {
      const response = await axiosInstance.put(`${API_BASE}/auth/security-settings`, data);
      return response.data;
    },

    // Get security settings
    getSecuritySettings: async () => {
      const response = await axiosInstance.get(`${API_BASE}/auth/security-settings`);
      return response.data;
    },

    // Social login
    socialLogin: async (data: { provider: string; access_token: string; email?: string; first_name?: string; last_name?: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/social-login`, data);
      return response.data;
    },

    // Social login callback
    socialLoginCallback: async (data: { provider: string; code: string; state?: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/auth/social-login/callback`, data);
      return response.data;
    },
  },

  // Payment endpoints
  payments: {
    // Get payment methods
    getPaymentMethods: async () => {
      const response = await axiosInstance.get(`${API_BASE}/payments/methods`);
      return response.data;
    },

    // Add payment method
    addPaymentMethod: async (data: { payment_method_id: string; is_default?: boolean }) => {
      const response = await axiosInstance.post(`${API_BASE}/payments/methods`, data);
      return response.data;
    },

    // Remove payment method
    removePaymentMethod: async (paymentMethodId: string) => {
      const response = await axiosInstance.delete(`${API_BASE}/payments/methods/${paymentMethodId}`);
      return response.data;
    },

    // Set default payment method
    setDefaultPaymentMethod: async (paymentMethodId: string) => {
      const response = await axiosInstance.put(`${API_BASE}/payments/methods/${paymentMethodId}/default`);
      return response.data;
    },

    // Get invoices
    getInvoices: async (limit?: number, offset?: number) => {
      const response = await axiosInstance.get(`${API_BASE}/payments/invoices`, {
        params: { limit, offset }
      });
      return response.data;
    },

    // Get invoice PDF
    getInvoicePdf: async (invoiceId: string) => {
      const response = await axiosInstance.get(`${API_BASE}/payments/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    },

    // Get payment history
    getPaymentHistory: async () => {
      const response = await axiosInstance.get(`${API_BASE}/payments/history`);
      return response.data;
    },
  },

  // Webhook endpoints (for real-time updates)
  webhooks: {
    // Create webhook
    createWebhook: async (data: { url: string; events: string[]; secret?: string }) => {
      const response = await axiosInstance.post(`${API_BASE}/webhooks`, data);
      return response.data;
    },

    // Get webhooks
    getWebhooks: async () => {
      const response = await axiosInstance.get(`${API_BASE}/webhooks`);
      return response.data;
    },

    // Update webhook
    updateWebhook: async (webhookId: string, data: { url?: string; events?: string[]; secret?: string; is_active?: boolean }) => {
      const response = await axiosInstance.put(`${API_BASE}/webhooks/${webhookId}`, data);
      return response.data;
    },

    // Delete webhook
    deleteWebhook: async (webhookId: string) => {
      const response = await axiosInstance.delete(`${API_BASE}/webhooks/${webhookId}`);
      return response.data;
    },

    // Test webhook
    testWebhook: async (webhookId: string) => {
      const response = await axiosInstance.post(`${API_BASE}/webhooks/${webhookId}/test`);
      return response.data;
    },
  },
};

// Debounced search functions
export const debouncedSearch = {
  searchVehicles: debounce((query: string, callback: (results: Vehicle[]) => void) => {
    api.getVehicles().then(vehicles => {
      const filtered = vehicles.filter(v => 
        v.make.toLowerCase().includes(query.toLowerCase()) ||
        v.model.toLowerCase().includes(query.toLowerCase())
      );
      callback(filtered);
    });
  }, 300),
  
  searchServices: debounce((vehicleId: string, query: string, callback: (results: ServiceRecord[]) => void) => {
    api.getServices(vehicleId).then(services => {
      const filtered = services.filter(s => 
        s.notes?.toLowerCase().includes(query.toLowerCase())
      );
      callback(filtered);
    });
  }, 300),
  
  searchFuelRecords: debounce((vehicleId: string, query: string, callback: (results: FuelRecord[]) => void) => {
    api.getFuelRecords(vehicleId).then(records => {
      const filtered = records.filter(r => 
        r.notes?.toLowerCase().includes(query.toLowerCase()) ||
        r.odometer_km.toString().includes(query)
      );
      callback(filtered);
    });
  }, 300),
};