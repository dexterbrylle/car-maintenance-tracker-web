import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/toast"
import { Vehicle } from "@/types"
import { api } from "@/lib/api"
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react"

interface ExportOptions {
  format: 'csv' | 'excel'
  dateRange: {
    start: string
    end: string
  }
  selectedColumns: string[]
  includeSummary: boolean
  includeCharts: boolean
}

interface ExportHistoryItem {
  id: string
  type: string
  filename: string
  date: string
  size: string
  status: 'completed' | 'failed' | 'processing'
}

const EXPORT_TYPES = {
  service_history: {
    name: 'Service History',
    description: 'Complete maintenance service records',
    icon: FileText,
    columns: ['Date', 'Service', 'Mileage', 'Cost', 'Notes', 'Category', 'Action Type'],
    color: 'bg-blue-500'
  },
  fuel_history: {
    name: 'Fuel History',
    description: 'Fuel consumption and cost records',
    icon: Database,
    columns: ['Date', 'Odometer', 'Liters', 'Price/L', 'Total Cost', 'Fuel Economy', 'Cost per km', 'Notes'],
    color: 'bg-green-500'
  },
  maintenance_schedule: {
    name: 'Maintenance Schedule',
    description: 'Upcoming and overdue maintenance items',
    icon: Calendar,
    columns: ['Item', 'Category', 'Interval', 'Last Service', 'Next Due', 'Status', 'Priority'],
    color: 'bg-orange-500'
  },
  vehicle_info: {
    name: 'Vehicle Information',
    description: 'Basic vehicle details and specifications',
    icon: FileSpreadsheet,
    columns: ['Make', 'Model', 'Year', 'Current Mileage', 'Purchase Mileage', 'Created Date'],
    color: 'bg-purple-500'
  },
  combined_report: {
    name: 'Combined Report',
    description: 'Complete vehicle report with all data',
    icon: Download,
    columns: ['All data from above categories'],
    color: 'bg-red-500'
  }
}

interface ExportUtilityProps {
  vehicles: Vehicle[]
  selectedVehicleId: string
  onVehicleChange: (id: string) => void
  children: React.ReactNode
}

