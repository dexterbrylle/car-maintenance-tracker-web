import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExportUtility } from "./ExportUtility"
import { ExportHistory } from "./ExportHistory"
import { ExportButton } from "./ExportButton"
import { Vehicle } from "@/types"
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Calendar, 
  History,
  Settings,
  BarChart3,
  Filter,
  RefreshCw,
  Zap
} from "lucide-react"

interface ExportManagerProps {
  vehicles: Vehicle[]
  selectedVehicleId: string
  onVehicleChange: (id: string) => void
}

export function ExportManager({ vehicles, selectedVehicleId, onVehicleChange }: ExportManagerProps) {
  const [activeTab, setActiveTab] = useState("export")

  const exportStats = {
    totalExports: 42,
    successfulExports: 38,
    failedExports: 4,
    totalSize: "2.4 MB",
    lastExport: "2024-01-09T10:30:00Z"
  }

  const quickExportOptions = [
    {
      type: "service_history" as const,
      title: "Service History",
      description: "Export all maintenance service records",
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      type: "fuel_history" as const,
      title: "Fuel History", 
      description: "Export fuel consumption and cost data",
      icon: Database,
      color: "bg-green-500"
    },
    {
      type: "combined_report" as const,
      title: "Complete Report",
      description: "Export comprehensive vehicle report",
      icon: FileSpreadsheet,
      color: "bg-purple-500"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Manager</h2>
          <p className="text-muted-foreground">
            Export and manage your vehicle data in various formats
          </p>
        </div>
        <ExportUtility
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleChange={onVehicleChange}
        >
          <Button size="lg">
            <Download className="w-4 h-4 mr-2" />
            New Export
          </Button>
        </ExportUtility>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Exports</p>
                <p className="text-2xl font-bold">{exportStats.totalExports}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{exportStats.successfulExports}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{exportStats.failedExports}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{exportStats.totalSize}</p>
              </div>
              <Database className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Exports
          </CardTitle>
          <CardDescription>
            One-click exports for common data types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickExportOptions.map((option) => {
              const Icon = option.icon
              return (
                <Card key={option.type} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${option.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{option.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                        <ExportUtility
                          vehicles={vehicles}
                          selectedVehicleId={selectedVehicleId}
                          onVehicleChange={onVehicleChange}
                        >
                          <Button size="sm" className="mt-3">
                            Export Now
                          </Button>
                        </ExportUtility>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Create Export
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Export History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <ExportUtility
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleChange={onVehicleChange}
          >
            <Button className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Open Export Wizard
            </Button>
          </ExportUtility>
        </TabsContent>

        <TabsContent value="history">
          <ExportHistory vehicles={vehicles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}