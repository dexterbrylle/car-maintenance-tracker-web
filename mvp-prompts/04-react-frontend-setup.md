## Prompt 4: React Frontend Setup with TypeScript

**Objective**: Create a React + TypeScript frontend project with Tailwind CSS and Supabase integration for the Car Maintenance Tracker MVP.

**Context**: You need to set up a modern, mobile-responsive frontend that integrates with the Django backend and Supabase for authentication.

**Requirements**:
- Create React project with TypeScript
- Install and configure Tailwind CSS
- Set up Supabase integration for auth
- Configure API integration with Django backend
- Set up routing and navigation
- Create project structure

**Implementation Steps**:

1. **Create React Project**:
```bash
# Navigate to project root
cd car-maintenance-tracker-mvp

# Create React project with TypeScript
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install dependencies
npm install axios react-router-dom @supabase/supabase-js react-hook-form @hookform/resolvers zod lucide-react date-fns
npm install -D tailwindcss postcss autoprefixer @types/node

# Initialize Tailwind CSS
npx tailwindcss init -p

# Install additional dev dependencies
npm install -D prettier prettier-plugin-tailwindcss eslint-plugin-tailwindcss
```

2. **Configure Tailwind CSS** (tailwind.config.js):
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f3f4f6',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

3. **Configure PostCSS** (postcss.config.js):
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

4. **Update CSS File** (src/index.css):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: Inter, system-ui, sans-serif;
  }

  body {
    @apply bg-gray-50 text-gray-900;
  }

  * {
    @apply border-border;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background;
  }

  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 h-10 py-2 px-4;
  }

  .btn-secondary {
    @apply btn bg-secondary-100 text-secondary-900 hover:bg-secondary-200 h-10 py-2 px-4;
  }

  .btn-outline {
    @apply btn border border-gray-300 bg-transparent hover:bg-gray-50 h-10 py-2 px-4;
  }

  .input {
    @apply flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }

  .label {
    @apply text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70;
  }

  .card {
    @apply rounded-lg border border-gray-200 bg-white text-card-foreground shadow-sm;
  }

  .card-header {
    @apply flex flex-col space-y-1.5 p-6;
  }

  .card-title {
    @apply text-2xl font-semibold leading-none tracking-tight;
  }

  .card-description {
    @apply text-sm text-gray-600;
  }

  .card-content {
    @apply p-6 pt-0;
  }

  .card-footer {
    @apply flex items-center p-6 pt-0;
  }

  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
  }

  .badge-success {
    @apply badge bg-success-100 text-success-800 hover:bg-success-200;
  }

  .badge-warning {
    @apply badge bg-warning-100 text-warning-800 hover:bg-warning-200;
  }

  .badge-error {
    @apply badge bg-error-100 text-error-800 hover:bg-error-200;
  }

  .badge-secondary {
    @apply badge bg-secondary-100 text-secondary-800 hover:bg-secondary-200;
  }
}

/* Mobile-first responsive design */
@media (max-width: 640px) {
  .card {
    @apply rounded-none border-x-0;
  }

  .btn {
    @apply text-base h-12;
  }

  .input {
    @apply text-base h-12;
  }
}
```

5. **Create Supabase Configuration** (src/lib/supabase.ts):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Types for Supabase auth
export interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  created_at: string
  updated_at: string
}

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}
```

