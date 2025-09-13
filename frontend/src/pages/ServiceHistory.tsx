import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VehicleSelector } from "@/components/VehicleSelector"
import { ServiceForm } from "@/components/ServiceForm"
import { ExportButton } from "@/components/ExportButton"
import { useToast } from "@/components/ui/toast"
import { ServiceRecord, MaintenanceItem, DashboardData } from "@/types"
import { api } from "@/lib/api"
import { useVehicles } from "@/hooks/useVehicles"
import { History, Gauge, Edit, Save, X, Trash2, Search, AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronRight } from "lucide-react"

// Utility function to calculate maintenance status locally
interface MaintenanceItemWithStatus extends MaintenanceItem {
  status: 'due_now' | 'due_soon' | 'up_to_date'
  miles_until_due: number
  miles_overdue: number
  due_at_mileage: number
  last_service_mileage: number
  service_count: number
}

function calculateMaintenanceStatus(
  maintenanceItems: MaintenanceItem[],
  serviceRecords: ServiceRecord[],
  currentMileage: number,
  purchaseMileage: number
): MaintenanceItemWithStatus[] {
  return maintenanceItems.map(item => {
    const relevantServices = serviceRecords.filter(
      record => record.maintenance_item_id === item._id
    ).sort((a, b) => b.mileage - a.mileage)

    const lastService = relevantServices[0]
    const lastServiceMileage = lastService ? lastService.mileage : purchaseMileage
    const dueAtMileage = lastServiceMileage + item.interval_km

    let status: 'due_now' | 'due_soon' | 'up_to_date'
    let milesUntilDue = 0
    let milesOverdue = 0

    if (currentMileage >= dueAtMileage) {
      status = 'due_now'
      milesOverdue = currentMileage - dueAtMileage
    } else if (currentMileage >= dueAtMileage - 1000) {
      status = 'due_soon'
      milesUntilDue = dueAtMileage - currentMileage
    } else {
      status = 'up_to_date'
      milesUntilDue = dueAtMileage - currentMileage
    }

    return {
      ...item,
      status,
      miles_until_due: milesUntilDue,
      miles_overdue: milesOverdue,
      due_at_mileage: dueAtMileage,
      last_service_mileage: lastServiceMileage,
      service_count: relevantServices.length
    }
  })
}

