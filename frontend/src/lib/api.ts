import axios from 'axios';
import { Vehicle, MaintenanceItem, ServiceRecord, DashboardData } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
  ? '/api'  // Production: proxy through nginx
  : 'http://localhost:3001/api');  // Development

export const api = {
  // Vehicles
  getVehicles: () => axios.get<Vehicle[]>(`${API_BASE}/vehicles`),
  addVehicle: (data: Partial<Vehicle>) => axios.post<{ id: string; message: string }>(`${API_BASE}/vehicles`, data),
  updateVehicle: (id: string, data: Partial<Vehicle>) =>
    axios.put<{ message: string }>(`${API_BASE}/vehicles/${id}`, data),
  updateVehicleMileage: (id: string, mileage: number) =>
    axios.patch<{ message: string; current_mileage: number }>(`${API_BASE}/vehicles/${id}/mileage`, { current_mileage: mileage }),
  deleteVehicle: (id: string) =>
    axios.delete<{ message: string }>(`${API_BASE}/vehicles/${id}`),

  // Dashboard
  getDashboard: (vehicleId: string) =>
    axios.get<DashboardData>(`${API_BASE}/dashboard/${vehicleId}`),

  // Maintenance
  getMaintenance: (vehicleId: string) =>
    axios.get<MaintenanceItem[]>(`${API_BASE}/maintenance/simple/${vehicleId}`),
  addMaintenanceItem: (data: Partial<MaintenanceItem>) =>
    axios.post<{ id: string; message: string }>(`${API_BASE}/maintenance`, data),

  // Services
  getServices: (vehicleId: string) =>
    axios.get<ServiceRecord[]>(`${API_BASE}/services/${vehicleId}`),
  addService: (data: Partial<ServiceRecord>) =>
    axios.post<{ id: string; message: string }>(`${API_BASE}/services`, data),
  updateService: (id: string, data: Partial<ServiceRecord>) =>
    axios.put<{ message: string }>(`${API_BASE}/services/${id}`, data),
  deleteService: (id: string) =>
    axios.delete<{ message: string }>(`${API_BASE}/services/${id}`),

  // Health check
  healthCheck: () => axios.get<{ status: string; database?: string }>(`${API_BASE}/health`),
  
  // Export
  exportServiceHistory: (vehicleId: string) =>
    axios.get(`${API_BASE}/services/export/${vehicleId}`, { responseType: 'blob' }),
  
  // Maintenance Schedule
  getMaintenanceSchedule: (vehicleId: string) =>
    axios.get(`${API_BASE}/maintenance/${vehicleId}`),
};