6. **Create API Configuration** (src/lib/api.ts):
```typescript
import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    request_id: string
    version: string
  }
}

// Vehicle types
export interface Vehicle {
  id: number
  user: number
  make: string
  model: string
  year: number
  variant?: string
  license_plate?: string
  vin?: string
  color?: string
  initial_odometer: number
  current_odometer: number
  fuel_tank_capacity?: number
  vehicle_type: string
  transmission: string
  fuel_type: string
  is_active: boolean
  total_distance: number
  is_popular_philippines_model: boolean
  created_at: string
  updated_at: string
}

// Fill-up types
export interface FillUp {
  id: number
  vehicle: number
  date: string
  odometer_km: number
  liters: number
  price_per_liter: number
  total_cost: number
  fuel_type: string
  gas_station?: string
  location?: string
  payment_method: string
  notes?: string
  fuel_economy_km_l?: number
  cost_per_km?: number
  trip_distance_km?: number
  is_full_tank: boolean
  created_at: string
}

// Maintenance types
export interface MaintenanceSchedule {
  id: number
  vehicle_make: string
  vehicle_model: string
  category: string
  item_name: string
  interval_km: number
  adjusted_interval_km: number
  interval_months?: number
  action_type: string
  action_type_display: string
  description?: string
  is_critical: boolean
  difficulty_level: string
  estimated_cost_min?: number
  estimated_cost_max?: number
  year_start: number
  year_end: number
  philippines_adjustment_factor: number
  philippines_notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MaintenanceService {
  id: number
  vehicle: number
  schedule_item?: number
  service_date: string
  mileage_at_service: number
  service_type: string
  service_provider?: string
  provider_type: string
  total_cost: number
  labor_cost?: number
  parts_cost?: number
  notes?: string
  recommendation?: string
  is_warranty: boolean
  warranty_period?: string
  warranty_details?: string
  maintenance_items_completed: any[]
  created_at: string
  updated_at: string
}

// Dashboard types
export interface DashboardSummary {
  total_vehicles: number
  total_distance: number
  total_fuel_cost: number
  total_fuel_amount: number
  total_maintenance_cost: number
  overdue_maintenance_count: number
  average_fuel_economy: number
}

// API functions
export const vehiclesApi = {
  getAll: () => api.get<ApiResponse<Vehicle[]>>('/vehicles/'),
  create: (data: Partial<Vehicle>) => api.post<ApiResponse<Vehicle>>('/vehicles/', data),
  update: (id: number, data: Partial<Vehicle>) => api.put<ApiResponse<Vehicle>>(`/vehicles/${id}/`, data),
  delete: (id: number) => api.delete(`/vehicles/${id}/`),
  updateMileage: (id: number, mileage: number) =>
    api.post<ApiResponse<any>>(`/vehicles/${id}/update_mileage/`, { mileage }),
  getDetail: (id: number) => api.get<ApiResponse<Vehicle>>(`/vehicles/${id}/`),
  getFuelStatistics: (id: number) =>
    api.get<ApiResponse<any>>(`/vehicles/${id}/fuel_statistics/`),
  dashboardSummary: () =>
    api.get<ApiResponse<DashboardSummary>>('/vehicles/dashboard_summary/'),
}

export const fuelTrackingApi = {
  getFillUps: (vehicleId: number) =>
    api.get<ApiResponse<FillUp[]>>(`/fuel-tracking/vehicles/${vehicleId}/fillups/`),
  createFillUp: (vehicleId: number, data: Partial<FillUp>) =>
    api.post<ApiResponse<FillUp>>(`/fuel-tracking/vehicles/${vehicleId}/fillups/`, data),
  updateFillUp: (vehicleId: number, id: number, data: Partial<FillUp>) =>
    api.put<ApiResponse<FillUp>>(`/fuel-tracking/vehicles/${vehicleId}/fillups/${id}/`, data),
  deleteFillUp: (vehicleId: number, id: number) =>
    api.delete(`/fuel-tracking/vehicles/${vehicleId}/fillups/${id}/`),
  getStatistics: (vehicleId: number) =>
    api.get<ApiResponse<any>>(`/fuel-tracking/vehicles/${vehicleId}/fillups/statistics/`),
  getRecent: (vehicleId: number) =>
    api.get<ApiResponse<FillUp[]>>(`/fuel-tracking/vehicles/${vehicleId}/fillups/recent/`),
}

export const maintenanceApi = {
  getSchedules: (vehicleId: number) =>
    api.get<ApiResponse<MaintenanceSchedule[]>>(`/maintenance/vehicles/${vehicleId}/schedules/`),
  getServices: (vehicleId: number) =>
    api.get<ApiResponse<MaintenanceService[]>>(`/maintenance/vehicles/${vehicleId}/services/`),
  createService: (vehicleId: number, data: Partial<MaintenanceService>) =>
    api.post<ApiResponse<MaintenanceService>>(`/maintenance/vehicles/${vehicleId}/services/`, data),
  updateService: (vehicleId: number, id: number, data: Partial<MaintenanceService>) =>
    api.put<ApiResponse<MaintenanceService>>(`/maintenance/vehicles/${vehicleId}/services/${id}/`, data),
  deleteService: (vehicleId: number, id: number) =>
    api.delete(`/maintenance/vehicles/${vehicleId}/services/${id}/`),
  getUpcoming: (vehicleId: number) =>
    api.get<ApiResponse<any[]>>(`/maintenance/vehicles/${vehicleId}/services/upcoming/`),
}

export default api
```

7. **Create Environment Variables** (.env):
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend API Configuration
VITE_API_URL=http://localhost:8000/api
```

8. **Update React App Entry Point** (src/main.tsx):
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

9. **Create Authentication Context** (src/contexts/AuthContext.tsx):
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, getCurrentUser, getSession, supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const initializeAuth = async () => {
      try {
        const session = await getSession()
        if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { user } = await signIn(email, password)
      setUser(user)
      toast.success('Welcome back!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      await signUp(email, password, fullName)
      toast.success('Account created! Please check your email to verify.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      setUser(null)
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

10. **Create Basic App Component** (src/App.tsx):
```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import VehicleDetail from './pages/VehicleDetail'
import FuelHistory from './pages/FuelHistory'
import Maintenance from './pages/Maintenance'
import Login from './pages/Login'
import Register from './pages/Register'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="vehicles/:id" element={<VehicleDetail />} />
        <Route path="vehicles/:id/fuel" element={<FuelHistory />} />
        <Route path="vehicles/:id/maintenance" element={<Maintenance />} />
      </Route>
    </Routes>
  )
}

export default App
```

**Expected Output**: A fully configured React + TypeScript frontend with Tailwind CSS, Supabase integration, and proper project structure ready for implementing the car maintenance tracker components.

**Validation Steps**:
1. Run `npm run dev` - should start development server
2. Check browser at http://localhost:5173 - should load properly
3. Verify environment variables are correctly loaded
4. Test Supabase connection
5. Check API configuration