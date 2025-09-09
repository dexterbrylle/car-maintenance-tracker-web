import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VehicleSelector } from "@/components/VehicleSelector"
import { MaintenanceStatusCard } from "@/components/MaintenanceStatusCard"
import { MileageUpdateForm } from "@/components/MileageUpdateForm"
import { QuickServiceModal } from "@/components/QuickServiceModal"
import { useToast } from "@/components/ui/toast"
import { ServiceForm } from "@/components/ServiceForm"
import { ServiceScheduler } from "@/components/ServiceScheduler"
import { MaintenanceInsights } from "@/components/MaintenanceInsights"
import { FuelPerformanceMetrics } from "@/components/FuelPerformanceMetrics"
import { ExportButton } from "@/components/ExportButton"
import { DashboardSkeleton, VehicleSelectorSkeleton } from "@/components/ui/skeleton"
import { Vehicle, DashboardData, MaintenanceItem, ServiceRecord } from "@/types"
import { api } from "@/lib/api"
import { Car, Plus, Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp, Loader2 } from "lucide-react"

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([])
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [selectedMaintenanceItem, setSelectedMaintenanceItem] = useState<MaintenanceItem | null>(null)
  const [showQuickServiceModal, setShowQuickServiceModal] = useState(false)
  const { addToast } = useToast()

  // Memoized calculations
  const selectedVehicle = useMemo(() => 
    dashboardData?.vehicle || (vehicles && vehicles.find(v => v._id === selectedVehicleId)), 
    [dashboardData, vehicles, selectedVehicleId]
  )

  // const totalCost = useMemo(() => 
  //   serviceRecords.reduce((sum, record) => sum + record.cost, 0), 
  //   [serviceRecords]
  // )

  
  // Load vehicles data
  useEffect(() => {
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
        addToast({
          title: "Error",
          description: "Failed to load vehicles",
          variant: "error"
        })
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
  }, [selectedVehicleId, addToast])

  // Load vehicle-specific data when vehicle is selected
  useEffect(() => {
    if (!selectedVehicleId) return

    const loadVehicleData = async () => {
      setDashboardLoading(true)
      setError(null)

      try {
        const [dashboardResponse, maintenanceResponse, serviceResponse] = await Promise.all([
          api.getDashboard(selectedVehicleId),
          api.getMaintenance(selectedVehicleId),
          api.getServices(selectedVehicleId)
        ])

        setDashboardData(dashboardResponse)
        setMaintenanceItems(Array.isArray(maintenanceResponse) ? maintenanceResponse : [])
        setServiceRecords(Array.isArray(serviceResponse) ? serviceResponse : [])
      } catch (error) {
        console.error('Failed to load vehicle data:', error)
        setError('Failed to load vehicle data')
        addToast({
          title: "Error",
          description: "Failed to load vehicle data",
          variant: "error"
        })
      } finally {
        setDashboardLoading(false)
      }
    }

    loadVehicleData()
  }, [selectedVehicleId, addToast])

  // Memoized handlers
  const handleServiceComplete = useCallback(() => {
    // Refresh data
    if (selectedVehicleId) {
      api.getDashboard(selectedVehicleId).then(setDashboardData)
      api.getServices(selectedVehicleId).then(data => setServiceRecords(Array.isArray(data) ? data : []))
    }
    setShowServiceForm(false)
  }, [selectedVehicleId])

  const handleMileageUpdate = useCallback((newMileage: number) => {
    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        vehicle: { ...dashboardData.vehicle, current_mileage: newMileage }
      })
    }
    // Refresh dashboard data to recalculate due items
    if (selectedVehicleId) {
      api.getDashboard(selectedVehicleId).then(setDashboardData)
    }
  }, [dashboardData, selectedVehicleId])

  const handleMarkComplete = useCallback(async (itemId: string) => {
    if (!dashboardData) return
    
    try {
      await api.addService({
        vehicle_id: selectedVehicleId,
        maintenance_item_id: itemId,
        date: new Date().toISOString().split('T')[0],
        mileage: dashboardData.vehicle.current_mileage,
        cost: 0,
        notes: "Marked as complete from dashboard"
      })
      
      handleServiceComplete()
      
      // Find the maintenance item to show in toast
      const item = [...dashboardData.maintenance.due_now, ...dashboardData.maintenance.due_soon, ...dashboardData.maintenance.ok]
        .find(item => item.maintenance_item._id === itemId)
      
      addToast({
        title: "Service marked complete",
        description: item ? `${item.maintenance_item.name} marked as complete` : "Service marked as complete",
        variant: "success"
      })
    } catch (error) {
      console.error('Failed to mark service as complete:', error)
      setError('Failed to mark service as complete')
      addToast({
        title: "Action failed",
        description: "Failed to mark service as complete",
        variant: "error"
      })
    }
  }, [dashboardData, selectedVehicleId, handleServiceComplete, addToast])

  const handleScheduleService = useCallback((itemId: string) => {
    if (!dashboardData) return
    
    const item = [...dashboardData.maintenance.due_now, ...dashboardData.maintenance.due_soon, ...dashboardData.maintenance.ok]
      .find(item => item.maintenance_item._id === itemId)
    
    if (item) {
      setSelectedMaintenanceItem(item.maintenance_item)
      setShowQuickServiceModal(true)
    }
  }, [dashboardData])

  const handleQuickServiceComplete = useCallback(() => {
    setShowQuickServiceModal(false)
    setSelectedMaintenanceItem(null)
    handleServiceComplete()
  }, [handleServiceComplete])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Car Maintenance Tracker</h1>
              <p className="text-muted-foreground">Keep track of your vehicle maintenance schedule</p>
            </div>
            <ExportButton
              vehicles={vehicles || []}
              selectedVehicleId={selectedVehicleId}
              onVehicleChange={setSelectedVehicleId}
            />
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles && vehicles.length === 0 ? (
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
                    {dashboardLoading ? (
                      <VehicleSelectorSkeleton />
                    ) : (
                      <VehicleSelector
                        vehicles={vehicles || []}
                        selectedVehicleId={selectedVehicleId}
                        onVehicleChange={setSelectedVehicleId}
                      />
                    )}
                  </CardContent>
                </Card>

                {selectedVehicle && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Mileage</CardTitle>
                      <CardDescription>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MileageUpdateForm
                        vehicleId={selectedVehicleId}
                        currentMileage={selectedVehicle.current_mileage}
                        onUpdate={handleMileageUpdate}
                      />
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

          {/* Maintenance Insights Section */}
          {selectedVehicle && dashboardData && (
            <MaintenanceInsights 
              vehicle={selectedVehicle}
              completedServices={serviceRecords.slice(0, 3)}
              upcomingMaintenance={dashboardData.maintenance.due_soon.map(item => item.maintenance_item)}
              dueNowItems={dashboardData.maintenance.due_now.map(item => item.maintenance_item)}
            />
          )}

          {/* Fuel Performance Metrics Section */}
          {selectedVehicle && (
            <FuelPerformanceMetrics vehicleId={selectedVehicleId} />
          )}

          {/* AI Insights Section */}
          {selectedVehicle && dashboardData && dashboardData.insights && dashboardData.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Intelligent analysis of your vehicle's maintenance and fuel data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.insights.map((insight, index) => (
                    <div key={index} className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">{insight.title || insight.type}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.message || insight.description}
                      </p>
                      {insight.recommendation && (
                        <p className="text-sm font-medium text-blue-600">
                          Recommendation: {insight.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview Section */}
          {selectedVehicle && (
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
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading maintenance data...
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => {
                      // Reload vehicle data
                      if (selectedVehicleId) {
                        setDashboardLoading(true)
                        api.getDashboard(selectedVehicleId)
                          .then(setDashboardData)
                          .catch(() => setError('Failed to load vehicle data'))
                          .finally(() => setDashboardLoading(false))
                      }
                    }} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                ) : dashboardData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {dashboardData.maintenance.ok.length}
                        </div>
                        <div className="text-sm text-green-700">Up to Date</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">
                          {dashboardData.maintenance.due_soon.length}
                        </div>
                        <div className="text-sm text-yellow-700">Due Soon</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-600">
                          {dashboardData.maintenance.due_now.length}
                        </div>
                        <div className="text-sm text-red-700">Due Now</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {Array.isArray(serviceRecords) ? serviceRecords.length : 0}
                        </div>
                        <div className="text-sm text-blue-700">Services Logged</div>
                      </div>
                    </div>

                    {/* Recent Services */}
                    {Array.isArray(serviceRecords) && serviceRecords.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-3">Recent Services</h3>
                        <div className="space-y-2">
                          {serviceRecords.slice(0, 3).map((service) => {
                            const maintenanceItem = Array.isArray(maintenanceItems) ? maintenanceItems.find(mi => mi._id === service.maintenance_item_id) : null
                            return (
                              <div key={service._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div>
                                  <div className="font-medium">{maintenanceItem?.name || 'Unknown Service'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(service.date).toLocaleDateString()} • {service.mileage.toLocaleString()} km
                                  </div>
                                </div>
                                <Badge variant="outline">
                                  ${service.cost.toFixed(2)}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No maintenance data available</p>
                    <Button onClick={() => {
                      // Reload dashboard data
                      if (selectedVehicleId) {
                        setDashboardLoading(true)
                        api.getDashboard(selectedVehicleId)
                          .then(setDashboardData)
                          .catch(() => setError('Failed to load vehicle data'))
                          .finally(() => setDashboardLoading(false))
                      }
                    }} variant="outline" size="sm">
                      Load Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {selectedVehicleId && dashboardData && (
          <div className="space-y-6">
            {dashboardData.maintenance.due_now.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-600">
                    DUE NOW ({dashboardData.maintenance.due_now.length} {dashboardData.maintenance.due_now.length === 1 ? 'item' : 'items'})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.maintenance.due_now.map((item) => (
                    <MaintenanceStatusCard
                      key={item.maintenance_item._id}
                      item={item}
                      status="due_now"
                      onMarkComplete={handleMarkComplete}
                      onScheduleService={handleScheduleService}
                    />
                  ))}
                </div>
              </div>
            )}

            {dashboardData.maintenance.due_soon.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-xl font-semibold text-yellow-600">
                    DUE SOON ({dashboardData.maintenance.due_soon.length} {dashboardData.maintenance.due_soon.length === 1 ? 'item' : 'items'})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.maintenance.due_soon.map((item) => (
                    <MaintenanceStatusCard
                      key={item.maintenance_item._id}
                      item={item}
                      status="due_soon"
                      onMarkComplete={handleMarkComplete}
                      onScheduleService={handleScheduleService}
                    />
                  ))}
                </div>
              </div>
            )}

            {dashboardData.maintenance.ok.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-green-600">
                    UP TO DATE ({dashboardData.maintenance.ok.length}+ {dashboardData.maintenance.ok.length === 1 ? 'item' : 'items'})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.maintenance.ok.slice(0, 6).map((item) => (
                    <MaintenanceStatusCard
                      key={item.maintenance_item._id}
                      item={item}
                      status="ok"
                      onMarkComplete={handleMarkComplete}
                      onScheduleService={handleScheduleService}
                    />
                  ))}
                </div>
                {dashboardData.maintenance.ok.length > 6 && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowScheduler(!showScheduler)}
                    >
                      View All {dashboardData.maintenance.ok.length} Items
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Service Modal */}
        {selectedMaintenanceItem && selectedVehicle && (
          <QuickServiceModal
            isOpen={showQuickServiceModal}
            onClose={() => {
              setShowQuickServiceModal(false)
              setSelectedMaintenanceItem(null)
            }}
            maintenanceItem={selectedMaintenanceItem}
            vehicle={selectedVehicle}
            onSuccess={handleQuickServiceComplete}
          />
        )}
      </div>
    </div>
  )
}
