import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertTriangle, Wrench, Eye, Droplets, Zap, Settings } from "lucide-react"
import { DashboardMaintenanceItem } from "@/types"
import { useState } from "react"

interface MaintenanceStatusCardProps {
  item: DashboardMaintenanceItem
  status: 'due_now' | 'due_soon' | 'ok'
  onMarkComplete: (itemId: string) => void
  onScheduleService?: (itemId: string) => void
}

export function MaintenanceStatusCard({ 
  item, 
  status, 
  onMarkComplete, 
  onScheduleService 
}: MaintenanceStatusCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maintenanceItem = item.maintenance_item

  const handleMarkComplete = async () => {
    setIsSubmitting(true)
    try {
      await onMarkComplete(maintenanceItem._id)
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
          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3 h-3" />
            Due Now
          </Badge>
        )
      case "due_soon":
        return (
          <Badge className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3" />
            Due Soon
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            OK
          </Badge>
        )
    }
  }

  const getActionIcon = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'replace':
        return <Wrench className="w-3 h-3" />
      case 'inspect':
        return <Eye className="w-3 h-3" />
      case 'lubricate':
        return <Droplets className="w-3 h-3" />
      case 'tighten':
        return <Zap className="w-3 h-3" />
      case 'service':
        return <Settings className="w-3 h-3" />
      default:
        return <Settings className="w-3 h-3" />
    }
  }

  const getActionBadge = (action: string) => {
    if (!action) return null
    
    const colors = {
      replace: 'bg-red-100 text-red-700',
      inspect: 'bg-blue-100 text-blue-700',
      lubricate: 'bg-purple-100 text-purple-700',
      tighten: 'bg-orange-100 text-orange-700',
      service: 'bg-gray-100 text-gray-700'
    }
    
    const colorClass = colors[action.toLowerCase() as keyof typeof colors] || colors.service
    
    return (
      <Badge variant="outline" className={`flex items-center gap-1 text-xs ${colorClass} border-0`}>
        {getActionIcon(action)}
        {action}
      </Badge>
    )
  }

  const getStatusText = () => {
    switch (status) {
      case "due_now":
        if (item.miles_overdue) {
          return (
            <span className="text-red-600 font-medium">
              {item.miles_overdue.toLocaleString()} km overdue
            </span>
          )
        }
        return <span className="text-red-600 font-medium">Due Now</span>
      case "due_soon":
        if (item.miles_until_due) {
          return (
            <span className="text-yellow-600 font-medium">
              Due in {item.miles_until_due.toLocaleString()} km
            </span>
          )
        }
        return <span className="text-yellow-600 font-medium">Due Soon</span>
      default:
        if (item.miles_until_due) {
          return (
            <span className="text-green-600">
              Due in {item.miles_until_due.toLocaleString()} km
            </span>
          )
        }
        return <span className="text-green-600">Up to Date</span>
    }
  }

  const getDueAtText = () => {
    if (item.due_at_mileage) {
      return `Due at ${item.due_at_mileage.toLocaleString()} km`
    }
    return null
  }

  const getLastServiceText = () => {
    if (item.last_service_mileage) {
      const text = `Last: ${item.last_service_mileage.toLocaleString()} km`
      if (item.last_service_date) {
        const date = new Date(item.last_service_date).toLocaleDateString()
        return `${text} (${date})`
      }
      return text
    }
    return "Never serviced"
  }

  return (
    <Card className={`w-full transition-all duration-200 hover:shadow-md ${
      status === 'due_now' ? 'border-red-200 bg-red-50/30' : 
      status === 'due_soon' ? 'border-yellow-200 bg-yellow-50/30' : 
      'border-green-200 bg-green-50/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight break-words">
              {maintenanceItem.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {maintenanceItem.category}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadge()}
            {getActionBadge(maintenanceItem.action || '')}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {getStatusText()}
            </div>
            {getDueAtText() && (
              <div className="text-xs text-muted-foreground mt-1">
                {getDueAtText()}
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div>Every {maintenanceItem.interval_km?.toLocaleString() || 'N/A'} km</div>
            <div>{getLastServiceText()}</div>
          </div>
        </div>

        {maintenanceItem.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {maintenanceItem.description}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {status !== "ok" && (
            <Button
              onClick={handleMarkComplete}
              disabled={isSubmitting}
              size="sm"
              className="flex-1 h-8 text-xs"
              variant={status === 'due_now' ? 'default' : 'outline'}
            >
              {isSubmitting ? "Marking..." : "Mark Complete"}
            </Button>
          )}
          
          {onScheduleService && (
            <Button
              onClick={() => onScheduleService(maintenanceItem._id)}
              size="sm"
              variant="outline"
              className="h-8 text-xs"
            >
              Quick Log
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}