import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FuelMaintenanceInsightsData } from "@/types"
import { api } from "@/lib/api"
import { 
  Fuel, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  RefreshCw,
  Zap,
  Wrench,
  DollarSign,
  Gauge,
  Calendar,
  Target,
  BarChart3
} from "lucide-react"

interface FuelMaintenanceInsightsProps {
  vehicleId: string
  className?: string
}

export function FuelMaintenanceInsights({ vehicleId, className = "" }: FuelMaintenanceInsightsProps) {
  const [insightsData, setInsightsData] = useState<FuelMaintenanceInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (vehicleId) {
      loadInsights()
    }
  }, [vehicleId])

  const loadInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getFuelMaintenanceInsights(vehicleId)
      setInsightsData(response.data)
      setRetryCount(0)
    } catch (err) {
      setError('Failed to load fuel-maintenance insights')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    loadInsights()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'success': return <CheckCircle className="w-4 h-4" />
      case 'info': return <Info className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High'
    if (confidence >= 60) return 'Medium'
    return 'Low'
  }

  const getEfficiencyRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable': return <BarChart3 className="w-4 h-4 text-blue-600" />
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  const formatConfidence = (confidence: number) => `${confidence}%`

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`

  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Fuel-Maintenance Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of fuel efficiency and maintenance correlation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Skeleton for insights */}
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            
            {/* Skeleton for predictions */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              {[1, 2].map(i => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Fuel-Maintenance Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of fuel efficiency and maintenance correlation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again {retryCount > 0 && `(${retryCount})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!insightsData || (!insightsData.insights.length && !insightsData.predictions.length)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Fuel-Maintenance Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of fuel efficiency and maintenance correlation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking fuel consumption and maintenance to see AI-powered insights
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Record fuel fill-ups regularly</p>
              <p>• Log maintenance activities</p>
              <p>• Keep vehicle information updated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { insights, predictions, fuel_summary } = insightsData

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Fuel-Maintenance Insights
        </CardTitle>
        <CardDescription>
          AI-powered analysis of fuel efficiency and maintenance correlation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fuel Summary */}
        {fuel_summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Fuel Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-lg font-bold ${getEfficiencyRatingColor(fuel_summary.efficiency_rating)}`}>
                  {fuel_summary.current_efficiency ? `${fuel_summary.current_efficiency} km/L` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Current Efficiency</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getTrendIcon(fuel_summary.efficiency_trend)}
                  <span className="text-xs">{fuel_summary.trend_percentage > 0 ? '+' : ''}{fuel_summary.trend_percentage}%</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {fuel_summary.efficiency_rating.charAt(0).toUpperCase() + fuel_summary.efficiency_rating.slice(1)}
                </div>
                <div className="text-xs text-muted-foreground">Efficiency Rating</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {fuel_summary.avg_cost_per_km ? `₱${fuel_summary.avg_cost_per_km}` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Cost per km</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  ₱{fuel_summary.total_cost_ytd.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">YTD Fuel Cost</div>
              </div>
            </div>
          </div>
        )}

        {/* Insights Section */}
        {insights.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Performance Insights
            </h3>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(insight.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getConfidenceLabel(insight.confidence)}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{insight.message}</p>
                      <div className="text-xs space-y-1">
                        <div className="font-medium">Recommendation:</div>
                        <div>{insight.recommendation}</div>
                        {insight.fuel_economy_impact && (
                          <div className="flex items-center gap-1">
                            <Fuel className="w-3 h-3" />
                            <span>Potential impact: {insight.fuel_economy_impact > 0 ? '+' : ''}{insight.fuel_economy_impact}% fuel economy</span>
                          </div>
                        )}
                        {insight.cost_impact && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Cost impact: {formatCurrency(insight.cost_impact)}</span>
                          </div>
                        )}
                      </div>
                      {insight.related_maintenance && insight.related_maintenance.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="text-xs font-medium mb-1">Related Maintenance:</div>
                          <div className="flex flex-wrap gap-1">
                            {insight.related_maintenance.map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictions Section */}
        {predictions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Predictive Maintenance
            </h3>
            <div className="space-y-3">
              {predictions.map((prediction) => (
                <div key={prediction.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Wrench className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{prediction.description}</h4>
                        <Badge variant="outline" className={`text-xs ${getUrgencyColor(prediction.urgency)}`}>
                          {prediction.urgency.charAt(0).toUpperCase() + prediction.urgency.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatConfidence(prediction.confidence)}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{prediction.recommended_action}</p>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Timeframe: {prediction.timeframe}</span>
                        </div>
                        {prediction.fuel_economy_improvement && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span>Potential improvement: +{prediction.fuel_economy_improvement}% fuel economy</span>
                          </div>
                        )}
                        {prediction.estimated_cost_impact && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Estimated cost: {formatCurrency(prediction.estimated_cost_impact)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {fuel_summary.recommendations.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              General Recommendations
            </h3>
            <ul className="space-y-1 text-sm">
              {fuel_summary.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Insights updated {new Date().toLocaleDateString('en-PH')}
        </div>
      </CardContent>
    </Card>
  )
}