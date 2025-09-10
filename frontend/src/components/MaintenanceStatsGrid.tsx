import React from "react"
import { DollarSign, Calendar, CheckCircle2, Wrench } from "lucide-react"

interface MaintenanceStatsGridProps {
  totalCost: number
  serviceCount: number
  filteredRecordsCount: number
  maintenanceItemsCount: number
}

export function MaintenanceStatsGrid({ totalCost, serviceCount, filteredRecordsCount, maintenanceItemsCount }: MaintenanceStatsGridProps) {
  const stats = [
    {
      label: "Total Spent",
      value: `₱${totalCost.toFixed(2)}`,
      icon: DollarSign,
      variant: "primary" as const,
    },
    {
      label: "All Services",
      value: serviceCount,
      icon: Wrench,
      variant: "primary" as const,
    },
    {
      label: "Filtered",
      value: filteredRecordsCount,
      icon: Calendar,
      variant: "primary" as const,
    },
    {
      label: "Maintenance Items",
      value: maintenanceItemsCount,
      icon: CheckCircle2,
      variant: "primary" as const,
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <MaintenanceStatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          variant={stat.variant}
        />
      ))}
    </div>
  )
}

interface MaintenanceStatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  variant: "primary"
}

function MaintenanceStatCard({ label, value, icon: Icon, variant }: MaintenanceStatCardProps) {
  const variants = {
    primary: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "text-emerald-600",
      text: "text-emerald-900",
      value: "text-emerald-700",
    },
  }

  const style = variants[variant]

  return (
    <div className={`premium-card p-6 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${style.text}`}>{label}</p>
          <p className={`mt-1 text-3xl font-bold ${style.value}`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${style.icon}`} />
      </div>
    </div>
  )
}