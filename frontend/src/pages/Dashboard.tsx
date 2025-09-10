import { useState, useEffect, useMemo, useCallback } from "react"
import { QuickServiceModal } from "@/components/QuickServiceModal"
import { ServiceForm } from "@/components/ServiceForm"
import { FillUpForm } from "@/components/FillUpForm"
import { useToast } from "@/components/ui/toast"
import { MaintenanceInsights } from "@/components/MaintenanceInsights"
import { AddFillupModal } from "@/components/AddFillupModal"
import { DashboardSkeleton } from "@/components/ui/skeleton"
import { Vehicle, DashboardData, ServiceRecord, MaintenanceItem } from "@/types"
import { api } from "@/lib/api"
import { Car, Plus, Wrench } from "lucide-react"
import { VehicleHeader } from "@/components/VehicleHeader"
import { StatsGrid } from "@/components/StatsGrid"
import { MaintenanceSection } from "@/components/MaintenanceSection"
import { MultiFloatingActionButton } from "@/components/mobile/FloatingActionButton"

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMaintenanceItem, setSelectedMaintenanceItem] = useState<any>(null)
  const [showQuickServiceModal, setShowQuickServiceModal] = useState(false)
  const [showAddFillup, setShowAddFillup] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showFillUpForm, setShowFillUpForm] = useState(false)
  const { addToast } = useToast()

  // Memoized calculations
  const selectedVehicle = useMemo(() =>
    dashboardData?.vehicle || (vehicles && vehicles.find(v => v._id === selectedVehicleId)),
    [dashboardData, vehicles, selectedVehicleId]
  )

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
      try {
        const [dashboardResponse, serviceResponse] = await Promise.all([
          api.getDashboard(selectedVehicleId),
          api.getServices(selectedVehicleId)
        ])

        setDashboardData(dashboardResponse)
        setServiceRecords(Array.isArray(serviceResponse) ? serviceResponse : [])
        loadMaintenanceItems()
      } catch (error) {
        console.error('Failed to load vehicle data:', error)
        addToast({
          title: "Error",
          description: "Failed to load vehicle data",
          variant: "error"
        })
      }
    }

    loadVehicleData()
  }, [selectedVehicleId, addToast])

  // Load maintenance items
  const loadMaintenanceItems = async () => {
    if (!selectedVehicleId) return
    
    try {
      const response = await api.getMaintenance(selectedVehicleId)
      const maintenanceData = Array.isArray(response) ? response : []
      setMaintenanceItems(maintenanceData)
    } catch (error) {
      console.error('Failed to load maintenance items:', error)
      addToast({
        title: "Error",
        description: "Failed to load maintenance items",
        variant: "error"
      })
    }
  }

  // Memoized handlers
  const handleServiceRecordComplete = useCallback(() => {
    // Refresh data
    if (selectedVehicleId) {
      api.getDashboard(selectedVehicleId).then(setDashboardData)
      api.getServices(selectedVehicleId).then(data => setServiceRecords(Array.isArray(data) ? data : []))
    }
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
      addToast({
        title: "Action failed",
        description: "Failed to mark service as complete",
        variant: "error"
      })
    }
  }, [dashboardData, selectedVehicleId, handleServiceRecordComplete, addToast])

  const handleQuickServiceComplete = useCallback(() => {
    setShowQuickServiceModal(false)
    setSelectedMaintenanceItem(null)
    handleServiceRecordComplete()
  }, [handleServiceRecordComplete])

  const handleFillupSuccess = useCallback(() => {
    // Refresh dashboard data
    if (selectedVehicleId) {
      api.getDashboard(selectedVehicleId).then(setDashboardData)
    }
    setShowAddFillup(false)
  }, [selectedVehicleId])

  const handleServiceComplete = useCallback(() => {
    // Refresh data
    if (selectedVehicleId) {
      api.getDashboard(selectedVehicleId).then(setDashboardData)
      api.getServices(selectedVehicleId).then(data => setServiceRecords(Array.isArray(data) ? data : []))
      loadMaintenanceItems()
    }
    setShowServiceForm(false)
    addToast({
      variant: "success",
      title: "Service Logged",
      description: "Service record has been added successfully"
    })
  }, [selectedVehicleId, addToast])

  const handleFillUpComplete = useCallback(() => {
    // Refresh dashboard data
    if (selectedVehicleId) {
      api.getDashboard(selectedVehicleId).then(setDashboardData)
    }
    setShowFillUpForm(false)
    addToast({
      variant: "success",
      title: "Fill-up Logged",
      description: "Fuel record has been added successfully"
    })
  }, [selectedVehicleId, addToast])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 pb-24 lg:pb-8">
        {/* Vehicle Selection */}
        {vehicles && vehicles.length === 0 ? (
          <div className="premium-card p-6 text-center">
            <Car className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Vehicles</h2>
            <p className="text-slate-600">Add your first vehicle to get started</p>
          </div>
        ) : (
          <>
            {/* Vehicle Header */}
            {selectedVehicle && (
              <div className="mb-8">
                <VehicleHeader
                  vehicle={selectedVehicle}
                  onMileageUpdate={handleMileageUpdate}
                />
              </div>
            )}

            {/* Stats Grid */}
            {dashboardData && (
              <div className="mb-8">
                <StatsGrid
                  maintenanceStatus={dashboardData.maintenance}
                  fuelStats={dashboardData.fuel_performance ? {
                    avg_fuel_economy: dashboardData.fuel_performance.avg_fuel_economy || undefined,
                    avg_cost_per_km: dashboardData.fuel_performance.avg_cost_per_km || undefined,
                    monthly_fuel_cost: dashboardData.fuel_performance.monthly_fuel_cost || undefined
                  } : undefined}
                  serviceCount={Array.isArray(serviceRecords) ? serviceRecords.length : 0}
                />
              </div>
            )}

            {/* Insights */}
            {selectedVehicle && dashboardData && (
              <div className="mb-8">
                <MaintenanceInsights
                  vehicle={selectedVehicle}
                  completedServices={serviceRecords.slice(0, 3)}
                  upcomingMaintenance={dashboardData.maintenance.due_soon.map(item => item.maintenance_item)}
                  dueNowItems={dashboardData.maintenance.due_now.map(item => item.maintenance_item)}
                />
              </div>
            )}

            {/* Maintenance Sections */}
            {dashboardData && (
              <div className="space-y-6">
                <MaintenanceSection
                  title="Requires Attention"
                  items={dashboardData.maintenance.due_now}
                  variant="critical"
                  collapsible
                  onMarkComplete={handleMarkComplete}
                />
                <MaintenanceSection
                  title="Due Soon"
                  items={dashboardData.maintenance.due_soon}
                  variant="warning"
                  onMarkComplete={handleMarkComplete}
                />
                <MaintenanceSection
                  title="Up to Date"
                  items={dashboardData.maintenance.ok}
                  variant="success"
                  collapsible
                  onMarkComplete={handleMarkComplete}
                />
              </div>
            )}

            </>
        )}

        {/* Floating Action Buttons - Mobile */}
        {selectedVehicle && (
          <MultiFloatingActionButton
            actions={[
              {
                icon: <Plus className="h-4 w-4" />,
                label: "Add Fill-up",
                onClick: () => setShowFillUpForm(true),
                color: "blue"
              },
              {
                icon: <Wrench className="h-4 w-4" />,
                label: "Log Service",
                onClick: () => setShowServiceForm(true),
                color: "green"
              }
            ]}
          />
        )}
      </main>


      {/* Modals */}
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

      {selectedVehicle && (
        <AddFillupModal
          isOpen={showAddFillup}
          onClose={() => setShowAddFillup(false)}
          vehicleId={selectedVehicleId}
          currentMileage={selectedVehicle.current_mileage}
          onSuccess={handleFillupSuccess}
        />
      )}

      {/* Service Form Modal */}
      {showServiceForm && selectedVehicleId && (
        <ServiceForm
          vehicleId={selectedVehicleId}
          maintenanceItems={maintenanceItems}
          onSuccess={handleServiceComplete}
        />
      )}

      {/* Fill-up Form Modal */}
      {showFillUpForm && selectedVehicleId && (
        <FillUpForm
          vehicleId={selectedVehicleId}
          onSuccess={handleFillUpComplete}
          onCancel={() => setShowFillUpForm(false)}
        />
      )}
    </div>
  )
}
