export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  current_mileage: number;
  created_at: string;
}

export interface MaintenanceItem {
  _id: string;
  name: string;
  category: string;
  interval_km: number;
  description?: string;
  vehicle_id: string;
}

export interface ServiceRecord {
  _id: string;
  vehicle_id: string;
  maintenance_item_id: string;
  date: string;
  mileage: number;
  cost: number;
  notes?: string;
  created_at: string;
}

export interface DashboardData {
  due_now: MaintenanceItem[];
  due_soon: MaintenanceItem[];
  ok: MaintenanceItem[];
}