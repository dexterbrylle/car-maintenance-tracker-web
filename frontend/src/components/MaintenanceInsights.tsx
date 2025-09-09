import { Card } from "@/components/ui/card"
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

  function getNextOilChangeKm(currentMileage: number): number {
    return Math.ceil(currentMileage / 8000) * 8000;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getMaintenanceItemName(service: ServiceRecord): string {
    return service.maintenance_item?.name || 'Maintenance Service';
  }

  return (
    <Card className="p-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Maintenance Insights</h3>
      
      {/* Completed Maintenance Section */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Completed Maintenance:</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {completedServices.length > 0 ? (
            completedServices.slice(0, 3).map(service => (
              <li key={service._id}>
                • {formatDate(service.date)} ({service.mileage.toLocaleString()} km): {getMaintenanceItemName(service)}
              </li>
            ))
          ) : (
            <li className="text-gray-500">No maintenance records found</li>
          )}
        </ul>
      </div>

      {/* Priority Maintenance Section */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-2">
          {dueNowItems.length > 0 ? "Immediate Attention Required:" : "Priority Maintenance:"}
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          {dueNowItems.length > 0 ? (
            dueNowItems.slice(0, 6).map(item => (
              <li key={item._id} className="font-medium text-red-600">• {item.name}</li>
            ))
          ) : upcomingMaintenance.length > 0 ? (
            upcomingMaintenance.slice(0, 6).map(item => (
              <li key={item._id}>• {item.name}</li>
            ))
          ) : (
            <li className="text-gray-500">No priority maintenance items</li>
          )}
        </ul>
      </div>

      {/* Recommended Inspections */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Recommended Inspections:</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>Brake System:</strong> Inspect brake pads, rotors, and fluid levels. Check for unusual noises or vibrations.
          </li>
          <li>
            <strong>Tire Condition:</strong> Check tire pressure, tread depth, and look for signs of uneven wear or damage.
          </li>
          <li>
            <strong>Fluid Levels:</strong> Check engine oil, coolant, brake fluid, power steering fluid, and windshield washer fluid.
          </li>
          <li>
            <strong>Lights and Electrical:</strong> Test all exterior lights, headlights, brake lights, and turn signals.
          </li>
          <li>
            <strong>Battery Health:</strong> Check battery terminals for corrosion and test battery voltage if older than 3 years.
          </li>
        </ul>
      </div>

      {/* Service Interval Notes */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Service Interval Notes:</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>Next Service Interval:</strong> {getNextServiceMileage(vehicle.current_mileage).toLocaleString()} km (every 8,000 km)
          </li>
          <li>
            <strong>Oil Change:</strong> Due at {getNextOilChangeKm(vehicle.current_mileage).toLocaleString()} km
          </li>
          <li>
            <strong>Tire Rotation:</strong> Recommended every 8,000 km
          </li>
          <li>
            <strong>Air Filter:</strong> Replace every 20,000 km or 12 months
          </li>
        </ul>
      </div>
    </Card>
  );
}