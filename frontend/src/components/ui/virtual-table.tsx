import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualTableProps<T> {
  data: T[]
  columns: {
    key: keyof T
    header: string
    render?: (value: any, row: T) => React.ReactNode
    className?: string
  }[]
  rowHeight?: number
  containerHeight?: number
  loading?: boolean
  onRowClick?: (row: T) => void
  className?: string
  emptyMessage?: string
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 400,
  loading = false,
  onRowClick,
  className,
  emptyMessage = 'No data available'
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Calculate visible range
  const startIndex = Math.floor(scrollTop / rowHeight)
  const endIndex = Math.min(
    data.length,
    Math.ceil((scrollTop + containerHeight) / rowHeight)
  )
  
  // Calculate total height and padding
  const totalHeight = data.length * rowHeight
  const paddingTop = startIndex * rowHeight
  const paddingBottom = (data.length - endIndex) * rowHeight
  
  // Handle scroll event with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  // Handle row click
  const handleRowClick = useCallback((row: T) => {
    onRowClick?.(row)
  }, [onRowClick])
  
  // Render cell content
  const renderCell = useCallback((column: typeof columns[0], row: T) => {
    if (column.render) {
      return column.render(row[column.key], row)
    }
    return String(row[column.key] ?? '')
  }, [])
  
  if (loading) {
    return (
      <div className={cn('border rounded-lg overflow-hidden', className)}>
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex gap-4">
              {columns.map((_, j) => (
                <div key={j} className="flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className={cn('border rounded-lg p-8 text-center', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }
  
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-muted border-b">
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={column.key as string}
              className={cn(
                'px-4 py-3 text-sm font-medium text-left',
                column.className
              )}
              style={{ flex: index === 0 ? 2 : 1 }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>
      
      {/* Virtualized body */}
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight }}>
          {/* Padding top */}
          <div style={{ height: paddingTop }} />
          
          {/* Visible rows */}
          {data.slice(startIndex, endIndex).map((row, index) => (
            <div
              key={index}
              className={cn(
                'flex border-b hover:bg-muted/50 cursor-pointer transition-colors',
                index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              )}
              style={{ height: rowHeight }}
              onClick={() => handleRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <div
                  key={column.key as string}
                  className={cn(
                    'px-4 py-3 text-sm',
                    column.className
                  )}
                  style={{ 
                    flex: colIndex === 0 ? 2 : 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {renderCell(column, row)}
                </div>
              ))}
            </div>
          ))}
          
          {/* Padding bottom */}
          <div style={{ height: paddingBottom }} />
        </div>
      </div>
    </div>
  )
}

// Virtualized list component for simpler use cases
interface VirtualListProps<T> {
  data: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight?: number
  containerHeight?: number
  loading?: boolean
  className?: string
  emptyMessage?: string
}

export function VirtualList<T>({
  data,
  renderItem,
  itemHeight = 60,
  containerHeight = 400,
  loading = false,
  className,
  emptyMessage = 'No items to display'
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    data.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  )
  
  const totalHeight = data.length * itemHeight
  const paddingTop = startIndex * itemHeight
  const paddingBottom = (data.length - endIndex) * itemHeight
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className={cn('text-center p-8', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }
  
  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight }}>
        <div style={{ height: paddingTop }} />
        {data.slice(startIndex, endIndex).map((item, index) => (
          <div key={index} style={{ height: itemHeight }}>
            {renderItem(item, startIndex + index)}
          </div>
        ))}
        <div style={{ height: paddingBottom }} />
      </div>
    </div>
  )
}