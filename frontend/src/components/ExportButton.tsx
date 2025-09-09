import React from "react"
import { Button } from "@/components/ui/button"
import { ExportUtility } from "./ExportUtility"
import { Download } from "lucide-react"
import { Vehicle } from "@/types"

interface ExportButtonProps {
  vehicles: Vehicle[]
  selectedVehicleId: string
  onVehicleChange: (id: string) => void
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export function ExportButton({ 
  vehicles, 
  selectedVehicleId, 
  onVehicleChange,
  variant = "outline",
  size = "default",
  className = "",
  children
}: ExportButtonProps) {
  return (
    <ExportUtility
      vehicles={vehicles}
      selectedVehicleId={selectedVehicleId}
      onVehicleChange={onVehicleChange}
    >
      <Button variant={variant} size={size} className={className}>
        {children || (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export
          </>
        )}
      </Button>
    </ExportUtility>
  )
}