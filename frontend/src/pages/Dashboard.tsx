import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VehicleSelector } from "@/components/VehicleSelector"
import { MaintenanceCard } from "@/components/MaintenanceCard"
import { ServiceForm } from "@/components/ServiceForm"
import { ServiceScheduler } from "@/components/ServiceScheduler"
import { Vehicle, DashboardData, MaintenanceItem, ServiceRecord } from "@/types"
import { api } from "@/lib/api"
import { Car, Plus, Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react"

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([])
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicleId) {
      loadDashboardData()
      loadMaintenanceItems()
      loadServiceRecords()
    }
  }, [selectedVehicleId])

  const loadVehicles = async () => {
    try {
      const response = await api.getVehicles()
      setVehicles(response.data)
      if (response.data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(response.data[0]._id)
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      const response = await api.getDashboard(selectedVehicleId)
      setDashboardData(response.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const loadMaintenanceItems = async () => {
    try {
      const response = await api.getMaintenance(selectedVehicleId)
      setMaintenanceItems(response.data)
    } catch (error) {
      console.error('Failed to load maintenance items:', error)
    }
  }

  const loadServiceRecords = async () => {
    try {
      const response = await api.getServices(selectedVehicleId)
      setServiceRecords(response.data)
    } catch (error) {
      console.error('Failed to load service records:', error)
    }
  }

  const handleServiceComplete = () => {
    loadDashboardData()
    loadServiceRecords()
    setShowServiceForm(false)
  }

  const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Car Maintenance Tracker</h1>
          <p className="text-muted-foreground">Keep track of your vehicle maintenance schedule</p>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    No Vehicles
                  </CardTitle>
                  <CardDescription>Add your first vehicle to get started</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Vehicle
                    </CardTitle>
                    <CardDescription>Select a vehicle to view maintenance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VehicleSelector
                      vehicles={vehicles}
                      selectedVehicleId={selectedVehicleId}
                      onVehicleChange={setSelectedVehicleId}
                    />
                  </CardContent>
                </Card>

                {selectedVehicle && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Mileage</CardTitle>
                      <CardDescription>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedVehicle.current_mileage.toLocaleString()} km
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowServiceForm(!showServiceForm)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showServiceForm ? "Hide Form" : "Log Service"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowScheduler(!showScheduler)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {showScheduler ? "Hide Scheduler" : "View Schedule"}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {showServiceForm && selectedVehicleId && (
            <ServiceForm
              vehicleId={selectedVehicleId}
              maintenanceItems={maintenanceItems}
              onSuccess={handleServiceComplete}
            />
          )}

          {showScheduler && selectedVehicleId && (
            <ServiceScheduler vehicleId={selectedVehicleId} />
          )}

          {/* Overview Section */}
          {selectedVehicle && dashboardData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Maintenance Overview
                </CardTitle>
                <CardDescription>
                  Quick summary of your vehicle's maintenance status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.ok.length}
                    </div>
                    <div className="text-sm text-green-700">Up to Date</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData.due_soon.length}
                    </div>
                    <div className="text-sm text-yellow-700">Due Soon</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {dashboardData.due_now.length}
                    </div>
                    <div className="text-sm text-red-700">Due Now</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {serviceRecords.length}
                    </div>
                    <div className="text-sm text-blue-700">Services Logged</div>
                  </div>
                </div>

                {/* Recent Services */}
                {serviceRecords.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Recent Services</h3>
                    <div className="space-y-2">
                      {serviceRecords.slice(0, 3).map((service) => {
                        const maintenanceItem = maintenanceItems.find(mi => mi._id === service.maintenance_item_id)
                        return (
                          <div key={service._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <div className="font-medium">{maintenanceItem?.name || 'Unknown Service'}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(service.date).toLocaleDateString()} • {service.mileage.toLocaleString()} km
                              </div>
                            </div>
                            <Badge variant="outline">
                              {service.cost.toFixed(2)}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {selectedVehicleId && dashboardData && (
          <div className="space-y-6">
            {dashboardData.due_now.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-red-600">Due Now</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.due_now.map((item) => (
                    <MaintenanceCard
                      key={item._id}
                      item={item}
                      status="due_now"
                      vehicleId={selectedVehicleId}
                      onServiceComplete={handleServiceComplete}
                    />
                  ))}
                </div>
              </div>
            )}

            {dashboardData.due_soon.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-yellow-600">Due Soon</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.due_soon.map((item) => (
                    <MaintenanceCard
                      key={item._id}
                      item={item}
                      status="due_soon"
                      vehicleId={selectedVehicleId}
                      onServiceComplete={handleServiceComplete}
                    />
                  ))}
                </div>
              </div>
            )}

            {dashboardData.ok.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-green-600">Up to Date</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.ok.map((item) => (
                    <MaintenanceCard
                      key={item._id}
                      item={item}
                      status="ok"
                      vehicleId={selectedVehicleId}
                      onServiceComplete={handleServiceComplete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
