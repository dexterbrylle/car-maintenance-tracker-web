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
  fuel_performance: FuelPerformanceMetrics | null;
  insights: any[];
  maintenance: {
    due_now: DashboardMaintenanceItem[];
    due_soon: DashboardMaintenanceItem[];
    ok: DashboardMaintenanceItem[];
  };
  vehicle: Vehicle;
}

export interface DashboardMaintenanceItem {
  maintenance_item: MaintenanceItem;
  miles_overdue?: number;
  miles_until_due?: number;
  last_service_date?: string;
  last_service_mileage?: number;
  due_at_mileage?: number;
}

export interface FuelRecord {
  _id: string;
  vehicle_id: string;
  date: string;
  odometer_km: number;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  full_tank?: boolean;
  notes?: string;
  created_at: string;
  fuel_economy_kmpl?: number;
  cost_per_km?: number;
}

export interface FuelPerformanceMetrics {
  avg_fuel_economy: number | null;
  best_fuel_economy: number | null;
  worst_fuel_economy: number | null;
  avg_cost_per_km: number | null;
  total_fuel_cost_ytd: number;
  total_fillups: number;
  last_fillup_date: string | null;
  monthly_fuel_cost?: Array<{
    month: string;
    total_cost: number;
    total_liters: number;
    fillup_count: number;
    avg_economy: number | null;
  }>;
  trend_percent?: number;
  total_distance_traveled?: number;
  total_fuel_cost?: number;
}

export interface FuelMaintenanceInsight {
  id: string;
  type: 'efficiency_decline' | 'maintenance_correlation' | 'performance_improvement' | 'cost_anomaly';
  severity: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  recommendation: string;
  confidence: number;
  related_maintenance?: string[];
  fuel_economy_impact?: number;
  cost_impact?: number;
  created_at: string;
}

export interface MaintenancePrediction {
  id: string;
  type: 'air_filter' | 'oil_change' | 'spark_plugs' | 'tire_pressure' | 'fuel_injector' | 'general';
  confidence: number;
  description: string;
  recommended_action: string;
  urgency: 'low' | 'medium' | 'high';
  estimated_cost_impact?: number;
  fuel_economy_improvement?: number;
  timeframe: string;
}

export interface FuelSummary {
  current_efficiency: number | null;
  efficiency_trend: 'improving' | 'declining' | 'stable';
  trend_percentage: number;
  avg_cost_per_km: number | null;
  total_cost_ytd: number;
  last_record_date: string | null;
  efficiency_rating: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export interface FuelMaintenanceInsightsData {
  insights: FuelMaintenanceInsight[];
  predictions: MaintenancePrediction[];
  fuel_summary: FuelSummary;
}
