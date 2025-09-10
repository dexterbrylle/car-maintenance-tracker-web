import { Lightbulb, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { Vehicle, ServiceRecord, MaintenanceItem } from "@/types"

interface MaintenanceInsightsProps {
  vehicle: Vehicle;
  completedServices: ServiceRecord[];
  upcomingMaintenance: MaintenanceItem[];
  dueNowItems?: MaintenanceItem[];
}

export function MaintenanceInsights({ vehicle, completedServices, upcomingMaintenance, dueNowItems = [] }: MaintenanceInsightsProps) {
  function getNextServiceMileage(currentMileage: number): number {
    return Math.ceil(currentMileage / 8000) * 8000;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className="premium-card p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Lightbulb className="h-5 w-5 text-slate-700" />
        <h3 className="text-lg font-semibold text-slate-900">Maintenance Insights</h3>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Completed Maintenance */}
        <div>
          <h4 className="mb-3 flex items-center space-x-2 text-sm font-medium text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Recent Services</span>
          </h4>
          <div className="space-y-2">
            {completedServices.length > 0 ? (
              completedServices.slice(0, 3).map(service => (
                <div key={service._id} className="text-sm text-slate-600">
                  <div className="font-medium">{formatDate(service.date)}</div>
                  <div className="text-slate-500">{service.mileage.toLocaleString()} km</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No recent services</div>
            )}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div>
          <h4 className="mb-3 flex items-center space-x-2 text-sm font-medium text-slate-900">
            <Calendar className="h-4 w-4 text-amber-600" />
            <span>Next Service ({getNextServiceMileage(vehicle.current_mileage).toLocaleString()} km)</span>
          </h4>
          <div className="space-y-1">
            {dueNowItems.length > 0 ? (
              dueNowItems.slice(0, 4).map(item => (
                <div key={item._id} className="text-sm font-medium text-red-600">
                  {item.name}
                </div>
              ))
            ) : upcomingMaintenance.length > 0 ? (
              upcomingMaintenance.slice(0, 4).map(item => (
                <div key={item._id} className="text-sm text-slate-600">
                  {item.name}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">All services up to date</div>
            )}
          </div>
        </div>

        {/* Important Notes */}
        <div>
          <h4 className="mb-3 flex items-center space-x-2 text-sm font-medium text-slate-900">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span>Service Notes</span>
          </h4>
          <div className="space-y-2 text-sm text-slate-600">
            <div>
              <span className="font-medium">Oil Change:</span> Every 8,000 km
            </div>
            <div>
              <span className="font-medium">Tire Rotation:</span> Every 8,000 km
            </div>
            <div>
              <span className="font-medium">Air Filter:</span> Every 20,000 km
            </div>
            <div>
              <span className="font-medium">Brake Inspection:</span> Every 16,000 km
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}