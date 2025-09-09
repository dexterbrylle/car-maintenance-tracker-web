import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MaintenanceItem } from "@/types"
import { useState } from "react"
import { api } from "@/lib/api"
import { Settings, Search } from "lucide-react"

interface ServiceFormProps {
  vehicleId: string
  maintenanceItems: MaintenanceItem[]
  onSuccess?: () => void
}

export function ServiceForm({ vehicleId, maintenanceItems, onSuccess }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: "",
    notes: ""
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [itemCosts, setItemCosts] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter and group maintenance items by category
  const filteredItems = maintenanceItems.filter(item => 
    !searchTerm || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, MaintenanceItem[]>)

  const handleItemToggle = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      if (checked) {
        return [...prev, itemId]
      } else {
        return prev.filter(id => id !== itemId)
      }
    })
    
    // Initialize cost when item is selected
    if (checked && !itemCosts[itemId]) {
      setItemCosts(prev => ({
        ...prev,
        [itemId]: ""
      }))
    } else if (!checked) {
      // Remove cost when item is deselected
      setItemCosts(prev => {
        const newCosts = { ...prev }
        delete newCosts[itemId]
        return newCosts
      })
    }
  }

  const handleItemCostChange = (itemId: string, cost: string) => {
    setItemCosts(prev => ({
      ...prev,
      [itemId]: cost
    }))
  }

  const handleSelectAllInCategory = (category: string, items: MaintenanceItem[]) => {
    const itemIds = items.map(item => item._id)
    const allSelected = itemIds.every(id => selectedItems.includes(id))
    
    if (allSelected) {
      // Deselect all items in this category
      setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)))
      setItemCosts(prev => {
        const newCosts = { ...prev }
        itemIds.forEach(id => delete newCosts[id])
        return newCosts
      })
    } else {
      // Select all items in this category
      setSelectedItems(prev => [...new Set([...prev, ...itemIds])])
      setItemCosts(prev => {
        const newCosts = { ...prev }
        itemIds.forEach(id => {
          if (!newCosts[id]) {
            newCosts[id] = ""
          }
        })
        return newCosts
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newMileage = parseInt(formData.mileage)

      // Create a service record for each selected item with individual costs
      const promises = selectedItems.map(itemId =>
        api.addService({
          vehicle_id: vehicleId,
          maintenance_item_id: itemId,
          date: formData.date,
          mileage: newMileage,
          cost: parseFloat(itemCosts[itemId]) || 0,
          notes: formData.notes
        })
      )

      await Promise.all(promises)

      // Update vehicle mileage if the new mileage is higher
      try {
        const vehiclesResponse = await api.getVehicles()
        const currentVehicle = vehiclesResponse.data.find((v: any) => v._id === vehicleId)
        if (currentVehicle && newMileage > currentVehicle.current_mileage) {
          await api.updateVehicle(vehicleId, { current_mileage: newMileage })
        }
      } catch (error) {
        console.error('Failed to update vehicle mileage:', error)
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mileage: "",
        notes: ""
      })
      setSelectedItems([])
      setItemCosts({})

      onSuccess?.()
    } catch (error) {
      console.error('Failed to add service record:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Log Service
        </CardTitle>
        <CardDescription>
          Select all maintenance items that were completed during this service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Maintenance Items Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Maintenance Items Completed</Label>
              <div className="text-sm text-muted-foreground">
                {selectedItems.length} selected
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search maintenance items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {Object.keys(groupedItems).length === 0 && searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No maintenance items found matching "{searchTerm}"</p>
                  <Button 
                    variant="link" 
                    onClick={() => setSearchTerm("")}
                    className="text-sm"
                  >
                    Clear search
                  </Button>
                </div>
              )}
              
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAllInCategory(category, items)}
                        className="text-xs h-6 px-2"
                      >
                        {items.every(item => selectedItems.includes(item._id)) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                    {items.map((item) => (
                      <div key={item._id} className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50">
                        <Checkbox
                          id={item._id}
                          checked={selectedItems.includes(item._id)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemToggle(item._id, e.target.checked)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={item._id} className="text-sm font-medium cursor-pointer">
                            {item.name}
                          </Label>
                          <div className="text-xs text-muted-foreground">
                            Every {item.interval_km.toLocaleString()} km
                            {item.description && (
                              <div className="mt-1">{item.description}</div>
                            )}
                          </div>
                          {selectedItems.includes(item._id) && (
                            <div className="mt-2">
                              <Label htmlFor={`cost-${item._id}`} className="text-xs text-muted-foreground">
                                Cost (PHP)
                              </Label>
                              <Input
                                id={`cost-${item._id}`}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={itemCosts[item._id] || ""}
                                onChange={(e) => handleItemCostChange(item._id, e.target.value)}
                                className="w-full mt-1"
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedItems.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Select at least one maintenance item
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage (km)</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                placeholder="Current mileage"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the service..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || selectedItems.length === 0}
            className="w-full"
          >
            {isSubmitting ? "Logging..." : `Log ${selectedItems.length} Service${selectedItems.length !== 1 ? 's' : ''}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
