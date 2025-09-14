import { AlertTriangle, Clock, CheckCircle2, Wrench } from "lucide-react"

interface StatsGridProps {
  maintenanceStatus: {
    due_now: Array<any>
    due_soon: Array<any>
    ok: Array<any>
  }
  fuelStats?: {
    avg_fuel_economy?: number
    avg_cost_per_km?: number
    monthly_fuel_cost?: Array<{ total_cost: number }>
  }
  serviceCount?: number
}

export function StatsGrid({ maintenanceStatus, fuelStats, serviceCount = 0 }: StatsGridProps) {
  // Note: fuelStats and serviceCount are kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void { fuelStats, serviceCount } // Mark as intentionally unused
  const stats = [
    {
      label: "Overdue",
      value: maintenanceStatus.due_now.length,
      icon: AlertTriangle,
      variant: "critical" as const,
    },
    {
      label: "Due Soon",
      value: maintenanceStatus.due_soon.length,
      icon: Clock,
      variant: "warning" as const,
    },
    {
      label: "Up to Date",
      value: maintenanceStatus.ok.length,
      icon: CheckCircle2,
      variant: "success" as const,
    },
    {
      label: "Total Items",
      value: maintenanceStatus.due_now.length + maintenanceStatus.due_soon.length + maintenanceStatus.ok.length,
      icon: Wrench,
      variant: "neutral" as const,
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
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

interface StatCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  variant: "critical" | "warning" | "success" | "neutral"
}

function StatCard({ label, value, icon: Icon, variant }: StatCardProps) {
  const variants = {
    critical: {
      bg: "bg-red-50",
      border: "border-red-100",
      icon: "text-red-600",
      text: "text-red-900",
      value: "text-red-700",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "text-amber-600",
      text: "text-amber-900",
      value: "text-amber-700",
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "text-emerald-600",
      text: "text-emerald-900",
      value: "text-emerald-700",
    },
    neutral: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      icon: "text-slate-600",
      text: "text-slate-900",
      value: "text-slate-700",
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