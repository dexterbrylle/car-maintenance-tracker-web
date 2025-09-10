import { useState, useEffect } from "react"
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Vehicle } from "@/types"
import { api } from "@/lib/api"
import { Car, Plus, Edit, Trash2 } from "lucide-react"

export function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    current_mileage: "",
    purchase_mileage: ""
  })

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      const vehiclesData = await api.getVehicles()
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        current_mileage: parseInt(formData.current_mileage),
        purchase_mileage: parseInt(formData.purchase_mileage) || 0
      }

      if (editingVehicle) {
        await api.updateVehicle(editingVehicle._id, data)
        // Update state instantly instead of reloading - create updated vehicle object
        setVehicles(prevVehicles => 
          prevVehicles.map(vehicle => 
            vehicle._id === editingVehicle._id 
              ? { ...vehicle, ...data }
              : vehicle
          )
        )
      } else {
        const response = await api.addVehicle(data)
        // For new vehicles, we need to create the full vehicle object with the response
        const newVehicle: Vehicle = {
          _id: response.id,
          ...data,
          created_at: new Date().toISOString()
        }
        // Update state instantly instead of reloading
        setVehicles(prevVehicles => [...prevVehicles, newVehicle])
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save vehicle:', error)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      current_mileage: vehicle.current_mileage.toString(),
      purchase_mileage: vehicle.purchase_mileage.toString()
    })
    setShowAddForm(true)
  }

  const handleDelete = async (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await api.deleteVehicle(vehicleId)
        // Update state instantly instead of reloading
        setVehicles(prevVehicles => prevVehicles.filter(vehicle => vehicle._id !== vehicleId))
      } catch (error) {
        console.error('Failed to delete vehicle:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      make: "",
      model: "",
      year: new Date().getFullYear(),
      current_mileage: "",
      purchase_mileage: ""
    })
    setEditingVehicle(null)
    setShowAddForm(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicle fleet</p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="mb-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? "Cancel" : "Add Vehicle"}
          </Button>

          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</CardTitle>
                <CardDescription>Enter vehicle details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="make">Make</Label>
                      <Input
                        id="make"
                        value={formData.make}
                        onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                        placeholder="e.g., Mazda"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="e.g., CX-5"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        min="1900"
                        max="2030"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Current Mileage (km)</Label>
                      <Input
                        id="mileage"
                        type="number"
                        value={formData.current_mileage}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_mileage: e.target.value }))}
                        placeholder="e.g., 50000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseMileage">Purchase Mileage (km)</Label>
                      <Input
                        id="purchaseMileage"
                        type="number"
                        value={formData.purchase_mileage}
                        onChange={(e) => setFormData(prev => ({ ...prev, purchase_mileage: e.target.value }))}
                        placeholder="e.g., 45000"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vehicles yet</h3>
              <p className="text-muted-foreground mb-4">Add your first vehicle to get started</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle._id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{vehicle.year} {vehicle.make} {vehicle.model}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(vehicle._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Added {new Date(vehicle.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Current Mileage:</span>
                      <div className="text-lg font-semibold">
                        {vehicle.current_mileage.toLocaleString()} km
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}