export function ExportUtility({ vehicles, selectedVehicleId, onVehicleChange, children }: ExportUtilityProps) {
  const { addToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<keyof typeof EXPORT_TYPES>('service_history')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      start: '',
      end: ''
    },
    selectedColumns: [],
    includeSummary: true,
    includeCharts: false
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([])

  const handleExport = async () => {
    if (!selectedVehicleId) {
      addToast({
        variant: "error",
        title: "No Vehicle Selected",
        description: "Please select a vehicle to export data"
      })
      return
    }

    setIsExporting(true)
    
    try {
      let response: any
      let filename = ''

      // Build query parameters
      const params = new URLSearchParams()
      if (exportOptions.dateRange.start) {
        params.append('start_date', exportOptions.dateRange.start)
      }
      if (exportOptions.dateRange.end) {
        params.append('end_date', exportOptions.dateRange.end)
      }
      exportOptions.selectedColumns.forEach(column => {
        params.append('columns', column)
      })

      const queryString = params.toString()
      const baseUrl = selectedVehicleId + (queryString ? `?${queryString}` : '')

      switch (selectedType) {
        case 'service_history':
          response = await api.exportServiceHistory(baseUrl)
          filename = `service-history-${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'fuel_history':
          response = await api.exportFuelHistory(baseUrl)
          filename = `fuel-history-${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'maintenance_schedule':
          response = await api.exportMaintenanceSchedule(selectedVehicleId)
          filename = `maintenance-schedule-${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'vehicle_info':
          response = await api.exportVehicleInfo(selectedVehicleId)
          filename = `vehicle-info-${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'combined_report':
          response = await api.exportCombinedReport(selectedVehicleId)
          filename = `combined-report-${new Date().toISOString().split('T')[0]}.csv`
          break
        default:
          throw new Error('Invalid export type')
      }

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Add to export history
      const historyItem: ExportHistoryItem = {
        id: Date.now().toString(),
        type: EXPORT_TYPES[selectedType].name,
        filename,
        date: new Date().toISOString(),
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        status: 'completed'
      }
      
      setExportHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep last 10 items

      addToast({
        variant: "success",
        title: "Export Complete",
        description: `${EXPORT_TYPES[selectedType].name} exported successfully`
      })

      setIsOpen(false)
      
    } catch (error) {
      console.error('Export failed:', error)
      
      // Add failed export to history
      const historyItem: ExportHistoryItem = {
        id: Date.now().toString(),
        type: EXPORT_TYPES[selectedType].name,
        filename: '',
        date: new Date().toISOString(),
        size: '0 KB',
        status: 'failed'
      }
      
      setExportHistory(prev => [historyItem, ...prev.slice(0, 9)])

      addToast({
        variant: "error",
        title: "Export Failed",
        description: `Failed to export ${EXPORT_TYPES[selectedType].name}`
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleColumnToggle = (column: string) => {
    setExportOptions(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(column)
        ? prev.selectedColumns.filter(c => c !== column)
        : [...prev.selectedColumns, column]
    }))
  }

  const selectAllColumns = () => {
    const type = EXPORT_TYPES[selectedType]
    if (type.columns[0] === 'All data from above categories') {
      // For combined report, select all columns from all types
      const allColumns = Object.values(EXPORT_TYPES)
        .filter(t => t !== type)
        .flatMap(t => t.columns)
      setExportOptions(prev => ({ ...prev, selectedColumns: allColumns }))
    } else {
      setExportOptions(prev => ({ ...prev, selectedColumns: type.columns }))
    }
  }

  const clearAllColumns = () => {
    setExportOptions(prev => ({ ...prev, selectedColumns: [] }))
  }

  const exportType = EXPORT_TYPES[selectedType]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your vehicle data in various formats for analysis or record keeping
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Type Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Export Type</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {Object.entries(EXPORT_TYPES).map(([key, type]) => {
                  const TypeIcon = type.icon
                  return (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-all ${
                        selectedType === key 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedType(key as keyof typeof EXPORT_TYPES)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${type.color} text-white`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{type.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <Label className="text-sm font-medium">Vehicle</Label>
              <Select value={selectedVehicleId} onValueChange={onVehicleChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Options */}
            <div>
              <Label className="text-sm font-medium">Export Options</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-xs">Format</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value: 'csv' | 'excel') => 
                      setExportOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel" disabled>Excel (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      type="date"
                      placeholder="Start date"
                      value={exportOptions.dateRange.start}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                    />
                    <Input
                      type="date"
                      placeholder="End date"
                      value={exportOptions.dateRange.end}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSummary"
                      checked={exportOptions.includeSummary}
                      onChange={(e) => 
                        setExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))
                      }
                    />
                    <Label htmlFor="includeSummary" className="text-xs">
                      Include summary statistics
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => 
                        setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))
                      }
                    />
                    <Label htmlFor="includeCharts" className="text-xs">
                      Include charts (Excel only)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Columns to Export</Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllColumns}
                    className="text-xs h-6"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllColumns}
                    className="text-xs h-6"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {exportType.columns[0] === 'All data from above categories' ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Combined report includes all columns:</p>
                  {Object.entries(EXPORT_TYPES)
                    .filter(([key]) => key !== 'combined_report')
                    .map(([key, type]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${type.color}`}></div>
                          <span className="text-sm font-medium">{type.name}</span>
                        </div>
                        <div className="ml-5 space-y-1">
                          {type.columns.map((column) => (
                            <div key={column} className="flex items-center space-x-2">
                              <Checkbox
                                id={column}
                                checked={exportOptions.selectedColumns.includes(column)}
                                onChange={() => handleColumnToggle(column)}
                              />
                              <Label htmlFor={column} className="text-xs">
                                {column}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {exportType.columns.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={column}
                        checked={exportOptions.selectedColumns.includes(column)}
                        onChange={() => handleColumnToggle(column)}
                      />
                      <Label htmlFor={column} className="text-sm">
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Export Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Type:</span>
                  <Badge variant="outline">{exportType.name}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Format:</span>
                  <Badge variant="outline">{exportOptions.format.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Columns:</span>
                  <span>{exportOptions.selectedColumns.length} selected</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date Range:</span>
                  <span className="text-xs">
                    {exportOptions.dateRange.start || 'All'} - {exportOptions.dateRange.end || 'All'}
                  </span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  {exportOptions.selectedColumns.length === 0 ? (
                    <span className="text-destructive">Please select at least one column</span>
                  ) : (
                    <span>Ready to export {exportOptions.selectedColumns.length} columns</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export History */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Recent Exports</Label>
              <div className="space-y-2 mt-2">
                {exportHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No export history yet</p>
                  </div>
                ) : (
                  exportHistory.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.status === 'completed' && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            {item.status === 'failed' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            {item.status === 'processing' && (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm font-medium truncate">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.filename}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {item.size}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={isExporting || !selectedVehicleId || exportOptions.selectedColumns.length === 0}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportType.name}
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              <p>Exports are processed immediately and downloaded to your device.</p>
              <p>Large datasets may take longer to process.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}