import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Vehicle } from "@/types"

interface VehicleSelectorProps {
  vehicles: Vehicle[]
  selectedVehicleId: string
  onVehicleChange: (vehicleId: string) => void
}

export function VehicleSelector({ vehicles, selectedVehicleId, onVehicleChange }: VehicleSelectorProps) {
  return (
    <Select value={selectedVehicleId} onValueChange={onVehicleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a vehicle" />
      </SelectTrigger>
      <SelectContent>
        {vehicles.map((vehicle) => (
          <SelectItem key={vehicle._id} value={vehicle._id}>
            {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.current_mileage.toLocaleString()} km)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}