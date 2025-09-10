import { DollarSign, Gauge, Fuel, Calculator } from "lucide-react"

interface FuelStatsGridProps {
  totalCost: number
  totalDistance: number
  avgFuelEconomy: number
  avgCostPerKm: number
}

export function FuelStatsGrid({ totalCost, totalDistance, avgFuelEconomy, avgCostPerKm }: FuelStatsGridProps) {
  const stats = [
    {
      label: "Total Cost",
      value: `₱${totalCost.toFixed(2)}`,
      icon: DollarSign,
      variant: "primary" as const,
    },
    {
      label: "Distance",
      value: `${totalDistance.toLocaleString()} km`,
      icon: Gauge,
      variant: "primary" as const,
    },
    {
      label: "Avg Economy",
      value: `${avgFuelEconomy.toFixed(1)} km/L`,
      icon: Fuel,
      variant: "primary" as const,
    },
    {
      label: "Cost per km",
      value: `₱${avgCostPerKm.toFixed(2)}`,
      icon: Calculator,
      variant: "primary" as const,
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <FuelStatCard
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

interface FuelStatCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  variant: "primary"
}

function FuelStatCard({ label, value, icon: Icon, variant }: FuelStatCardProps) {
  const variants = {
    primary: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "text-blue-600",
      text: "text-blue-900",
      value: "text-blue-700",
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