import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { Download, Search, Trash2, RefreshCw, FileText, FileSpreadsheet, Database, Calendar } from "lucide-react"

interface ExportHistoryItem {
  id: string
  type: string
  filename: string
  date: string
  size: string
  status: 'completed' | 'failed' | 'processing'
  vehicleName: string
  format: 'csv' | 'excel'
  downloadUrl?: string
}


export function ExportHistory() {
  const { addToast } = useToast()
  const [history, setHistory] = useState<ExportHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Mock data for demonstration - in a real app, this would come from an API
  useEffect(() => {
    const mockHistory: ExportHistoryItem[] = [
      {
        id: "1",
        type: "Service History",
        filename: "service-history-2020-mazda-cx5-20240109.csv",
        date: "2024-01-09T10:30:00Z",
        size: "45.2 KB",
        status: "completed",
        vehicleName: "2020 Mazda CX-5",
        format: "csv",
        downloadUrl: "#"
      },
      {
        id: "2",
        type: "Fuel History",
        filename: "fuel-history-2020-mazda-cx5-20240108.csv",
        date: "2024-01-08T15:45:00Z",
        size: "23.1 KB",
        status: "completed",
        vehicleName: "2020 Mazda CX-5",
        format: "csv",
        downloadUrl: "#"
      },
      {
        id: "3",
        type: "Combined Report",
        filename: "combined-report-2020-mazda-cx5-20240107.csv",
        date: "2024-01-07T09:15:00Z",
        size: "156.7 KB",
        status: "completed",
        vehicleName: "2020 Mazda CX-5",
        format: "csv",
        downloadUrl: "#"
      },
      {
        id: "4",
        type: "Maintenance Schedule",
        filename: "maintenance-schedule-2020-mazda-cx5-20240106.csv",
        date: "2024-01-06T14:20:00Z",
        size: "12.8 KB",
        status: "failed",
        vehicleName: "2020 Mazda CX-5",
        format: "csv"
      }
    ]
    
    setHistory(mockHistory)
    setLoading(false)
  }, [])

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === "all" || item.type.toLowerCase() === filterType.toLowerCase()
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case "date":
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case "type":
        aValue = a.type
        bValue = b.type
        break
      case "size":
        aValue = parseFloat(a.size)
        bValue = parseFloat(b.size)
        break
      case "vehicle":
        aValue = a.vehicleName
        bValue = b.vehicleName
        break
      default:
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
    }
    
    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleDownload = (item: ExportHistoryItem) => {
    if (item.downloadUrl) {
      // In a real app, this would trigger an actual download
      addToast({
        variant: "success",
        title: "Download Started",
        description: `Downloading ${item.filename}`
      })
    } else {
      addToast({
        variant: "error",
        title: "Download Failed",
        description: "This file is no longer available for download"
      })
    }
  }

  const handleDelete = (itemId: string) => {
    setHistory(prev => prev.filter(item => item.id !== itemId))
    addToast({
      variant: "success",
      title: "Export Deleted",
      description: "Export history item removed successfully"
    })
  }

  const handleClearAll = () => {
    setHistory([])
    addToast({
      variant: "success",
      title: "History Cleared",
      description: "All export history has been cleared"
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>
      case "failed":
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>
      case "processing":
        return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500"></div>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "service history":
        return <FileText className="w-4 h-4" />
      case "fuel history":
        return <Database className="w-4 h-4" />
      case "combined report":
        return <FileSpreadsheet className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading export history...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Export History</h3>
          <p className="text-sm text-muted-foreground">View and manage your exported files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search exports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="service history">Service History</SelectItem>
                  <SelectItem value="fuel history">Fuel History</SelectItem>
                  <SelectItem value="maintenance schedule">Maintenance Schedule</SelectItem>
                  <SelectItem value="vehicle info">Vehicle Info</SelectItem>
                  <SelectItem value="combined report">Combined Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export List */}
      {sortedHistory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Export History</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "No exports match your current filters."
                : "Start exporting data to see your export history here."}
            </p>
            {(searchTerm || filterType !== "all" || filterStatus !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterType("all")
                  setFilterStatus("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Export History ({sortedHistory.length})</span>
              <Badge variant="outline">{sortedHistory.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="font-medium">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.filename}
                    </TableCell>
                    <TableCell>{item.vehicleName}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge 
                          variant={item.status === "completed" ? "default" : 
                                   item.status === "failed" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}