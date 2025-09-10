import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FuelMaintenanceInsightsData } from "@/types"
import { api } from "@/lib/api"
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  RefreshCw,
  Loader2,
  Zap,
  Wrench,
  Gauge,
  Calendar,
  Target,
  BarChart3,
  ChevronDown,
  ChevronRight
} from "lucide-react"

interface FuelMaintenanceInsightsMobileProps {
  vehicleId: string
  className?: string
}

export function FuelMaintenanceInsightsMobile({ vehicleId, className = "" }: FuelMaintenanceInsightsMobileProps) {
  const [insightsData, setInsightsData] = useState<FuelMaintenanceInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    insights: true,
    predictions: false,
    summary: true
  })

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
    } catch (err) {
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    loadInsights()
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
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

  
  // Loading state
  if (loading) {
    return (
      <Card className={`${className} touch-manipulation`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5" />
            Fuel Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 border rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
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
      <Card className={`${className} touch-manipulation`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5" />
            Fuel Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <Button onClick={handleRetry} size="sm" className="touch-manipulation">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!insightsData || (!insightsData.insights.length && !insightsData.predictions.length)) {
    return (
      <Card className={`${className} touch-manipulation`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5" />
            Fuel Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BarChart3 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No Insights Yet</h3>
            <p className="text-sm text-gray-600 mb-3">
              Track fuel and maintenance to see insights
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Log fuel fill-ups</p>
              <p>• Record maintenance</p>
              <p>• Update vehicle info</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { insights, predictions, fuel_summary } = insightsData

  return (
    <Card className={`${className} touch-manipulation`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5" />
          Fuel Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fuel Summary */}
        {fuel_summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer touch-manipulation"
              onClick={() => toggleSection('summary')}
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Fuel Summary
              </h3>
              {expandedSections.summary ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            
            {expandedSections.summary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className={`text-base font-bold ${getEfficiencyRatingColor(fuel_summary.efficiency_rating)}`}>
                    {fuel_summary.current_efficiency ? `${fuel_summary.current_efficiency} km/L` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Efficiency</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {getTrendIcon(fuel_summary.efficiency_trend)}
                    <span className="text-xs">{fuel_summary.trend_percentage > 0 ? '+' : ''}{fuel_summary.trend_percentage}%</span>
                  </div>
                </div>
                <div className="text-center p-2 bg-white/50 rounded">
                  <div className="text-base font-bold text-green-600">
                    {fuel_summary.avg_cost_per_km ? `₱${fuel_summary.avg_cost_per_km}` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">Cost/km</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insights Section */}
        {insights.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer touch-manipulation"
              onClick={() => toggleSection('insights')}
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                Insights ({insights.length})
              </h3>
              {expandedSections.insights ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            
            {expandedSections.insights && (
              <div className="space-y-2">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getSeverityIcon(insight.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}%
                          </Badge>
                        </div>
                        <p className="text-xs mb-2">{insight.message}</p>
                        <div className="text-xs">
                          <div className="font-medium mb-1">Recommendation:</div>
                          <div>{insight.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {insights.length > 3 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm" className="text-xs touch-manipulation">
                      View All Insights ({insights.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Predictions Section */}
        {predictions.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer touch-manipulation"
              onClick={() => toggleSection('predictions')}
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Predictions ({predictions.length})
              </h3>
              {expandedSections.predictions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            
            {expandedSections.predictions && (
              <div className="space-y-2">
                {predictions.slice(0, 2).map((prediction) => (
                  <div key={prediction.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <Wrench className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{prediction.description}</h4>
                          <Badge variant="outline" className={`text-xs ${getUrgencyColor(prediction.urgency)}`}>
                            {prediction.urgency}
                          </Badge>
                        </div>
                        <p className="text-xs mb-2">{prediction.recommended_action}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{prediction.timeframe}</span>
                          </div>
                          {prediction.confidence && (
                            <span className={getConfidenceColor(prediction.confidence)}>
                              {prediction.confidence}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {predictions.length > 2 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm" className="text-xs touch-manipulation">
                      View All Predictions ({predictions.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 touch-manipulation"
            onClick={handleRetry}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            className="flex-1 touch-manipulation bg-blue-600 hover:bg-blue-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}