import React, { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick: () => void
  label: string
  color?: 'blue' | 'green' | 'red' | 'slate'
  className?: string
}

export function FloatingActionButton({ 
  icon, 
  onClick, 
  label, 
  color = 'slate',
  className 
}: FloatingActionButtonProps) {
  const colorClasses = {
    slate: 'bg-slate-900 hover:bg-slate-800',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        `
          flex h-14 w-14 items-center justify-center rounded-full shadow-lg 
          transition-all duration-200 hover:shadow-xl touch-target
          ${colorClasses[color]}
          text-white
          md:hidden
        `,
        className
      )}
      title={label}
    >
      {icon}
    </button>
  )
}

interface MultiFloatingActionButtonProps {
  actions: Array<{
    icon: React.ReactNode
    label: string
    onClick: () => void
    color?: 'blue' | 'green' | 'red' | 'slate'
  }>
  mainIcon?: React.ComponentType<{ className?: string }>
  mainLabel?: string
  mainColor?: 'slate' | 'blue' | 'green' | 'red'
}

export function MultiFloatingActionButton({ 
  actions, 
  mainIcon = Plus,
  mainLabel = "Actions",
  mainColor = 'slate'
}: MultiFloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const IconComponent = mainIcon

  return (
    <div className="fixed bottom-20 right-6 z-40 lg:hidden">
      {/* Action Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg animate-slide-in-up">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick()
                setIsOpen(false)
              }}
              className="flex w-full items-center space-x-3 rounded-lg p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors touch-target"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Button */}
      <FloatingActionButton
        icon={<IconComponent className="h-5 w-5" />}
        onClick={() => setIsOpen(!isOpen)}
        label={mainLabel}
        color={mainColor}
        className={isOpen ? 'rotate-45' : ''}
      />
    </div>
  )
}

export default FloatingActionButton