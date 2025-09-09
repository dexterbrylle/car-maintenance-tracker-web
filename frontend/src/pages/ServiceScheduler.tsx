import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VehicleSelector } from "@/components/VehicleSelector"
import { QuickServiceModal } from "@/components/QuickServiceModal"
import { useToast } from "@/components/ui/toast"
import { Vehicle } from "@/types"
import { api } from "@/lib/api"
import { Calendar, Clock, CheckCircle, AlertTriangle, Wrench } from "lucide-react"

interface MaintenanceScheduleItem {
  _id: string
  name: string
  category: string
  interval_km: number
  description: string
  action: string
  status: 'due' | 'due_soon' | 'ok'
  last_service_date?: string
  last_service_mileage?: number
  next_due_mileage: number
  miles_until_due: number
  service_count: number
  vehicle_id: string
}

interface ScheduleResponse {
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    current_mileage: number
  }
  categories: Record<string, MaintenanceScheduleItem[]>
  summary: {
    total_items: number
    due_now: number
    due_soon: number
    up_to_date: number
  }
}

export function ServiceSchedulerPage() {
  const { addToast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [selectedItem, setSelectedItem] = useState<MaintenanceScheduleItem | null>(null)
  const [showQuickService, setShowQuickService] = useState(false)

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicleId) {
      loadSchedule()
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
      addToast({
        variant: "error",
        title: "Error",
        description: "Failed to load vehicles"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSchedule = async () => {
    if (!selectedVehicleId) return
    
    try {
      const response = await api.getMaintenanceSchedule(selectedVehicleId)
      setScheduleData(response.data)
    } catch (error) {
      console.error('Failed to load maintenance schedule:', error)
      addToast({
        variant: "error",
        title: "Error",
        description: "Failed to load maintenance schedule"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'due':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Due Now
        </Badge>
      case 'due_soon':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          Due Soon
        </Badge>
      case 'ok':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Up to Date
        </Badge>
      default:
        return null
    }
  }

  const getActionBadge = (action: string) => {
    const colors = {
      'Replace': 'bg-red-100 text-red-800',
      'Inspect': 'bg-blue-100 text-blue-800',
      'Lubricate': 'bg-green-100 text-green-800',
      'Tighten': 'bg-purple-100 text-purple-800',
      'Service': 'bg-orange-100 text-orange-800'
    }
    return <Badge variant="outline" className={colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
      {action}
    </Badge>
  }

  const handleQuickService = (item: MaintenanceScheduleItem) => {
    setSelectedItem(item)
    setShowQuickService(true)
  }

  const handleServiceComplete = () => {
    setShowQuickService(false)
    setSelectedItem(null)
    loadSchedule()
    addToast({
      variant: "success",
      title: "Service Logged",
      description: "Service has been recorded successfully"
    })
  }

  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const categories = scheduleData ? Object.keys(scheduleData.categories) : []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Maintenance Schedule</h1>
          <p className="text-muted-foreground">
            Official maintenance schedule based on manufacturer recommendations
          </p>
        </div>

        {vehicles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Vehicles</CardTitle>
              <CardDescription>Add a vehicle first to see the maintenance schedule</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  <VehicleSelector
                    vehicles={vehicles}
                    selectedVehicleId={selectedVehicleId}
                    onVehicleChange={setSelectedVehicleId}
                  />
                </CardContent>
              </Card>

              {scheduleData && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Due Now
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{scheduleData.summary.due_now}</div>
                      <div className="text-sm text-muted-foreground">items</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-600">
                        <Clock className="w-5 h-5" />
                        Due Soon
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{scheduleData.summary.due_soon}</div>
                      <div className="text-sm text-muted-foreground">items</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        Up to Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{scheduleData.summary.up_to_date}</div>
                      <div className="text-sm text-muted-foreground">items</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {scheduleData && (
              <>
                <div className="flex gap-4 mb-6">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="due">Due Now</SelectItem>
                      <SelectItem value="due_soon">Due Soon</SelectItem>
                      <SelectItem value="ok">Up to Date</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-6">
                  {Object.entries(scheduleData.categories).map(([category, items]) => {
                    const filteredCategoryItems = items.filter(item => {
                      const statusMatch = filterStatus === "all" || item.status === filterStatus
                      const categoryMatch = filterCategory === "all" || item.category === filterCategory
                      return statusMatch && categoryMatch
                    })

                    if (filteredCategoryItems.length === 0) return null

                    return (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Wrench className="w-5 h-5" />
                            {category}
                          </CardTitle>
                          <CardDescription>
                            {filteredCategoryItems.length} item(s)
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {filteredCategoryItems.map((item) => (
                              <div key={item._id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {item.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      {getStatusBadge(item.status)}
                                      {getActionBadge(item.action)}
                                    </div>
                                  </div>
                                  <div className="text-right space-y-1">
                                    <div className="text-sm font-medium">
                                      Every {item.interval_km.toLocaleString()} km
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Next: {item.next_due_mileage.toLocaleString()} km
                                    </div>
                                    {item.status === 'due' ? (
                                      <div className="text-sm text-red-600 font-medium">
                                        {item.miles_until_due.toLocaleString()} km overdue
                                      </div>
                                    ) : (
                                      <div className="text-sm text-muted-foreground">
                                        {item.miles_until_due.toLocaleString()} km away
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">
                                    {item.service_count > 0 ? (
                                      <>
                                        Last service: {item.last_service_date ? new Date(item.last_service_date).toLocaleDateString() : 'Unknown'} 
                                        at {item.last_service_mileage?.toLocaleString() || 'Unknown'} km
                                        ({item.service_count} time{item.service_count !== 1 ? 's' : ''})
                                      </>
                                    ) : (
                                      'Never serviced'
                                    )}
                                  </div>
                                  
                                  {(item.status === 'due' || item.status === 'due_soon') && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleQuickService(item)}
                                      className="ml-4"
                                    >
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Log Service
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {selectedItem && showQuickService && scheduleData && (
          <QuickServiceModal
            isOpen={showQuickService}
            maintenanceItem={selectedItem}
            vehicle={{
              _id: scheduleData.vehicle.id,
              make: scheduleData.vehicle.make,
              model: scheduleData.vehicle.model,
              year: scheduleData.vehicle.year,
              current_mileage: scheduleData.vehicle.current_mileage,
              purchase_mileage: 0,
              created_at: new Date().toISOString()
            }}
            onSuccess={handleServiceComplete}
            onClose={() => {
              setShowQuickService(false)
              setSelectedItem(null)
            }}
          />
        )}
      </div>
    </div>
  )
}