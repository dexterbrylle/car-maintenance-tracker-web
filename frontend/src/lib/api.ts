import axios from 'axios';
import { Vehicle, MaintenanceItem, ServiceRecord, DashboardData, FuelRecord, FuelPerformanceMetrics as FuelPerformanceMetricsType, FuelMaintenanceInsightsData } from '../types';
import { cachedFetch, CACHE_KEYS, CACHE_EXPIRY, invalidateVehicleCache } from './cache';
import { debounce } from './debounce';

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

// Request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
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

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config?.url);
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    if (error.response?.status === 401) {
      console.error('Unauthorized access');
      return Promise.reject(new Error('Unauthorized access'));
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