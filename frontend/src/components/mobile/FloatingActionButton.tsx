import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick: () => void
  label: string
  color?: 'blue' | 'green' | 'red'
  className?: string
}

export function FloatingActionButton({ 
  icon, 
  onClick, 
  label, 
  color = 'blue',
  className 
}: FloatingActionButtonProps) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700'
  }

  return (
    <Button
      onClick={onClick}
      className={cn(
        `
          h-14 w-14 rounded-full shadow-lg transition-all hover:shadow-xl
          ${colorClasses[color]}
          md:hidden
        `,
        className
      )}
      size="icon"
      title={label}
    >
      {icon}
    </Button>
  )
}

export default FloatingActionButton