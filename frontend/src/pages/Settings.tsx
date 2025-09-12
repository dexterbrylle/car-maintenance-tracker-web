import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vehicle } from "@/types"
import { api, axiosInstance, API_BASE } from "@/lib/api"
import { Car, Plus, Edit, Trash2, Settings as SettingsIcon, AlertCircle } from "lucide-react"

interface AppSettings {
  currency: string
  distance: string
  volume: string
}

interface ValidationError {
  make?: string;
  model?: string;
  year?: string;
  current_mileage?: string;
}

export function Settings() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    currency: "PHP",
    distance: "KM",
    volume: "Liters"
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    current_mileage: 0
  })
  const [validationErrors, setValidationErrors] = useState<ValidationError>({})
  const [apiError, setApiError] = useState<string>("")

  useEffect(() => {
    loadVehicles()
    loadSettings()
  }, [])

  const loadVehicles = async (forceRefresh = false) => {
    try {
      let response
      if (forceRefresh) {
        // Force fresh data by bypassing cache
        response = await axiosInstance.get(`${API_BASE}/vehicles`).then(res => res.data)
      } else {
        response = await api.getVehicles()
      }
      const vehiclesData = Array.isArray(response) ? response : []
      setVehicles(vehiclesData)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
      setVehicles([])
    }
  }

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    localStorage.setItem('appSettings', JSON.stringify(newSettings))
  }

  const validateForm = (): boolean => {
    const errors: ValidationError = {}
    
    // Validate make
    if (!formData.make.trim()) {
      errors.make = "Vehicle make is required"
    } else if (formData.make.trim().length < 2) {
      errors.make = "Vehicle make must be at least 2 characters"
    }
    
    // Validate model
    if (!formData.model.trim()) {
      errors.model = "Vehicle model is required"
    } else if (formData.model.trim().length < 2) {
      errors.model = "Vehicle model must be at least 2 characters"
    }
    
    // Validate year
    const currentYear = new Date().getFullYear()
    if (!formData.year || formData.year < 1900 || formData.year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`
    }
    
    // Validate current mileage
    if (formData.current_mileage < 0) {
      errors.current_mileage = "Current mileage cannot be negative"
    } else if (formData.current_mileage > 10000000) {
      errors.current_mileage = "Current mileage seems too high (max 10,000,000)"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const clearValidationErrors = () => {
    setValidationErrors({})
    setApiError("")
  }

  const handleAddVehicle = async () => {
    clearValidationErrors()
    
    // Validate form data
    if (!validateForm()) {
      return
    }
    
    try {
      // Prepare data for API
      const vehicleData = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: formData.year,
        current_mileage: formData.current_mileage,
        purchase_mileage: formData.current_mileage
      }
      
      await api.addVehicle(vehicleData)
      
      // Force refresh vehicles to ensure we get the latest data
      await loadVehicles(true)
      setShowAddForm(false)
      setFormData({ make: "", model: "", year: new Date().getFullYear(), current_mileage: 0 })
    } catch (error: any) {
      console.error('Failed to add vehicle:', error)
      
      // Handle API errors
      if (error.response?.data?.message) {
        setApiError(error.response.data.message)
      } else if (error.message) {
        setApiError(error.message)
      } else {
        setApiError("Failed to add vehicle. Please try again.")
      }
    }
  }

  const handleEditVehicle = async () => {
    if (!editingVehicle) return
    
    clearValidationErrors()
    
    // Validate editing vehicle data
    const errors: ValidationError = {}
    
    if (!editingVehicle.make.trim()) {
      errors.make = "Vehicle make is required"
    } else if (editingVehicle.make.trim().length < 2) {
      errors.make = "Vehicle make must be at least 2 characters"
    }
    
    if (!editingVehicle.model.trim()) {
      errors.model = "Vehicle model is required"
    } else if (editingVehicle.model.trim().length < 2) {
      errors.model = "Vehicle model must be at least 2 characters"
    }
    
    const currentYear = new Date().getFullYear()
    if (!editingVehicle.year || editingVehicle.year < 1900 || editingVehicle.year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`
    }
    
    if (editingVehicle.current_mileage < 0) {
      errors.current_mileage = "Current mileage cannot be negative"
    } else if (editingVehicle.current_mileage > 10000000) {
      errors.current_mileage = "Current mileage seems too high (max 10,000,000)"
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    try {
      await api.updateVehicle(editingVehicle._id, {
        make: editingVehicle.make.trim(),
        model: editingVehicle.model.trim(),
        year: editingVehicle.year,
        current_mileage: editingVehicle.current_mileage
      })
      await loadVehicles(true)
      setEditingVehicle(null)
    } catch (error: any) {
      console.error('Failed to update vehicle:', error)
      
      if (error.response?.data?.message) {
        setApiError(error.response.data.message)
      } else if (error.message) {
        setApiError(error.message)
      } else {
        setApiError("Failed to update vehicle. Please try again.")
      }
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This will also delete all associated maintenance items and service records.')) {
      return
    }
    
    try {
      await api.deleteVehicle(vehicleId)
      await loadVehicles(true)
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-6 py-8 pb-24 lg:pb-8">
        <div className="mb-8 hidden lg:block">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your vehicles and application preferences</p>
        </div>

        <div className="grid gap-6">
          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>Configure your preferred units and currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings.currency} 
                    onValueChange={(value) => saveSettings({...settings, currency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHP">Philippine Peso (PHP)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                      <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance Unit</Label>
                  <Select 
                    value={settings.distance} 
                    onValueChange={(value) => saveSettings({...settings, distance: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KM">Kilometers (KM)</SelectItem>
                      <SelectItem value="MI">Miles (MI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume Unit</Label>
                  <Select 
                    value={settings.volume} 
                    onValueChange={(value) => saveSettings({...settings, volume: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Liters">Liters (L)</SelectItem>
                      <SelectItem value="Gallons">Gallons (gal)</SelectItem>
                      <SelectItem value="Quarts">Quarts (qt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Management
                </span>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {showAddForm ? "Hide Form" : "Add Vehicle"}
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your vehicles and their information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showAddForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Add New Vehicle</CardTitle>
                    <CardDescription>Enter the details for your new vehicle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {apiError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{apiError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="make">Make</Label>
                          <Input
                            id="make"
                            value={formData.make}
                            onChange={(e) => {
                              setFormData({...formData, make: e.target.value})
                              if (validationErrors.make) {
                                setValidationErrors({...validationErrors, make: undefined})
                              }
                            }}
                            placeholder="e.g., Mazda"
                            className={validationErrors.make ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.make && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.make}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={formData.model}
                            onChange={(e) => {
                              setFormData({...formData, model: e.target.value})
                              if (validationErrors.model) {
                                setValidationErrors({...validationErrors, model: undefined})
                              }
                            }}
                            placeholder="e.g., CX-5"
                            className={validationErrors.model ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.model && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.model}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="year">Year</Label>
                          <Input
                            id="year"
                            type="number"
                            value={formData.year}
                            onChange={(e) => {
                              const value = e.target.value
                              setFormData({...formData, year: value ? parseInt(value) : new Date().getFullYear()})
                              if (validationErrors.year) {
                                setValidationErrors({...validationErrors, year: undefined})
                              }
                            }}
                            className={validationErrors.year ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.year && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.year}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mileage">Current Mileage ({settings.distance})</Label>
                          <Input
                            id="mileage"
                            type="number"
                            value={formData.current_mileage}
                            onChange={(e) => {
                              const value = e.target.value
                              setFormData({...formData, current_mileage: value ? parseInt(value) : 0})
                              if (validationErrors.current_mileage) {
                                setValidationErrors({...validationErrors, current_mileage: undefined})
                              }
                            }}
                            className={validationErrors.current_mileage ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.current_mileage && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.current_mileage}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                          setShowAddForm(false)
                          clearValidationErrors()
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddVehicle}>Add Vehicle</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {vehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No vehicles added yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first vehicle to get started</p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Car className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                          <p className="text-sm text-muted-foreground">
                            Current Mileage: {vehicle.current_mileage.toLocaleString()} {settings.distance}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingVehicle(vehicle)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteVehicle(vehicle._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {editingVehicle && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Edit Vehicle</CardTitle>
                    <CardDescription>Update vehicle information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {apiError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{apiError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-make">Make</Label>
                          <Input
                            id="edit-make"
                            value={editingVehicle.make}
                            onChange={(e) => {
                              setEditingVehicle(prev => 
                                prev ? {...prev, make: e.target.value} : null
                              )
                              if (validationErrors.make) {
                                setValidationErrors({...validationErrors, make: undefined})
                              }
                            }}
                            className={validationErrors.make ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.make && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.make}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-model">Model</Label>
                          <Input
                            id="edit-model"
                            value={editingVehicle.model}
                            onChange={(e) => {
                              setEditingVehicle(prev => 
                                prev ? {...prev, model: e.target.value} : null
                              )
                              if (validationErrors.model) {
                                setValidationErrors({...validationErrors, model: undefined})
                              }
                            }}
                            className={validationErrors.model ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.model && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.model}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-year">Year</Label>
                          <Input
                            id="edit-year"
                            type="number"
                            value={editingVehicle.year}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVehicle(prev => 
                                prev ? {...prev, year: value ? parseInt(value) : new Date().getFullYear()} : null
                              )
                              if (validationErrors.year) {
                                setValidationErrors({...validationErrors, year: undefined})
                              }
                            }}
                            className={validationErrors.year ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.year && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.year}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-mileage">Current Mileage ({settings.distance})</Label>
                          <Input
                            id="edit-mileage"
                            type="number"
                            value={editingVehicle.current_mileage}
                            onChange={(e) => {
                              const value = e.target.value
                              setEditingVehicle(prev => 
                                prev ? {...prev, current_mileage: value ? parseInt(value) : 0} : null
                              )
                              if (validationErrors.current_mileage) {
                                setValidationErrors({...validationErrors, current_mileage: undefined})
                              }
                            }}
                            className={validationErrors.current_mileage ? "border-red-500 focus:border-red-500" : ""}
                          />
                          {validationErrors.current_mileage && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors.current_mileage}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                          setEditingVehicle(null)
                          clearValidationErrors()
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleEditVehicle}>Save Changes</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}