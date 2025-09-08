import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { MaintenanceItem } from "@/types"
import { useState } from "react"
import { api } from "@/lib/api"

interface MaintenanceCardProps {
  item: MaintenanceItem
  status: "due_now" | "due_soon" | "ok"
  vehicleId: string
  onServiceComplete?: () => void
}

export function MaintenanceCard({ item, status, vehicleId, onServiceComplete }: MaintenanceCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleMarkComplete = async () => {
    setIsSubmitting(true)
    try {
      await api.addService({
        vehicle_id: vehicleId,
        maintenance_item_id: item._id,
        date: new Date().toISOString().split('T')[0],
        mileage: 0, // This should be updated with current vehicle mileage
        cost: 0,
        notes: ""
      })
      onServiceComplete?.()
    } catch (error) {
      console.error('Failed to mark service as complete:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "due_now":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Due Now
          </Badge>
        )
      case "due_soon":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Due Soon
          </Badge>
        )
      default:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            OK
          </Badge>
        )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {item.category} • Every {item.interval_km.toLocaleString()} km
        </CardDescription>
      </CardHeader>
      <CardContent>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
        )}
        {status !== "ok" && (
          <Button 
            onClick={handleMarkComplete}
            disabled={isSubmitting}
            className="w-full"
            size="sm"
          >
            {isSubmitting ? "Marking..." : "Mark as Complete"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}