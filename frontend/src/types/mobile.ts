import * as React from "react"

export interface MobileNavigationProps {
  className?: string
}

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export interface FloatingActionButtonProps {
  className?: string
  onLogService?: () => void
  onUpdateMileage?: () => void
  onScheduleService?: () => void
}

export interface ActionItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  color?: string
}