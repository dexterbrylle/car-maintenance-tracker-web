import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VehicleSelector } from "@/components/VehicleSelector"
import { Vehicle, MaintenanceItem, ServiceRecord } from "@/types"
import { api } from "@/lib/api"
import { Calendar, Clock, AlertTriangle, CheckCircle, Settings } from "lucide-react"

interface ServiceSchedulerProps {
  vehicleId?: string
}

export function ServiceScheduler({ vehicleId: propVehicleId }: ServiceSchedulerProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState(propVehicleId || "")
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([])
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicleId) {
      loadMaintenanceItems()
      loadServiceRecords()
    }
  }, [selectedVehicleId])

  const loadVehicles = async () => {
    try {
      const vehiclesData = await api.getVehicles()
      const vehiclesArray = Array.isArray(vehiclesData) ? vehiclesData : []
      setVehicles(vehiclesArray)
      if (vehiclesArray.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehiclesArray[0]._id)
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMaintenanceItems = async () => {
    try {
      const maintenanceData = await api.getMaintenance(selectedVehicleId)
      setMaintenanceItems(Array.isArray(maintenanceData) ? maintenanceData : [])
    } catch (error) {
      console.error('Failed to load maintenance items:', error)
    }
  }

  const loadServiceRecords = async () => {
    try {
      const serviceData = await api.getServices(selectedVehicleId)
      setServiceRecords(Array.isArray(serviceData) ? serviceData : [])
    } catch (error) {
      console.error('Failed to load service records:', error)
    }
  }

  const getServiceStatus = (maintenanceItem: MaintenanceItem) => {
    const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId)
    if (!selectedVehicle) return 'unknown'

    const currentMileage = selectedVehicle.current_mileage
    const relatedServices = serviceRecords.filter(service => 
      service.maintenance_item_id === maintenanceItem._id
    )

    if (relatedServices.length === 0) return 'overdue'

    const lastService = relatedServices.reduce((latest, service) => 
      service.mileage > latest.mileage ? service : latest
    )

    const nextDueMileage = lastService.mileage + maintenanceItem.interval_km
    const warningMileage = nextDueMileage - 1000

    if (currentMileage >= nextDueMileage) return 'overdue'
    if (currentMileage >= warningMileage) return 'due-soon'
    return 'completed'
  }

  const getLastServiceDate = (maintenanceItem: MaintenanceItem) => {
    const relatedServices = serviceRecords.filter(service => 
      service.maintenance_item_id === maintenanceItem._id
    )

    if (relatedServices.length === 0) return null

    const lastService = relatedServices.reduce((latest, service) => 
      new Date(service.date) > new Date(latest.date) ? service : latest
    )

    return new Date(lastService.date).toLocaleDateString()
  }

  const getLastServiceMileage = (maintenanceItem: MaintenanceItem) => {
    const relatedServices = serviceRecords.filter(service => 
      service.maintenance_item_id === maintenanceItem._id
    )

    if (relatedServices.length === 0) return 0

    const lastService = relatedServices.reduce((latest, service) => 
      service.mileage > latest.mileage ? service : latest
    )

    return lastService.mileage
  }

  const getNextServiceDue = (maintenanceItem: MaintenanceItem) => {
    const lastServiceMileage = getLastServiceMileage(maintenanceItem)
    const nextDueMileage = lastServiceMileage + maintenanceItem.interval_km
    
    return {
      mileage: nextDueMileage,
      estimatedDate: estimateNextServiceDate(lastServiceMileage, nextDueMileage)
    }
  }

  const estimateNextServiceDate = (_lastMileage: number, nextMileage: number) => {
    const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId)
    if (!selectedVehicle) return null

    const currentMileage = selectedVehicle.current_mileage
    const mileageDiff = nextMileage - currentMileage
    
    // Estimate based on average monthly mileage (assuming 1000 km/month)
    const estimatedMonths = Math.ceil(mileageDiff / 1000)
    const nextDate = new Date()
    nextDate.setMonth(nextDate.getMonth() + estimatedMonths)
    
    return nextDate.toLocaleDateString()
  }

  // Group maintenance items by category from database
  const maintenanceSchedule = Object.entries(
    maintenanceItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, MaintenanceItem[]>)
  ).map(([category, items]) => ({
    category,
    items
  }))

  const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Maintenance Schedule
          </CardTitle>
          <CardDescription>
            Comprehensive maintenance schedule for your vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <VehicleSelector
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              onVehicleChange={setSelectedVehicleId}
            />
          </div>

          {selectedVehicle && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Vehicle</div>
                  <div className="font-semibold">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Mileage</div>
                  <div className="font-semibold">{selectedVehicle.current_mileage.toLocaleString()} km</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Next Major Service</div>
                  <div className="font-semibold">
                    {(Math.ceil(selectedVehicle.current_mileage / 8000) * 8000).toLocaleString()} km
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span>Due Soon</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Overdue</span>
              </div>
              <div className="text-muted-foreground">R = Replace | I = Inspect</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Maintenance Item</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead className="text-center">Next Service</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                  <TableHead className="text-center">Interval</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceSchedule.map((section) => (
                  <>
                    <TableRow key={section.category} className="bg-muted/50">
                      <TableCell colSpan={6} className="font-semibold text-center">
                        {section.category}
                      </TableCell>
                    </TableRow>
                    {section.items.map((item) => {
                      const status = getServiceStatus(item)
                      const lastService = getLastServiceDate(item)
                      
                      return (
                        <TableRow 
                          key={item._id}
                          className={
                            status === 'overdue' ? 'bg-red-50 border-red-200' :
                            status === 'due-soon' ? 'bg-yellow-50 border-yellow-200' :
                            ''
                          }
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div>{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lastService ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {lastService}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const nextService = getNextServiceDue(item)
                              return nextService.mileage > 0 ? (
                                <div className="text-center">
                                  <div className="font-medium">{nextService.mileage.toLocaleString()} km</div>
                                  {nextService.estimatedDate && (
                                    <div className="text-sm text-muted-foreground">
                                      ~{nextService.estimatedDate}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Due now</span>
                              )
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">R</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.interval_km.toLocaleString()} km
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : status === 'due-soon' ? (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                              <span className={
                                status === 'completed' ? 'text-green-700' :
                                status === 'due-soon' ? 'text-yellow-700' : 'text-red-700'
                              }>
                                {status === 'completed' ? 'Completed' :
                                 status === 'due-soon' ? 'Due Soon' : 'Overdue'}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}