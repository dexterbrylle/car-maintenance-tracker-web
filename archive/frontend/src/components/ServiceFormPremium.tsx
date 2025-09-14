import { useState } from "react"
import { ArrowLeft, Calendar, Gauge, DollarSign, FileText, X, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MaintenanceItem } from "@/types"

interface ServiceFormProps {
  vehicleId: string
  maintenanceItems: MaintenanceItem[]
  onSuccess: () => void
  onCancel: () => void
}

export function ServiceForm({ vehicleId, maintenanceItems, onSuccess, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mileage: "",
    cost: "",
    maintenance_item_id: "",
    notes: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormValid = formData.date && formData.mileage && formData.maintenance_item_id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Here you would typically call your API
      console.log("Submitting service:", {
        vehicle_id: vehicleId,
        ...formData,
        mileage: parseInt(formData.mileage),
        cost: parseFloat(formData.cost) || 0
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess()
    } catch (error) {
      console.error("Failed to submit service:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-white lg:relative lg:bg-transparent">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 touch-target"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">Log Service</h2>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 touch-target"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type */}
          <div>
            <Label className="mb-2 flex items-center space-x-2 text-sm font-medium text-slate-900">
              <Wrench className="h-4 w-4" />
              <span>Service Type</span>
            </Label>
            <Select
              value={formData.maintenance_item_id}
              onValueChange={(value) => updateFormData("maintenance_item_id", value)}
            >
              <SelectTrigger className="input-premium">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {maintenanceItems.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <Label className="mb-2 flex items-center space-x-2 text-sm font-medium text-slate-900">
              <Calendar className="h-4 w-4" />
              <span>Service Date</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData("date", e.target.value)}
              className="input-premium"
            />
          </div>

          {/* Mileage */}
          <div>
            <Label className="mb-2 flex items-center space-x-2 text-sm font-medium text-slate-900">
              <Gauge className="h-4 w-4" />
              <span>Mileage</span>
            </Label>
            <Input
              type="number"
              placeholder="Current vehicle mileage"
              value={formData.mileage}
              onChange={(e) => updateFormData("mileage", e.target.value)}
              className="input-premium"
              inputMode="numeric"
            />
          </div>

          {/* Cost */}
          <div>
            <Label className="mb-2 flex items-center space-x-2 text-sm font-medium text-slate-900">
              <DollarSign className="h-4 w-4" />
              <span>Cost (₱)</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Service cost"
              value={formData.cost}
              onChange={(e) => updateFormData("cost", e.target.value)}
              className="input-premium"
              inputMode="decimal"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-2 flex items-center space-x-2 text-sm font-medium text-slate-900">
              <FileText className="h-4 w-4" />
              <span>Notes</span>
            </Label>
            <Textarea
              placeholder="Service details and observations..."
              value={formData.notes}
              onChange={(e) => updateFormData("notes", e.target.value)}
              rows={4}
              className="input-premium resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? "Saving Service..." : "Log Service"}
          </Button>
        </form>
      </div>
    </div>
  )
}