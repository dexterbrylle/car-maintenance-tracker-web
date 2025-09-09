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
import { Vehicle, ServiceRecord, MaintenanceItem } from "@/types"
import { api } from "@/lib/api"
import { History, Calendar, Gauge, Edit, Save, X, Trash2, Search } from "lucide-react"

export function ServiceHistory() {
  const { addToast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    loadVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicleId) {
      loadServiceRecords()
      loadMaintenanceItems()
    }
  }, [selectedVehicleId])

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
        variant: "error",
        title: "Error",
        description: "Failed to load vehicles"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadServiceRecords = async () => {
    try {
      const response = await api.getServices(selectedVehicleId)
      const serviceData = Array.isArray(response) ? response : []
      setServiceRecords(serviceData)
    } catch (error) {
      console.error('Failed to load service records:', error)
      addToast({
        variant: "error",
        title: "Error",
        description: "Failed to load service records"
      })
    }
  }

  const loadMaintenanceItems = async () => {
    try {
      const response = await api.getMaintenance(selectedVehicleId)
      const maintenanceData = Array.isArray(response) ? response : []
      setMaintenanceItems(maintenanceData)
    } catch (error) {
      console.error('Failed to load maintenance items:', error)
      addToast({
        variant: "error",
        title: "Error",
        description: "Failed to load maintenance items"
      })
    }
  }

  
  const handleServiceComplete = () => {
    loadServiceRecords()
    setShowServiceForm(false)
    addToast({
      variant: "success",
      title: "Service Logged",
      description: "Service record has been added successfully"
    })
  }

  const startEditing = (record: ServiceRecord) => {
    setEditingRecord(record)
    setEditForm({
      date: record.date,
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

      await api.updateService(editingRecord._id, {
        date: editForm.date,
        mileage: newMileage,
        cost: parseFloat(editForm.cost),
        notes: editForm.notes,
        maintenance_item_id: editForm.maintenance_item_id
      })

      // Update vehicle mileage if the new mileage is higher
      try {
        const vehiclesResponse = await api.getVehicles()
        const vehiclesData = Array.isArray(vehiclesResponse) ? vehiclesResponse : []
        const currentVehicle = vehiclesData.find((v: any) => v._id === selectedVehicleId)
        if (currentVehicle && newMileage > currentVehicle.current_mileage) {
          await api.updateVehicle(selectedVehicleId, { current_mileage: newMileage })
        }
      } catch (error) {
        console.error('Failed to update vehicle mileage:', error)
      }

      await loadServiceRecords()
      await loadVehicles() // Refresh vehicles data to update mileage display
      cancelEditing()
      addToast({
        variant: "success",
        title: "Record Updated",
        description: "Service record has been updated successfully"
      })
    } catch (error) {
      console.error('Failed to update service record:', error)
      addToast({
        variant: "error",
        title: "Update Failed",
        description: "Failed to update service record"
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

  const totalCost = serviceRecords.reduce((sum, record) => sum + record.cost, 0)

  const selectedVehicle = vehicles?.find(v => v._id === selectedVehicleId)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Service History</h1>
          <p className="text-muted-foreground">View and track completed maintenance services</p>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {vehicles.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Vehicles</CardTitle>
                  <CardDescription>Add a vehicle first</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle</CardTitle>
                    <CardDescription>Select vehicle to view history</CardDescription>
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
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          Total Spent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          PHP {totalCost.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          All services
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Services
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {filteredRecords.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total records
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Filters</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
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
                        <div>
                          <label className="text-sm font-medium">Date</label>
                          <Input
                            type="month"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            placeholder="Filter by date"
                          />
                        </div>
                        <div>
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
                        <div className="pt-2">
                          <ExportButton
                            vehicles={vehicles}
                            selectedVehicleId={selectedVehicleId}
                            onVehicleChange={setSelectedVehicleId}
                            className="w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
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
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No service records</h3>
                  <p className="text-muted-foreground mb-4">Start by logging your first service</p>
                </div>
              ) : (
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
                    {filteredRecords
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record) => (
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
                              <TableCell className="font-medium">
                                {new Date(record.date).toLocaleDateString()}
                              </TableCell>
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
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
