import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { DashboardMaintenanceItem } from "@/types"
import { useState } from "react"
import { api } from "@/lib/api"

interface MaintenanceCardProps {
  item: DashboardMaintenanceItem
  status: "due_now" | "due_soon" | "ok"
  vehicleId: string
  onServiceComplete?: () => void
}

export function MaintenanceCard({ item, status, vehicleId, onServiceComplete }: MaintenanceCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maintenanceItem = item.maintenance_item

  const handleMarkComplete = async () => {
    setIsSubmitting(true)
    try {
      await api.addService({
        vehicle_id: vehicleId,
        maintenance_item_id: maintenanceItem._id,
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

  const getStatusText = () => {
    switch (status) {
      case "due_now":
        return item.miles_overdue ? `${item.miles_overdue.toLocaleString()} km overdue` : "Due Now"
      case "due_soon":
        return item.miles_until_due ? `Due in ${item.miles_until_due.toLocaleString()} km` : "Due Soon"
      default:
        return item.miles_until_due ? `Due in ${item.miles_until_due.toLocaleString()} km` : "Up to Date"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{maintenanceItem.name}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {maintenanceItem.category} • Every {maintenanceItem.interval_km?.toLocaleString() || 'N/A'} km
        </CardDescription>
      </CardHeader>
      <CardContent>
        {maintenanceItem.description && (
          <p className="text-sm text-muted-foreground mb-2">{maintenanceItem.description}</p>
        )}
        <div className="text-sm mb-3">
          <span className="font-medium">Status:</span> {getStatusText()}
        </div>
        {maintenanceItem.action && (
          <div className="text-sm mb-3">
            <span className="font-medium">Action:</span> {maintenanceItem.action}
          </div>
        )}
        {item.last_service_mileage && (
          <div className="text-sm mb-3 text-muted-foreground">
            Last service: {item.last_service_mileage.toLocaleString()} km
          </div>
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
