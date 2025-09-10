import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface MaintenanceSectionProps {
  title: string
  items: Array<{
    maintenance_item: {
      _id: string
      name: string
      category: string
    }
    miles_overdue?: number
    miles_until_due?: number
  }>
  variant: "critical" | "warning" | "success"
  collapsible?: boolean
  onMarkComplete?: (itemId: string) => void
}

export function MaintenanceSection({ 
  title, 
  items, 
  variant, 
  collapsible = false,
  onMarkComplete 
}: MaintenanceSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Start collapsed only for "success" variant when collapsible
    return collapsible && variant === "success"
  })

  if (items.length === 0) return null

  const variants = {
    critical: "border-red-200 bg-red-50",
    warning: "border-amber-200 bg-amber-50",
    success: "border-emerald-200 bg-emerald-50",
  }

  return (
    <div className={`premium-card p-6 ${variants[variant]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
            {items.length}
          </span>
        </div>
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <MaintenanceItem
              key={item.maintenance_item._id}
              item={item}
              variant={variant}
              onMarkComplete={onMarkComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MaintenanceItem({ 
  item, 
  variant, 
  onMarkComplete 
}: {
  item: MaintenanceSectionProps["items"][0]
  variant: MaintenanceSectionProps["variant"]
  onMarkComplete?: (itemId: string) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
      <div className="flex-1">
        <h4 className="font-medium text-slate-900">{item.maintenance_item.name}</h4>
        <div className="mt-1 space-y-1">
          <p className="text-sm text-slate-600">{item.maintenance_item.category}</p>
          {variant === "critical" && item.miles_overdue && (
            <p className="text-sm font-medium text-red-600">
              {item.miles_overdue.toLocaleString()} km overdue
            </p>
          )}
          {variant === "warning" && item.miles_until_due && (
            <p className="text-sm font-medium text-amber-600">
              Due in {item.miles_until_due.toLocaleString()} km
            </p>
          )}
        </div>
      </div>
      
      {(variant === "critical" || variant === "warning") && onMarkComplete && (
        <div className="ml-4">
          <button
            onClick={() => onMarkComplete(item.maintenance_item._id)}
            className="btn-primary text-sm px-4 py-2"
          >
            Mark Complete
          </button>
        </div>
      )}
    </div>
  )
}