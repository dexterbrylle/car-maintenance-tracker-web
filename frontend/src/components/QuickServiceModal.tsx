import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { api } from "@/lib/api"
import { MaintenanceItem, Vehicle } from "@/types"

interface QuickServiceModalProps {
  isOpen: boolean
  onClose: () => void
  maintenanceItem: MaintenanceItem
  vehicle: Vehicle
  onSuccess: () => void
}

export function QuickServiceModal({ 
  isOpen, 
  onClose, 
  maintenanceItem, 
  vehicle, 
  onSuccess 
}: QuickServiceModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: vehicle.current_mileage.toString(),
    cost: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.date) {
      newErrors.date = "Date is required"
    } else if (new Date(formData.date) > new Date()) {
      newErrors.date = "Date cannot be in the future"
    }
    
    const mileage = parseInt(formData.mileage, 10)
    if (isNaN(mileage) || mileage < 0) {
      newErrors.mileage = "Please enter a valid mileage"
    } else if (mileage < vehicle.current_mileage) {
      newErrors.mileage = "Service mileage cannot be less than current mileage"
    }
    
    const cost = parseFloat(formData.cost)
    if (formData.cost && (isNaN(cost) || cost < 0)) {
      newErrors.cost = "Cost must be a positive number"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await api.addService({
        vehicle_id: vehicle._id,
        maintenance_item_id: maintenanceItem._id,
        date: formData.date,
        mileage: parseInt(formData.mileage, 10),
        cost: parseFloat(formData.cost) || 0,
        notes: formData.notes
      })
      
      onSuccess()
      onClose()
      
      addToast({
        title: "Service logged",
        description: `${maintenanceItem.name} service recorded successfully`,
        variant: "success"
      })
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mileage: vehicle.current_mileage.toString(),
        cost: '',
        notes: ''
      })
      setErrors({})
    } catch (error) {
      console.error('Failed to log service:', error)
      setErrors({ submit: "Failed to log service" })
      addToast({
        title: "Service logging failed",
        description: "Failed to record service. Please try again.",
        variant: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setErrors({})
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Service</DialogTitle>
          <DialogDescription>
            Record service for <span className="font-medium">{maintenanceItem.name}</span> on{" "}
            <span className="font-medium">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Service Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage (km)</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                className={errors.mileage ? "border-red-500" : ""}
              />
              {errors.mileage && (
                <p className="text-sm text-red-500">{errors.mileage}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost">Cost (optional)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.cost}
              onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
              className={errors.cost ? "border-red-500" : ""}
            />
            {errors.cost && (
              <p className="text-sm text-red-500">{errors.cost}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Service details, observations, etc."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
          
          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging..." : "Log Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}