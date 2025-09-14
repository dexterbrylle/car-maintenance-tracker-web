import { FuelMaintenanceInsights } from "@/components/FuelMaintenanceInsights"

// Example usage in a page or dashboard component:
export default function Dashboard() {
  const vehicleId = "your-vehicle-id-here"
  
  return (
    <div className="space-y-6">
      {/* Other dashboard components */}
      <FuelMaintenanceInsights vehicleId={vehicleId} />
      
      {/* For mobile-specific layout */}
      {/* <FuelMaintenanceInsightsMobile vehicleId={vehicleId} /> */}
    </div>
  )
}