
// Cache keys
export const CACHE_KEYS = {
  VEHICLES: 'vehicles',
  MAINTENANCE_ITEMS: (vehicleId: string) => `maintenance_items_${vehicleId}`,
  SERVICE_RECORDS: (vehicleId: string) => `service_records_${vehicleId}`,
  DASHBOARD_DATA: (vehicleId: string) => `dashboard_data_${vehicleId}`,
  FUEL_RECORDS: (vehicleId: string) => `fuel_records_${vehicleId}`,
  FUEL_METRICS: (vehicleId: string) => `fuel_metrics_${vehicleId}`,
} as const

// Cache expiration times (in milliseconds)
export const CACHE_EXPIRY = {
  VEHICLES: 5 * 60 * 1000, // 5 minutes
  MAINTENANCE_ITEMS: 10 * 60 * 1000, // 10 minutes
  SERVICE_RECORDS: 2 * 60 * 1000, // 2 minutes
  DASHBOARD_DATA: 1 * 60 * 1000, // 1 minute
  FUEL_RECORDS: 2 * 60 * 1000, // 2 minutes
  FUEL_METRICS: 5 * 60 * 1000, // 5 minutes
} as const

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

class CacheManager {
  private storage: Storage

  constructor() {
    this.storage = typeof window !== 'undefined' ? localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    } as Storage
  }

  private getCacheEntry<T>(key: string): CacheEntry<T> | null {
    try {
      const item = this.storage.getItem(key)
      if (!item) return null

      const entry: CacheEntry<T> = JSON.parse(item)
      
      // Check if cache is expired
      if (Date.now() - entry.timestamp > entry.expiry) {
        this.storage.removeItem(key)
        return null
      }

      return entry
    } catch {
      return null
    }
  }

  get<T>(key: string): T | null {
    const entry = this.getCacheEntry<T>(key)
    return entry ? entry.data : null
  }

  set<T>(key: string, data: T, expiry: number): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry,
      }
      this.storage.setItem(key, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to cache data:', error)
    }
  }

  invalidate(key: string): void {
    this.storage.removeItem(key)
  }

  invalidatePattern(pattern: string): void {
    Object.keys(this.storage).forEach(key => {
      if (key.includes(pattern)) {
        this.storage.removeItem(key)
      }
    })
  }

  clear(): void {
    this.storage.clear()
  }
}

export const cacheManager = new CacheManager()

// Memory cache for frequently accessed data
const memoryCache = new Map<string, { data: any; timestamp: number; expiry: number }>()

export function getMemoryCache<T>(key: string, expiry: number = CACHE_EXPIRY.DASHBOARD_DATA): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  
  if (Date.now() - entry.timestamp > expiry) {
    memoryCache.delete(key)
    return null
  }
  
  return entry.data as T
}

export function setMemoryCache<T>(key: string, data: T, expiry: number = CACHE_EXPIRY.DASHBOARD_DATA): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    expiry,
  })
}

// API response wrapper with caching
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expiry: number = CACHE_EXPIRY.DASHBOARD_DATA,
  useMemoryCache: boolean = false
): Promise<T> {
  // Try memory cache first
  if (useMemoryCache) {
    const memoryData = getMemoryCache<T>(key, expiry)
    if (memoryData) {
      return memoryData
    }
  }

  // Try localStorage cache
  const cachedData = cacheManager.get<T>(key)
  if (cachedData) {
    // Also update memory cache
    if (useMemoryCache) {
      setMemoryCache(key, cachedData, expiry)
    }
    return cachedData
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Cache the data
  cacheManager.set(key, data, expiry)
  if (useMemoryCache) {
    setMemoryCache(key, data, expiry)
  }
  
  return data
}

// Cache invalidation helpers
export function invalidateVehicleCache(vehicleId: string): void {
  cacheManager.invalidate(CACHE_KEYS.MAINTENANCE_ITEMS(vehicleId))
  cacheManager.invalidate(CACHE_KEYS.SERVICE_RECORDS(vehicleId))
  cacheManager.invalidate(CACHE_KEYS.DASHBOARD_DATA(vehicleId))
  cacheManager.invalidate(CACHE_KEYS.FUEL_RECORDS(vehicleId))
  cacheManager.invalidate(CACHE_KEYS.FUEL_METRICS(vehicleId))
  
  // Clear memory cache for this vehicle
  memoryCache.forEach((_, key) => {
    if (key.includes(vehicleId)) {
      memoryCache.delete(key)
    }
  })
}

export function invalidateAllCache(): void {
  cacheManager.clear()
  memoryCache.clear()
}