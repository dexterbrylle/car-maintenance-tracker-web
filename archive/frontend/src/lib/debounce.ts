export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Cache size limiter to prevent memory leaks
export function createSizeLimitedCache<T>(maxSize: number = 100) {
  const cache = new Map<string, T>()
  const keys: string[] = []

  return {
    get(key: string): T | undefined {
      return cache.get(key)
    },
    set(key: string, value: T): void {
      if (cache.has(key)) {
        // Move key to end (LRU)
        const index = keys.indexOf(key)
        keys.splice(index, 1)
        keys.push(key)
      } else {
        // Add new key
        cache.set(key, value)
        keys.push(key)
        
        // Remove oldest if over limit
        if (keys.length > maxSize) {
          const oldestKey = keys.shift()!
          cache.delete(oldestKey)
        }
      }
    },
    clear(): void {
      cache.clear()
      keys.length = 0
    },
    size(): number {
      return cache.size
    }
  }
}