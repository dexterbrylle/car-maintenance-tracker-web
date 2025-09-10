import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Fuel, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

interface AddFillupModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  currentMileage?: number
  onSuccess?: () => void
}

export function AddFillupModal({ isOpen, onClose, vehicleId, currentMileage, onSuccess }: AddFillupModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer_km: currentMileage?.toString() || '',
    liters: '',
    price_per_liter: '',
    full_tank: true,
    notes: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()

  const calculateTotal = (liters: string, pricePerLiter: string) => {
    const litersNum = parseFloat(liters) || 0
    const priceNum = parseFloat(pricePerLiter) || 0
    return (litersNum * priceNum).toFixed(2)
  }

  const isFormValid = () => {
    return formData.odometer_km && 
           formData.liters && 
           formData.price_per_liter &&
           parseFloat(formData.odometer_km) > 0 &&
           parseFloat(formData.liters) > 0 &&
           parseFloat(formData.price_per_liter) > 0
  }

  const handleSubmit = async (data: typeof formData) => {
    if (!isFormValid()) return

    setIsSubmitting(true)
    try {
      const fillupData = {
        vehicle_id: vehicleId,
        date: data.date,
        odometer_km: parseFloat(data.odometer_km),
        liters: parseFloat(data.liters),
        price_per_liter: parseFloat(data.price_per_liter),
        total_cost: parseFloat(calculateTotal(data.liters, data.price_per_liter)),
        full_tank: data.full_tank,
        notes: data.notes || undefined
      }

      await api.addFuelRecord(fillupData)
      
      addToast({
        title: "Success",
        description: "Fill-up recorded successfully",
        variant: "success"
      })

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        odometer_km: currentMileage?.toString() || '',
        liters: '',
        price_per_liter: '',
        full_tank: true,
        notes: ''
      })

      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add fillup:', error)
      addToast({
        title: "Error",
        description: "Failed to add fill-up record",
        variant: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Add Fill-up
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          {/* Odometer - Large, touch-friendly */}
          <div>
            <Label htmlFor="odometer">Odometer (km)</Label>
            <Input
              type="number"
              id="odometer"
              placeholder="54800"
              value={formData.odometer_km}
              onChange={(e) => setFormData({...formData, odometer_km: e.target.value})}
              className="text-lg h-12"
            />
          </div>

          {/* Two-column layout for mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="liters">Liters</Label>
              <Input
                type="number"
                step="0.1"
                id="liters"
                placeholder="45.5"
                value={formData.liters}
                onChange={(e) => setFormData({...formData, liters: e.target.value})}
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="price">₱ per Liter</Label>
              <Input
                type="number"
                step="0.01"
                id="price"
                placeholder="58.50"
                value={formData.price_per_liter}
                onChange={(e) => setFormData({...formData, price_per_liter: e.target.value})}
                className="h-12"
              />
            </div>
          </div>

          {/* Auto-calculated total */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm text-gray-600">Total Cost</Label>
            <p className="text-xl font-bold">
              ₱{calculateTotal(formData.liters, formData.price_per_liter)}
            </p>
          </div>

          {/* Full tank toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="full-tank"
              checked={formData.full_tank}
              onCheckedChange={(checked) => setFormData({...formData, full_tank: checked})}
            />
            <Label htmlFor="full-tank">Full tank (required for fuel economy calculation)</Label>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Shell V-Power, highway driving..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit(formData)}
            disabled={!isFormValid() || isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Fill-up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}