import { JSX } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
  animate?: boolean
}

export function Skeleton({ className, lines = 1, animate = true }: SkeletonProps) {
  const skeletonLines = Array.from({ length: lines }, (_, i) => (
    <div
      key={i}
      className={cn(
        'bg-muted rounded-md',
        animate && 'animate-pulse',
        className
      )}
      style={{ 
        height: '1rem',
        marginBottom: lines > 1 && i < lines - 1 ? '0.5rem' : '0'
      }}
    />
  ))

  return <div>{skeletonLines}</div>
}

interface CardSkeletonProps {
  className?: string
  lines?: number
  children?: React.ReactNode
}

export function CardSkeleton({ className, lines = 3, children }: CardSkeletonProps) {
  return (
    <div className={cn('border rounded-lg p-6 space-y-4', className)}>
      <Skeleton className="h-6 w-1/3" />
      {children || <Skeleton lines={lines} />}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 font-semibold">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }, (_, j) => (
            <Skeleton key={j} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface StatsCardSkeletonProps {
  count?: number
}

export function StatsCardSkeleton({ count = 4 }: StatsCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  )
}


export function DashboardSkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <StatsCardSkeleton />
      <CardSkeleton lines={5} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} lines={3} />
        ))}
      </div>
    </div>
  )
}


export function FuelHistorySkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <CardSkeleton key={i} lines={2} />
        ))}
      </div>
      <CardSkeleton lines={3} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton lines={1} />
        <CardSkeleton lines={1} />
      </div>
      <CardSkeleton>
        <TableSkeleton rows={8} columns={9} />
      </CardSkeleton>
    </div>
  )
}


export function ServiceHistorySkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} lines={2} />
        ))}
      </div>
      <CardSkeleton>
        <TableSkeleton rows={8} columns={6} />
      </CardSkeleton>
    </div>
  )
}


export function VehicleSelectorSkeleton(): JSX.Element {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

interface ButtonSkeletonProps {
  className?: string
}

export function ButtonSkeleton({ className }: ButtonSkeletonProps) {
  return (
    <Skeleton className={cn('h-10 w-24', className)} />
  )
}

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('animate-spin rounded-full border-2 border-muted border-t-foreground', sizeClasses[size], className)} />
  )
}

// Loading overlay component
interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Page loading component
interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Loading page...' }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}