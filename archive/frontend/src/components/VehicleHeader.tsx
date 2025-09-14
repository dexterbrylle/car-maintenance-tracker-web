import { useState } from "react"
import { Edit3, Car, ChevronDown } from "lucide-react"
import { Vehicle } from "@/types"

interface VehicleHeaderProps {
  vehicle: Vehicle
  vehicles?: Vehicle[]
  selectedVehicleId: string
  onVehicleChange: (vehicleId: string) => void
  onMileageUpdate: (mileage: number) => void
}

export function VehicleHeader({ vehicle, vehicles = [], selectedVehicleId, onVehicleChange, onMileageUpdate }: VehicleHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempMileage, setTempMileage] = useState(vehicle.current_mileage.toString())
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)

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

  const handleVehicleSelect = (vehicleId: string) => {
    onVehicleChange(vehicleId)
    setShowVehicleDropdown(false)
  }

  return (
    <div className="premium-card p-6 bg-slate-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
            <Car className="h-6 w-6 text-slate-700" />
          </div>
          <div className="relative">
            {/* Vehicle Selection Dropdown */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-left hover:bg-white transition-colors"
              >
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="text-sm text-slate-500">{vehicle.current_mileage.toLocaleString()} km</p>
                </div>
                {vehicles.length > 1 && (
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
                )}
              </button>
            </div>

            {/* Vehicle Dropdown Menu */}
            {showVehicleDropdown && vehicles.length > 1 && (
              <div className="absolute top-full left-0 z-10 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Select Vehicle</p>
                  {vehicles.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => handleVehicleSelect(v._id)}
                      className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                        v._id === selectedVehicleId
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{v.year} {v.make} {v.model}</p>
                          <p className="text-sm text-slate-500">{v.current_mileage.toLocaleString()} km</p>
                        </div>
                        {v._id === selectedVehicleId && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mileage Edit (only show when dropdown is closed) */}
        {!showVehicleDropdown && (
          <div className="flex items-center space-x-2">
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
                <Edit3 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}