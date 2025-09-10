import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Lightbulb, AlertTriangle } from "lucide-react"

interface Insight {
  type: string
  severity: 'error' | 'warning' | 'success' | 'info'
  title: string
  message: string
  recommendation?: string
  action_items?: Array<{
    name: string
    category: string
  }>
}

interface InsightsSectionProps {
  insights: Insight[]
}

export function InsightsSection({ insights }: InsightsSectionProps) {
  if (insights.length === 0) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Insights
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Alert key={index} className={getSeverityColor(insight.severity)}>
              {getSeverityIcon(insight.severity)}
              <AlertTitle>{insight.title}</AlertTitle>
              <AlertDescription className="mt-2">
                <p>{insight.message}</p>
                {insight.recommendation && (
                  <p className="text-sm font-medium text-blue-600 mt-2">
                    Recommendation: {insight.recommendation}
                  </p>
                )}
                {insight.action_items && insight.action_items.length > 0 && (
                  <div className="mt-3">
                    <Button size="sm" variant="outline">
                      Schedule {insight.action_items[0].name}
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}