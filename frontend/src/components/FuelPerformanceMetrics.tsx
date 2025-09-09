import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FuelPerformanceMetrics as FuelPerformanceMetricsType } from "@/types"
import { api } from "@/lib/api"
import { 
  Fuel, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react"

interface FuelPerformanceMetricsProps {
  vehicleId: string
  className?: string
}

export function FuelPerformanceMetrics({ vehicleId, className = "" }: FuelPerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<FuelPerformanceMetricsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (vehicleId) {
      loadMetrics()
    }
  }, [vehicleId])

  const loadMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const metrics = await api.getFuelPerformanceMetrics(vehicleId)
      setMetrics(metrics)
    } catch (err) {
      setError('Failed to load fuel performance metrics')
    } finally {
      setLoading(false)
    }
  }

  const getFuelEconomyColor = (economy: number | null) => {
    if (!economy) return "text-muted-foreground"
    if (economy >= 12) return "text-green-600"  // Excellent
    if (economy >= 8) return "text-yellow-600"   // Good
    return "text-red-600"                        // Poor
  }

  const getCostPerKmColor = (cost: number | null) => {
    if (!cost) return "text-muted-foreground"
    if (cost <= 5) return "text-green-600"       // Excellent
    if (cost <= 8) return "text-yellow-600"     // Good
    return "text-red-600"                        // Poor
  }

  const getTrendIcon = (trend?: number) => {
    if (!trend || trend === 0) return null
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const getTrendColor = (trend?: number) => {
    if (!trend || trend === 0) return "text-muted-foreground"
    if (trend > 0) return "text-green-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Performance Metrics
          </CardTitle>
          <CardDescription>Your vehicle's fuel economy and cost analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading fuel metrics...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Performance Metrics
          </CardTitle>
          <CardDescription>Your vehicle's fuel economy and cost analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={loadMetrics} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Performance Metrics
          </CardTitle>
          <CardDescription>Your vehicle's fuel economy and cost analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No fuel data available</p>
            <p className="text-sm text-muted-foreground">
              Start tracking your fuel consumption to see performance metrics
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentYear = new Date().getFullYear()
  const lastFillupDate = metrics.last_fillup_date 
    ? new Date(metrics.last_fillup_date).toLocaleDateString()
    : 'No data'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="w-5 h-5" />
          Fuel Performance Metrics
        </CardTitle>
        <CardDescription>Your vehicle's fuel economy and cost analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Average Fuel Economy */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Fuel className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${getFuelEconomyColor(metrics.avg_fuel_economy)}`}>
              {metrics.avg_fuel_economy ? `${metrics.avg_fuel_economy} km/L` : 'N/A'}
            </div>
            <div className="text-sm text-blue-700">Avg Fuel Economy</div>
            {metrics.trend_percent !== undefined && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(metrics.trend_percent)}
                <span className={`text-xs ${getTrendColor(metrics.trend_percent)}`}>
                  {metrics.trend_percent > 0 ? '+' : ''}{metrics.trend_percent}%
                </span>
              </div>
            )}
          </div>

          {/* Average Cost per Kilometer */}
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${getCostPerKmColor(metrics.avg_cost_per_km)}`}>
              {metrics.avg_cost_per_km ? `₱${metrics.avg_cost_per_km}` : 'N/A'}
            </div>
            <div className="text-sm text-green-700">Cost per Kilometer</div>
          </div>

          {/* Total Fuel Cost YTD */}
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              ₱{metrics.total_fuel_cost_ytd.toLocaleString()}
            </div>
            <div className="text-sm text-purple-700">Fuel Cost YTD {currentYear}</div>
          </div>

          {/* Total Fill-ups */}
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">
              {metrics.total_fillups}
            </div>
            <div className="text-sm text-orange-700">Total Fill-ups</div>
            <div className="text-xs text-orange-600 mt-1">
              Last: {lastFillupDate}
            </div>
          </div>
        </div>

        {/* Best/Worst Performance */}
        {(metrics.best_fuel_economy || metrics.worst_fuel_economy) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {metrics.best_fuel_economy && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-700 mb-1">Best Fuel Economy</div>
                    <div className="text-xl font-bold text-green-600">
                      {metrics.best_fuel_economy} km/L
                    </div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            )}
            
            {metrics.worst_fuel_economy && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-red-700 mb-1">Worst Fuel Economy</div>
                    <div className="text-xl font-bold text-red-600">
                      {metrics.worst_fuel_economy} km/L
                    </div>
                  </div>
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monthly Fuel Cost */}
        {metrics.monthly_fuel_cost && metrics.monthly_fuel_cost.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Monthly Fuel Cost Trend
            </h3>
            <div className="space-y-2">
              {metrics.monthly_fuel_cost.slice(0, 3).map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground">
                      {month.fillup_count} fill-ups • {month.total_liters.toFixed(1)}L
                      {month.avg_economy && ` • ${month.avg_economy} km/L`}
                    </div>
                  </div>
                  <Badge variant="outline">
                    ₱{month.total_cost.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Insights */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Performance Insights</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            {metrics.avg_fuel_economy && metrics.avg_fuel_economy >= 12 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Excellent fuel economy performance</span>
              </div>
            )}
            {metrics.avg_fuel_economy && metrics.avg_fuel_economy < 8 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Fuel economy below average - consider maintenance check</span>
              </div>
            )}
            {metrics.avg_cost_per_km && metrics.avg_cost_per_km > 10 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>High cost per kilometer - monitor fuel prices and driving habits</span>
              </div>
            )}
            {metrics.trend_percent && Math.abs(metrics.trend_percent) > 5 && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${metrics.trend_percent > 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                <span>
                  Fuel economy {metrics.trend_percent > 0 ? 'improving' : 'declining'} by {Math.abs(metrics.trend_percent)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}