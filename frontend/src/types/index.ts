export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  current_mileage: number;
  purchase_mileage: number;
  created_at: string;
}

export interface MaintenanceItem {
  _id: string;
  name: string;
  category: string;
  interval_km: number;
  description?: string;
  action?: string;
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
  maintenance_item?: {
    id: string;
    name: string;
    category: string;
    action: string;
  };
}

export interface DashboardData {
  vehicle: Vehicle;
  due_now: DashboardMaintenanceItem[];
  due_soon: DashboardMaintenanceItem[];
  ok: DashboardMaintenanceItem[];
}

export interface DashboardMaintenanceItem {
  maintenance_item: MaintenanceItem;
  miles_overdue?: number;
  miles_until_due?: number;
  last_service_date?: string;
  last_service_mileage?: number;
  due_at_mileage?: number;
}
