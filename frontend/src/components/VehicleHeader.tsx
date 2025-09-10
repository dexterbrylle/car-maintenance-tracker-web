import { useState } from "react"
import { Edit3, Car } from "lucide-react"
import { Vehicle } from "@/types"

interface VehicleHeaderProps {
  vehicle: Vehicle
  onMileageUpdate: (mileage: number) => void
}

export function VehicleHeader({ vehicle, onMileageUpdate }: VehicleHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempMileage, setTempMileage] = useState(vehicle.current_mileage.toString())

  const handleSubmit = () => {
    const newMileage = parseInt(tempMileage)
    if (!isNaN(newMileage) && newMileage !== vehicle.current_mileage) {
      onMileageUpdate(newMileage)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      setTempMileage(vehicle.current_mileage.toString())
      setIsEditing(false)
    }
  }

  return (
    <div className="premium-card p-6 bg-slate-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
            <Car className="h-6 w-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <div className="mt-1 flex items-center space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={tempMileage}
                    onChange={(e) => setTempMileage(e.target.value)}
                    onBlur={handleSubmit}
                    onKeyDown={handleKeyDown}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-1 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    autoFocus
                  />
                  <span className="text-sm text-slate-500">km</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                >
                  <span className="font-medium">{vehicle.current_mileage.toLocaleString()} km</span>
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}