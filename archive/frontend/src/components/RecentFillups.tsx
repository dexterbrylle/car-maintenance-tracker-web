import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Fuel } from "lucide-react"
import { api } from "@/lib/api"
import { FuelRecord } from "@/types"
import { useNavigate } from "react-router-dom"

interface RecentFillupsProps {
  vehicleId: string
  limit?: number
}

export function RecentFillups({ vehicleId, limit = 5 }: RecentFillupsProps) {
  const [fillups, setFillups] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadFillups = async () => {
      try {
        setLoading(true)
        const data = await api.getFuelRecords(vehicleId)
        setFillups(Array.isArray(data) ? data.slice(0, limit) : [])
      } catch (error) {
        console.error('Failed to load fillups:', error)
        setError('Failed to load fill-ups')
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) {
      loadFillups()
    }
  }, [vehicleId, limit])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Recent Fill-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Recent Fill-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Recent Fill-ups
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/fuel')}>
          View All
        </Button>
      </div>

      {fillups.length === 0 ? (
        <div className="text-center py-8">
          <Fuel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No fill-up records yet</p>
          <p className="text-sm text-gray-400 mt-2">Start tracking your fuel economy!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fillups.map((fillup) => (
            <div key={fillup._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{formatDate(fillup.date)}</p>
                <p className="text-sm text-gray-600">
                  {fillup.odometer_km.toLocaleString()} km • {fillup.liters}L
                </p>
                {fillup.notes && (
                  <p className="text-xs text-gray-500 mt-1">{fillup.notes}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">₱{fillup.total_cost.toFixed(2)}</p>
                {fillup.fuel_economy_kmpl && (
                  <p className="text-sm text-gray-600">{fillup.fuel_economy_kmpl} km/L</p>
                )}
                {fillup.cost_per_km && (
                  <p className="text-xs text-gray-500">₱{fillup.cost_per_km}/km</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}