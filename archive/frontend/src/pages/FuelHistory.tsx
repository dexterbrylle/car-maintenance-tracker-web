import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VehicleSelector } from "@/components/VehicleSelector"
import { FillUpForm } from "@/components/FillUpForm"
import { FuelStatsGrid } from "@/components/FuelStatsGrid"
import { ExportButton } from "@/components/ExportButton"
import { VirtualTable } from "@/components/ui/virtual-table"
import { FuelHistorySkeleton, VehicleSelectorSkeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { FuelRecord } from "@/types"
import { api, debouncedSearch } from "@/lib/api"
import { useVehicles } from "@/hooks/useVehicles"
import { 
  History, 
  Trash2, 
  Search,
  Fuel,
  BarChart3,
  LineChart
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"

export function FuelHistory() {
  const { addToast } = useToast()
  const { vehicles, selectedVehicleId, setSelectedVehicleId, loading: vehiclesLoading } = useVehicles()
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [showFillUpForm, setShowFillUpForm] = useState(false)
  const [dateFilter, setDateFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [searchResults, setSearchResults] = useState<FuelRecord[]>([])

  // Memoized calculations
  const selectedVehicle = useMemo(() => 
    vehicles.find(v => v._id === selectedVehicleId), 
    [vehicles, selectedVehicleId]
  )

  const totalCost = useMemo(() => 
    Array.isArray(fuelRecords) ? fuelRecords.reduce((sum, record) => sum + record.total_cost, 0) : 0, 
    [fuelRecords]
  )

  const totalDistance = useMemo(() => 
    Array.isArray(fuelRecords) && fuelRecords.length > 1 ? 
      Math.max(...fuelRecords.map(r => r.odometer_km)) - Math.min(...fuelRecords.map(r => r.odometer_km)) : 0, 
    [fuelRecords]
  )

  const totalLiters = useMemo(() => 
    Array.isArray(fuelRecords) ? fuelRecords.reduce((sum, record) => sum + record.liters, 0) : 0, 
    [fuelRecords]
  )

  const avgFuelEconomy = useMemo(() => 
    totalDistance > 0 && totalLiters > 0 ? totalDistance / totalLiters : 0, 
    [totalDistance, totalLiters]
  )

  const avgCostPerKm = useMemo(() => 
    totalDistance > 0 ? totalCost / totalDistance : 0, 
    [totalCost, totalDistance]
  )

  // Load vehicle-specific data
  useEffect(() => {
    if (!selectedVehicleId || vehiclesLoading) return

    const loadVehicleData = async () => {
      setDataLoading(true)

      try {
        const fuelResponse = await api.getFuelRecords(selectedVehicleId)
        setFuelRecords(Array.isArray(fuelResponse) ? fuelResponse : [])
      } catch (error) {
        console.error('Failed to load vehicle data:', error)
        // Only show error if not offline
        if (navigator.onLine) {
          addToast({
            variant: "error",
            title: "Error",
            description: "Failed to load vehicle data"
          })
        }
      } finally {
        setDataLoading(false)
      }
    }

    loadVehicleData()
  }, [selectedVehicleId, vehiclesLoading, addToast])

  // Debounced search
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults(fuelRecords)
      return
    }

    debouncedSearch.searchFuelRecords(selectedVehicleId || '', searchTerm, (results) => {
      setSearchResults(results)
    })
  }, [searchTerm, selectedVehicleId, fuelRecords])

  // Memoized handlers
  const handleFillUpComplete = useCallback(() => {
    if (selectedVehicleId) {
      api.getFuelRecords(selectedVehicleId).then(setFuelRecords)
    }
    setShowFillUpForm(false)
    addToast({
      variant: "success",
      title: "Fill-up Logged",
      description: "Fuel record has been added successfully"
    })
  }, [selectedVehicleId, addToast])



  const deleteFuelRecord = useCallback(async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this fuel record? This action cannot be undone.')) {
      return
    }

    try {
      await api.deleteFuelRecord(recordId)
      
      // Refresh data
      if (selectedVehicleId) {
        const fuelResponse = await api.getFuelRecords(selectedVehicleId)
        setFuelRecords(Array.isArray(fuelResponse) ? fuelResponse : [])
      }

      addToast({
        variant: "success",
        title: "Record Deleted",
        description: "Fuel record has been deleted successfully"
      })
    } catch (error) {
      console.error('Failed to delete fuel record:', error)
      addToast({
        variant: "error",
        title: "Delete Failed",
        description: "Failed to delete fuel record"
      })
    }
  }, [selectedVehicleId, addToast])

  const sortedRecords = useMemo(() => {
    return [...(searchTerm ? searchResults : fuelRecords)]
  }, [searchTerm ? searchResults : fuelRecords])

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter(record => {
      const matchesDate = !dateFilter || record.date.startsWith(dateFilter)
      return matchesDate
    })
  }, [sortedRecords, dateFilter])

  // Prepare chart data using memoized values
  const fuelEconomyData = useMemo(() => 
    fuelRecords
      .filter(record => record.fuel_economy_kmpl)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(record => ({
        date: new Date(record.date).toLocaleDateString(),
        fuelEconomy: record.fuel_economy_kmpl,
        costPerKm: record.cost_per_km
      })),
    [fuelRecords]
  )

  const monthlyCostData = useMemo(() => 
    fuelRecords.reduce((acc, record) => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const existing = acc.find(item => item.month === month)
      if (existing) {
        existing.totalCost += record.total_cost
        existing.totalLiters += record.liters
        existing.count += 1
      } else {
        acc.push({ month, totalCost: record.total_cost, totalLiters: record.liters, count: 1 })
      }
      return acc
    }, [] as Array<{ month: string; totalCost: number; totalLiters: number; count: number }>),
    [fuelRecords]
  )

  if (vehiclesLoading) {
    return <FuelHistorySkeleton />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 pb-24 lg:pb-8">
        <div className="mb-8 hidden lg:block">
          <h1 className="text-3xl font-bold mb-2">Fuel History</h1>
          <p className="text-muted-foreground">Track fuel consumption and analyze vehicle performance</p>
        </div>

        <div className="grid gap-6 mb-8">
          {vehicles.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Vehicles</CardTitle>
                <CardDescription>Add a vehicle first</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {/* Vehicle Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle</CardTitle>
                  <CardDescription>Select vehicle to view history</CardDescription>
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <VehicleSelectorSkeleton />
                  ) : (
                    <VehicleSelector
                      vehicles={vehicles}
                      selectedVehicleId={selectedVehicleId || ''}
                      onVehicleChange={setSelectedVehicleId}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Stats Grid - Only show when vehicle is selected */}
              {selectedVehicle && (
                <FuelStatsGrid
                  totalCost={totalCost}
                  totalDistance={totalDistance}
                  avgFuelEconomy={avgFuelEconomy}
                  avgCostPerKm={avgCostPerKm}
                />
              )}
            </>
          )}

          {/* Charts Section */}
          {selectedVehicleId && fuelRecords.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fuel Economy Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Fuel Economy Trend
                  </CardTitle>
                  <CardDescription>Fuel efficiency over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={fuelEconomyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="fuelEconomy" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        name="Fuel Economy (km/L)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Monthly Fuel Cost
                  </CardTitle>
                  <CardDescription>Fuel expenses by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyCostData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="totalCost" fill="#2563eb" name="Total Cost (₱)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Actions */}
          {selectedVehicleId && (
            <Card>
              <CardHeader>
                <CardTitle>Filters & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:hidden">
                    <label className="text-sm font-medium">Filter by month</label>
                    <Input
                      type="month"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      placeholder="Filter by date"
                    />
                  </div>
                  <div className="hidden lg:block">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="month"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      placeholder="Filter by date"
                    />
                  </div>
                  <div className="hidden lg:block">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search records..."
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => setShowFillUpForm(true)}
                      className="flex-1"
                    >
                      Add Fill-up
                    </Button>
                    <ExportButton
                      vehicles={vehicles}
                      selectedVehicleId={selectedVehicleId}
                      onVehicleChange={setSelectedVehicleId}
                      variant="outline"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fill-up Form */}
          {showFillUpForm && selectedVehicleId && (
            <FillUpForm
              vehicleId={selectedVehicleId}
              onSuccess={handleFillUpComplete}
              onCancel={() => setShowFillUpForm(false)}
            />
          )}
        </div>

        {/* Fuel History Table */}
        {selectedVehicleId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Fuel Records
                </span>
                <span className="text-sm text-muted-foreground">
                  {filteredRecords.length} records
                </span>
              </CardTitle>
              <CardDescription>
                {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No fuel records</h3>
                  <p className="text-muted-foreground mb-4">Start by logging your first fill-up</p>
                  <Button onClick={() => setShowFillUpForm(true)}>
                    Add Fill-up
                  </Button>
                </div>
              ) : (
                <VirtualTable
                  data={filteredRecords}
                  columns={[
                    {
                      key: 'date',
                      header: 'Date',
                      render: (value) => new Date(value).toLocaleDateString(),
                      className: 'font-medium'
                    },
                    {
                      key: 'odometer_km',
                      header: 'Odometer',
                      render: (value) => `${value.toLocaleString()} km`,
                      className: 'flex items-center gap-1'
                    },
                    {
                      key: 'liters',
                      header: 'Liters',
                      render: (value) => `${value.toFixed(2)} L`
                    },
                    {
                      key: 'price_per_liter',
                      header: 'Price/L',
                      render: (value) => `₱${value.toFixed(2)}`
                    },
                    {
                      key: 'total_cost',
                      header: 'Total Cost',
                      render: (value) => `₱${value.toFixed(2)}`
                    },
                    {
                      key: 'fuel_economy_kmpl',
                      header: 'Fuel Economy',
                      render: (value) => {
                        if (!value) return '-'
                        const className = value >= 12 ? 'text-green-600' : value >= 8 ? 'text-yellow-600' : 'text-red-600'
                        return <span className={className}>{value.toFixed(1)} km/L</span>
                      }
                    },
                    {
                      key: 'cost_per_km',
                      header: 'Cost per km',
                      render: (value) => value ? `₱${value.toFixed(2)}` : '-'
                    },
                    {
                      key: 'notes',
                      header: 'Notes',
                      render: (value) => value || "-"
                    },
                    {
                      key: '_id',
                      header: 'Actions',
                      render: (_, record) => (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteFuelRecord(record._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  containerHeight={600}
                  loading={dataLoading}
                  onRowClick={() => {}}
                  emptyMessage="No fuel records found"
                />
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}