export function ServiceHistory() {
  const { addToast } = useToast()
  const { vehicles, selectedVehicleId, setSelectedVehicleId, loading: vehiclesLoading } = useVehicles()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([])
  const [enhancedMaintenanceItems, setEnhancedMaintenanceItems] = useState<MaintenanceItemWithStatus[]>([])
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null)
  const [editForm, setEditForm] = useState({
    date: "",
    mileage: "",
    cost: "",
    notes: "",
    maintenance_item_id: ""
  })
  const [collapsedSections, setCollapsedSections] = useState({
    needsAttention: true, // Default folded
    upToDate: true // Default folded
  })

  useEffect(() => {
    if (selectedVehicleId && !vehiclesLoading) {
      loadDashboardData()
      loadServiceRecords()
      loadMaintenanceItems()
    }
  }, [selectedVehicleId, vehiclesLoading])

  // Calculate maintenance status when data changes
  useEffect(() => {
    if (selectedVehicleId && maintenanceItems.length > 0 && serviceRecords.length >= 0) {
      const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId)
      if (selectedVehicle) {
        const currentMileage = selectedVehicle.current_mileage
        const purchaseMileage = (selectedVehicle as any).purchase_mileage || (selectedVehicle as any).initial_mileage || 0
        
        console.log('Calculating maintenance status locally:', {
          currentMileage,
          purchaseMileage,
          maintenanceItemsCount: maintenanceItems.length,
          serviceRecordsCount: serviceRecords.length
        })
        
        const calculated = calculateMaintenanceStatus(
          maintenanceItems,
          serviceRecords,
          currentMileage,
          purchaseMileage
        )
        
        setEnhancedMaintenanceItems(calculated)
        console.log('Calculated maintenance status:', calculated.map(item => ({
          name: item.name,
          status: item.status,
          interval: item.interval_km,
          dueAt: item.due_at_mileage,
          milesUntilDue: item.miles_until_due,
          milesOverdue: item.miles_overdue
        })))
      }
    }
  }, [selectedVehicleId, maintenanceItems, serviceRecords, vehicles])

  const loadDashboardData = async () => {
    try {
      if (selectedVehicleId) {
        const response = await api.getDashboard(selectedVehicleId)
        setDashboardData(response)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Don't show toast for dashboard data - other data can still work
    }
  }

  const loadServiceRecords = async () => {
    try {
      if (!selectedVehicleId) return
      const response = await api.getServices(selectedVehicleId)
      const serviceData = Array.isArray(response) ? response : []
      setServiceRecords(serviceData)
    } catch (error) {
      console.error('Failed to load service records:', error)
      // Only show error if not offline
      if (navigator.onLine) {
        addToast({
          variant: "error",
          title: "Error",
          description: "Failed to load service records"
        })
      }
    }
  }

  const loadMaintenanceItems = async () => {
    try {
      if (!selectedVehicleId) return
      const response = await api.getMaintenance(selectedVehicleId)
      const maintenanceData = Array.isArray(response) ? response : []
      setMaintenanceItems(maintenanceData)
    } catch (error) {
      console.error('Failed to load maintenance items:', error)
      // Don't show toast for maintenance items - service records can still work
    }
  }

  
  const handleServiceComplete = () => {
    loadServiceRecords()
    loadDashboardData()
    setShowServiceForm(false)
    addToast({
      variant: "success",
      title: "Service Logged",
      description: "Service record has been added successfully"
    })
  }

  const startEditing = (record: ServiceRecord) => {
    setEditingRecord(record)
    // Format date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
    }

    setEditForm({
      date: formatDateForInput(record.date),
      mileage: record.mileage.toString(),
      cost: record.cost.toString(),
      notes: record.notes || "",
      maintenance_item_id: record.maintenance_item_id
    })
  }

  const cancelEditing = () => {
    setEditingRecord(null)
    setEditForm({
      date: "",
      mileage: "",
      cost: "",
      notes: "",
      maintenance_item_id: ""
    })
  }

  const saveEdit = async () => {
    if (!editingRecord) return

    try {
      const newMileage = parseInt(editForm.mileage)

      // Format date for backend (ISO format)
      const formatDateForBackend = (dateString: string) => {
        const date = new Date(dateString)
        return date.toISOString() // Returns full ISO format
      }

      const updateData = {
        date: formatDateForBackend(editForm.date),
        mileage: newMileage,
        cost: parseFloat(editForm.cost),
        notes: editForm.notes,
        maintenance_item_id: editForm.maintenance_item_id
      }

      console.log('Updating service record:', {
        recordId: editingRecord._id,
        originalData: editingRecord,
        formData: editForm,
        updateData: updateData
      })

      console.log('Calling API endpoint:', `/api/services/${editingRecord._id}`)
      const response = await api.updateService(editingRecord._id, updateData)
      console.log('API Response:', response)

      // Update vehicle mileage if the new mileage is higher
      try {
        const vehiclesResponse = await api.getVehicles()
        const vehiclesData = Array.isArray(vehiclesResponse) ? vehiclesResponse : []
        const currentVehicle = vehiclesData.find((v: any) => v._id === selectedVehicleId)
        if (currentVehicle && newMileage > currentVehicle.current_mileage && selectedVehicleId) {
          console.log('Updating vehicle mileage:', {
            vehicleId: selectedVehicleId,
            currentMileage: currentVehicle.current_mileage,
            newMileage: newMileage
          })
          await api.updateVehicle(selectedVehicleId, { current_mileage: newMileage })
          console.log('Vehicle mileage updated successfully')
        }
      } catch (error) {
        console.error('Failed to update vehicle mileage:', error)
        // Don't let vehicle update failure prevent service record update
        console.log('Continuing despite vehicle update failure')
      }

      console.log('Reloading service records after update...')
      await loadServiceRecords()
      console.log('Service records reloaded')
      await loadDashboardData()
      console.log('Dashboard data reloaded')
      cancelEditing()
      addToast({
        variant: "success",
        title: "Record Updated",
        description: "Service record has been updated successfully"
      })
    } catch (error: any) {
      console.error('Failed to update service record:', error)

      // Handle specific error messages
      let errorMessage = "Failed to update service record"
      if (error.response?.data?.error === 'Duplicate service record') {
        errorMessage = error.response.data.details[0] || "Duplicate service record for this date"
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details.join(', ')
      }

      addToast({
        variant: "error",
        title: "Update Failed",
        description: errorMessage
      })
    }
  }

  const deleteServiceRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this service record? This action cannot be undone.')) {
      return
    }

    try {
      await api.deleteService(recordId)
      await loadServiceRecords()
      await loadDashboardData()
      addToast({
        variant: "success",
        title: "Record Deleted",
        description: "Service record has been deleted successfully"
      })
    } catch (error) {
      console.error('Failed to delete service record:', error)
      addToast({
        variant: "error",
        title: "Delete Failed",
        description: "Failed to delete service record"
      })
    }
  }

  const getMaintenanceItemName = (itemId: string) => {
    const item = maintenanceItems.find(mi => mi._id === itemId)
    return item?.name || "Unknown Service"
  }

  const filteredRecords = serviceRecords.filter(record => {
    const matchesType = filterType === "all" || record.maintenance_item_id === filterType
    const matchesDate = !dateFilter || record.date.startsWith(dateFilter)
    const matchesSearch = !searchTerm || 
      getMaintenanceItemName(record.maintenance_item_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesDate && matchesSearch
  })

  
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Calculate yearly maintenance cost
  const calculateYearlyCost = () => {
    const currentYear = new Date().getFullYear()
    const yearlyCost = serviceRecords
      .filter(record => new Date(record.date).getFullYear() === currentYear)
      .reduce((sum, record) => sum + record.cost, 0)
    return yearlyCost
  }

  const yearlyMaintenanceCost = calculateYearlyCost()

  // Group service records by date
  const groupedRecords = filteredRecords.reduce((groups, record) => {
    const date = new Date(record.date).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(record)
    return groups
  }, {} as Record<string, ServiceRecord[]>)

  const selectedVehicle = vehicles?.find(v => v._id === selectedVehicleId)

  if (vehiclesLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8 pb-24 lg:pb-8">
        <div className="mb-8 hidden lg:block">
          <h1 className="text-3xl font-bold mb-2">Service History</h1>
          <p className="text-muted-foreground">View and track completed maintenance services</p>
        </div>

        <div className="grid gap-6 mb-8">
          {vehicles.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Vehicles</CardTitle>
                <CardDescription>Add a vehicle first</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle</CardTitle>
                    <CardDescription>Select vehicle to view history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VehicleSelector
                      vehicles={vehicles}
                      selectedVehicleId={selectedVehicleId || ""}
                      onVehicleChange={setSelectedVehicleId}
                    />
                  </CardContent>
                </Card>
              </div>

              {selectedVehicle && selectedVehicleId && (
                <>
                  
                  {/* Maintenance Status Overview */}
                  {(dashboardData || enhancedMaintenanceItems.length > 0) && (
                    <div className="space-y-4">
                      {/* Get maintenance data from dashboard or calculated fallback */}
                      {(() => {
                        const dueNowItems = dashboardData 
                          ? dashboardData.maintenance.due_now 
                          : enhancedMaintenanceItems.filter(item => item.status === 'due_now').map(item => ({
                              maintenance_item: item,
                              miles_overdue: item.miles_overdue,
                              due_at_mileage: item.due_at_mileage
                            }))
                        
                        const dueSoonItems = dashboardData
                          ? dashboardData.maintenance.due_soon
                          : enhancedMaintenanceItems.filter(item => item.status === 'due_soon').map(item => ({
                              maintenance_item: item,
                              miles_until_due: item.miles_until_due,
                              due_at_mileage: item.due_at_mileage
                            }))

                        const upToDateItems = dashboardData
                          ? dashboardData.maintenance.ok
                          : enhancedMaintenanceItems.filter(item => item.status === 'up_to_date').map(item => ({
                              maintenance_item: item,
                              miles_until_due: item.miles_until_due
                            }))

                        return (
                          <>
                            {/* Maintenance Status Sections - Separate Rows */}
                            <div className="space-y-6">
                              {/* Needs Attention Section */}
                              {(dueNowItems.length > 0 || dueSoonItems.length > 0) && (
                                <Card className="border-orange-200 bg-orange-50">
                                  <CardHeader 
                                    className="pb-3 cursor-pointer" 
                                    onClick={() => toggleSection('needsAttention')}
                                  >
                                    <CardTitle className="flex items-center justify-between text-orange-800">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Needs Attention ({dueNowItems.length + dueSoonItems.length})
                                      </div>
                                      {collapsedSections.needsAttention ? (
                                        <ChevronRight className="w-5 h-5" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5" />
                                      )}
                                    </CardTitle>
                                    <CardDescription className="text-orange-700">
                                      {dueNowItems.length > 0 && dueSoonItems.length > 0 
                                        ? `${dueNowItems.length} overdue, ${dueSoonItems.length} due soon`
                                        : dueNowItems.length > 0 
                                        ? `${dueNowItems.length} item${dueNowItems.length > 1 ? 's' : ''} overdue and need immediate attention`
                                        : `${dueSoonItems.length} item${dueSoonItems.length > 1 ? 's' : ''} due within the next 1,000 km`}
                                    </CardDescription>
                                  </CardHeader>
                                  {!collapsedSections.needsAttention && (
                                    <CardContent>
                                      <div className="space-y-3">
                                        {/* Due Now Items */}
                                        {dueNowItems.length > 0 && (
                                          <div>
                                            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                                              <AlertTriangle className="w-4 h-4" />
                                              Overdue ({dueNowItems.length})
                                            </h4>
                                            <div className="space-y-2">
                                              {dueNowItems.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                                                  <div>
                                                    <p className="font-medium text-red-900 text-sm">{item.maintenance_item.name}</p>
                                                    <p className="text-xs text-red-700">
                                                      {item.miles_overdue} km overdue • Due at {item.due_at_mileage?.toLocaleString() || 'N/A'} km
                                                    </p>
                                                  </div>
                                                  <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => setShowServiceForm(true)}
                                                    className="text-red-700 border-red-300 hover:bg-red-50 text-xs"
                                                  >
                                                    Log Service
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Due Soon Items */}
                                        {dueSoonItems.length > 0 && (
                                          <div>
                                            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                                              <Clock className="w-4 h-4" />
                                              Due Soon ({dueSoonItems.length})
                                            </h4>
                                            <div className="space-y-2">
                                              {dueSoonItems.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                                                  <div>
                                                    <p className="font-medium text-yellow-900 text-sm">{item.maintenance_item.name}</p>
                                                    <p className="text-xs text-yellow-700">
                                                      Due in {item.miles_until_due?.toLocaleString() || 'N/A'} km • Due at {item.due_at_mileage?.toLocaleString() || 'N/A'} km
                                                    </p>
                                                  </div>
                                                  <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => setShowServiceForm(true)}
                                                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-50 text-xs"
                                                  >
                                                    Log Service
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  )}
                                </Card>
                              )}

                              {/* Up to Date Section */}
                              {upToDateItems.length > 0 && (
                                <Card className="border-green-200 bg-green-50">
                                  <CardHeader
                                    className="pb-3 cursor-pointer"
                                    onClick={() => toggleSection('upToDate')}
                                  >
                                    <CardTitle className="flex items-center justify-between text-green-800">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        Up to Date ({upToDateItems.length})
                                      </div>
                                      {collapsedSections.upToDate ? (
                                        <ChevronRight className="w-5 h-5" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5" />
                                      )}
                                    </CardTitle>
                                    <CardDescription className="text-green-700">
                                      These items are in good condition and don't need immediate service
                                    </CardDescription>
                                  </CardHeader>
                                  {!collapsedSections.upToDate && (
                                    <CardContent>
                                      <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                        {upToDateItems.slice(0, 6).map((item, index) => (
                                          <div key={index} className="p-3 bg-white rounded-lg border border-green-200">
                                            <p className="font-medium text-green-900">{item.maintenance_item.name}</p>
                                            <p className="text-sm text-green-700">
                                              Due in {item.miles_until_due?.toLocaleString() || 'N/A'} km
                                            </p>
                                          </div>
                                        ))}
                                        {upToDateItems.length > 6 && (
                                          <div className="p-3 bg-white rounded-lg border border-green-200 text-center">
                                            <p className="text-sm text-green-700">
                                              +{upToDateItems.length - 6} more items
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  )}
                                </Card>
                              )}
                            </div>

                          </>
                        )
                      })()}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {showServiceForm && selectedVehicleId && (
            <ServiceForm
              vehicleId={selectedVehicleId}
              maintenanceItems={maintenanceItems}
              onSuccess={handleServiceComplete}
            />
          )}

          {/* Filters and Actions */}
          {selectedVehicleId && (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Filters Section - 70% width */}
              <div className="lg:col-span-7">
                <Card>
                  <CardHeader>
                    <CardTitle>Filters & Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:hidden">
                        <label className="text-sm font-medium">Service Type</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            {maintenanceItems.map((item) => (
                              <SelectItem key={item._id} value={item._id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="hidden lg:block">
                        <label className="text-sm font-medium">Service Type</label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            {maintenanceItems.map((item) => (
                              <SelectItem key={item._id} value={item._id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="hidden lg:block">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                          type="month"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          placeholder="Filter by date"
                        />
                      </div>
                      <div className="hidden lg:block">
                        <label className="text-sm font-medium">Search</label>
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search services or notes"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="flex items-end gap-2 lg:col-span-3">
                        <ExportButton
                          vehicles={vehicles}
                          selectedVehicleId={selectedVehicleId}
                          onVehicleChange={setSelectedVehicleId}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Total Cost Card - 30% width */}
              <div className="lg:col-span-3">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Cost of Maintenance</CardTitle>
                    <CardDescription>For {new Date().getFullYear()}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        ₱{yearlyMaintenanceCost.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {serviceRecords.filter(r => new Date(r.date).getFullYear() === new Date().getFullYear()).length} services this year
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
        {selectedVehicleId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Service Records
                </span>
              </CardTitle>
              <CardDescription>
                {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedRecords).length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No service records</h3>
                  <p className="text-muted-foreground mb-4">Start by logging your first service</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedRecords)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, records]) => (
                      <div key={date}>
                        <h3 className="text-lg font-semibold mb-3 text-muted-foreground">{date}</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead>Mileage</TableHead>
                              <TableHead>Cost</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {records.map((record) => (
                              <TableRow key={record._id}>
                                {editingRecord?._id === record._id ? (
                                  <>
                                    <TableCell>
                                      <Input
                                        type="date"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select value={editForm.maintenance_item_id} onValueChange={(value) => setEditForm({...editForm, maintenance_item_id: value})}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {maintenanceItems.map((item) => (
                                            <SelectItem key={item._id} value={item._id}>
                                              {item.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={editForm.mileage}
                                        onChange={(e) => setEditForm({...editForm, mileage: e.target.value})}
                                        placeholder="Mileage"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={editForm.cost}
                                        onChange={(e) => setEditForm({...editForm, cost: e.target.value})}
                                        placeholder="Cost"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        value={editForm.notes}
                                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                        placeholder="Notes"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={saveEdit}>
                                          <Save className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{getMaintenanceItemName(record.maintenance_item_id)}</TableCell>
                                    <TableCell className="flex items-center gap-1">
                                      <Gauge className="w-4 h-4" />
                                      {record.mileage.toLocaleString()} km
                                    </TableCell>
                                    <TableCell>PHP {record.cost.toFixed(2)}</TableCell>
                                    <TableCell className="max-w-xs truncate">
                                      {record.notes || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => startEditing(record)}>
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() => deleteServiceRecord(record._id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
