import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { api } from "@/lib/api"
import { Edit3, Check, X } from "lucide-react"

interface MileageUpdateFormProps {
  vehicleId: string
  currentMileage: number
  onUpdate: (newMileage: number) => void
}

export function MileageUpdateForm({ vehicleId, currentMileage, onUpdate }: MileageUpdateFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [mileage, setMileage] = useState(currentMileage.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  const handleSave = async () => {
    const newMileage = parseInt(mileage, 10)
    
    if (isNaN(newMileage) || newMileage < 0) {
      setError("Please enter a valid mileage")
      return
    }
    
    if (newMileage < currentMileage) {
      setError("New mileage cannot be less than current mileage")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      await api.updateVehicleMileage(vehicleId, newMileage)
      onUpdate(newMileage)
      setIsEditing(false)
      addToast({
        title: "Mileage updated",
        description: `Current mileage updated to ${newMileage.toLocaleString()} km`,
        variant: "success"
      })
    } catch (error) {
      console.error('Failed to update mileage:', error)
      setError("Failed to update mileage")
      addToast({
        title: "Update failed",
        description: "Failed to update vehicle mileage",
        variant: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setMileage(currentMileage.toString())
    setError(null)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold">
          {currentMileage.toLocaleString()} km
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 p-0"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <Input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter current mileage"
              className="text-lg font-medium"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1"
              size="sm"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}