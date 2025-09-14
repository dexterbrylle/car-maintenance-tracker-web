import { useState, useEffect } from "react"
import { ExportManager } from "@/components/ExportManager"
import { VehicleSelector } from "@/components/VehicleSelector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { Vehicle } from "@/types"
import { api } from "@/lib/api"
import { Download, Truck } from "lucide-react"

export function ExportsPage() {
  const { addToast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      const response = await api.getVehicles()
      const vehiclesData = Array.isArray(response) ? response : []
      setVehicles(vehiclesData)
      if (vehiclesData.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehiclesData[0]._id)
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
      setVehicles([])
      addToast({
        variant: "error",
        title: "Error",
        description: "Failed to load vehicles"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Download className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading export manager...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Export Center</h1>
              <p className="text-muted-foreground">
                Export and manage your vehicle maintenance data
              </p>
            </div>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Vehicles Available</h3>
              <p className="text-muted-foreground mb-6">
                You need to add a vehicle before you can export data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Vehicle Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Select Vehicle
                </CardTitle>
                <CardDescription>
                  Choose the vehicle you want to export data for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VehicleSelector
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  onVehicleChange={setSelectedVehicleId}
                />
              </CardContent>
            </Card>

            {/* Export Manager */}
            {selectedVehicleId && (
              <ExportManager
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                onVehicleChange={setSelectedVehicleId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}