import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function StatsCard({ title, value, subtitle, trend, icon, onClick, className }: StatsCardProps) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md",
        onClick ? 'hover:bg-gray-50' : '',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center text-xs",
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' : 'text-gray-500'
            )}>
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {trend === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}