## Prompt 5: React Components Implementation

**Objective**: Create high-performance React components for the Car Maintenance Tracker MVP with mobile-first design, Philippines-specific features, and production-ready performance optimizations.

**Context**: You need to implement the core UI components for vehicle management, fuel tracking, maintenance scheduling, and dashboard analytics with responsive design and performance best practices. The application should be optimized for real-world usage patterns in the Philippines market.

**Performance Requirements**:
- Implement React.memo for frequently re-rendering components
- Use useMemo for expensive calculations in Dashboard
- Add useCallback for event handlers with proper dependency arrays
- Optimize React Query with select options and cache management
- Include performance profiling guidance
- Balance optimization with avoiding premature optimization

**Requirements**:
- Create authentication components with useCallback optimizations
- Create layout and navigation components
- Create dashboard components with memoized calculations
- Create vehicle management components
- Create fuel tracking components
- Create maintenance components with virtual scrolling
- Create mobile-responsive layouts
- Include Philippines-specific features
- Implement performance monitoring and profiling

**Performance Implementation Priority**:
1. **Immediate**: StatsCard.memo, Dashboard useMemo, Query select options
2. **Medium**: Auth form useCallback, virtual scrolling, image optimization
3. **Avoid**: Over-memoization, premature optimization without profiling

**Implementation Steps**:

1. **Create Authentication Components**:

**src/pages/Login.tsx**:
```typescript
import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { Car, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Memoize submit handler to prevent unnecessary re-renders
  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      await signIn(data.email, data.password)
      navigate('/dashboard')
    } catch (error) {
      // Use proper error handling instead of console.error in production
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [signIn, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to FuelWise
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Track your vehicle's fuel economy and maintenance
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
```

**src/pages/Register.tsx**:
```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { Car, Eye, EyeOff } from 'lucide-react'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const Register: React.FC = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Memoize submit handler to prevent unnecessary re-renders
  const onSubmit = useCallback(async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      await signUp(data.email, data.password, data.fullName)
      navigate('/login')
    } catch (error) {
      // Use proper error handling instead of console.error in production
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [signUp, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start tracking your vehicle's performance
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="label">
                Full Name
              </label>
              <input
                {...register('fullName')}
                type="text"
                className="input"
                placeholder="Juan Dela Cruz"
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
```

2. **Create Layout Component**:

**src/components/Layout.tsx**:
```typescript
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { vehiclesApi } from '../lib/api'
import {
  Car,
  Fuel,
  Wrench,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  Home,
  Plus,
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch vehicles for sidebar
  const { data: vehiclesResponse } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getAll(),
    enabled: !!user,
  })

  const vehicles = vehiclesResponse?.data?.data || []

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Vehicles', href: '/vehicles', icon: Car },
    { name: 'Fuel History', href: '/fuel', icon: Fuel },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">FuelWise</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r">
        <div className="flex h-16 items-center px-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">FuelWise</h1>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Quick vehicle access */}
        {vehicles.length > 0 && (
          <div className="px-2 py-4 border-t">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Access
            </h3>
            <div className="mt-2 space-y-1">
              {vehicles.slice(0, 3).map((vehicle) => (
                <Link
                  key={vehicle.id}
                  to={`/vehicles/${vehicle.id}`}
                  className="group flex items-center px-2 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                >
                  <Car className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{vehicle.year} {vehicle.make}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <h2 className="text-lg font-medium text-gray-900">
                  {navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <Link
                  to="/vehicles"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Vehicle</span>
                </Link>

                <div className="relative">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {userInitials}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.user_metadata?.full_name || 'User'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-gray-600"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
```

3. **Create Dashboard Component**:

**src/pages/Dashboard.tsx**:
```typescript
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { vehiclesApi } from '../lib/api'
import {
  Car,
  Fuel,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Plus,
  ChevronRight,
} from 'lucide-react'

const Dashboard: React.FC = () => {
  // Fetch dashboard summary with optimized query
  const { data: summaryResponse, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => vehiclesApi.dashboardSummary(),
    select: (response) => response?.data?.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const summary = summaryResponse

  // Memoize expensive calculations
  const { formattedCurrency, formattedDistance } = useMemo(() => {
    // Format currency - Philippines Peso
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(amount)
    }

    // Format distance - kilometers
    const formatDistance = (distance: number) => {
      return `${distance.toLocaleString()} km`
    }

    // Calculate derived stats
    const totalMaintenanceItems = (summary?.maintenance_due_now || 0) +
                                  (summary?.maintenance_due_soon || 0) +
                                  (summary?.maintenance_ok || 0)

    const monthlyFuelCost = summary?.monthly_fuel_cost?.reduce((sum, month) => sum + month.total_cost, 0) || 0

    return {
      formatCurrency,
      formatDistance,
      totalMaintenanceItems,
      monthlyFuelCost,
    }
  }, [summary])

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/vehicles" className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Vehicle</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Car className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary?.total_vehicles || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Distance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formattedDistance(summary?.total_distance || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Fuel className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Fuel Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formattedCurrency(summary?.total_fuel_cost || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wrench className="h-8 w-8 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue Maintenance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary?.overdue_maintenance_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fuel Economy Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Fuel Economy</h3>
          </div>
          <div className="card-content">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {summary?.average_fuel_economy?.toFixed(1) || '0.0'} km/L
              </div>
              <p className="text-sm text-gray-500">Average Fuel Economy</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(summary?.total_fuel_cost || 0)}
                </div>
                <div className="text-sm text-gray-500">Total Fuel Cost</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {(summary?.total_fuel_amount || 0).toFixed(1)} L
                </div>
                <div className="text-sm text-gray-500">Total Fuel</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Maintenance Costs</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Maintenance</span>
                <span className="font-semibold">
                  {formatCurrency(summary?.total_maintenance_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Overdue Items</span>
                <span className="font-semibold text-error-600">
                  {summary?.overdue_maintenance_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/vehicles"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <Car className="h-5 w-5 text-primary-600" />
                <span className="font-medium">Manage Vehicles</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            <Link
              to="/fuel"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <Fuel className="h-5 w-5 text-primary-600" />
                <span className="font-medium">Add Fill-up</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>

            <Link
              to="/maintenance"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <Wrench className="h-5 w-5 text-primary-600" />
                <span className="font-medium">Log Service</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Philippines-specific tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Philippines Driving Tips</h4>
            <p className="text-sm text-blue-700 mt-1">
              Remember that maintenance intervals in the Philippines are typically 20% more frequent due to severe driving conditions.
              Regular maintenance helps prevent costly repairs in hot, humid weather and heavy traffic conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
```

4. **Create Performance-Optimized StatsCard Component**:

**src/components/StatsCard.tsx**:
```typescript
import React, { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

// Custom comparison function for memoization
const arePropsEqual = (prevProps: StatsCardProps, nextProps: StatsCardProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.trend === nextProps.trend &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.className === nextProps.className &&
    React.isValidElement(prevProps.icon) === React.isValidElement(nextProps.icon)
  )
}

export const StatsCard = memo(({ title, value, subtitle, trend, icon, onClick, className }: StatsCardProps) => {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md",
        onClick ? 'hover:bg-gray-50' : '',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center text-xs",
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' : 'text-gray-500'
            )}>
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
              {trend === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}, arePropsEqual)
```

5. **Create Virtualized Service List Component**:

**src/components/VirtualizedServiceList.tsx**:
```typescript
import { FixedSizeList as List } from 'react-window'
import { ServiceRecord } from '@/types'
import { format } from 'date-fns'
import { Wrench } from 'lucide-react'

interface VirtualizedServiceListProps {
  services: ServiceRecord[]
  height?: number
}

const ServiceItem: React.FC<{ index: number; style: React.CSSProperties; data: ServiceRecord[] }> = ({
  index,
  style,
  data
}) => {
  const service = data[index]

  return (
    <div style={style} className="border-b border-gray-200 px-4 py-3 hover:bg-gray-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {service.description}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(service.date), 'MMM dd, yyyy')} • {service.mileage.toLocaleString()} km
          </p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            ₱{service.cost.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export const VirtualizedServiceList: React.FC<VirtualizedServiceListProps> = ({
  services,
  height = 400
}) => {
  return (
    <div className="border border-gray-200 rounded-lg">
      <List
        height={height}
        itemCount={services.length}
        itemSize={80}
        width="100%"
        itemData={services}
      >
        {ServiceItem}
      </List>
    </div>
  )
}
```

6. **Create Loading Spinner Component**:

**src/components/LoadingSpinner.tsx**:
```typescript
const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}

export default LoadingSpinner
```

**Performance Optimization Guidelines**:

### 1. **When to Use Memoization**
- **useMemo**: For expensive calculations that don't change on every render
  - Dashboard summary calculations (service counts, fuel stats)
  - Complex data transformations
  - Derived state computations
- **useCallback**: For event handlers passed to memoized components
  - Form submit handlers
  - Click handlers in lists
  - Callbacks for useEffect dependencies
- **React.memo**: For components that re-render frequently with same props
  - StatsCard components in dashboard
  - List items in virtualized lists
  - Components with expensive render logic

### 2. **Query Optimization Best Practices**
```typescript
// Optimize React Query with proper caching
const { data } = useQuery({
  queryKey: ['vehicles', userId],
  queryFn: () => vehiclesApi.getAll(),
  select: (response) => response?.data?.data, // Transform data
  staleTime: 5 * 60 * 1000, // 5 minutes cache
  gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  enabled: !!userId, // Only fetch when user exists
})
```

### 3. **Performance Profiling Setup**
```typescript
// Add to main.tsx for development
if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
  })
}
```

### 4. **Bundle Optimization**
```typescript
// Dynamic imports for heavy components
const HeavyChart = React.lazy(() => import('./HeavyChart'))
const MaintenanceInsights = React.lazy(() => import('./MaintenanceInsights'))
```

### 5. **Performance Monitoring**
```typescript
// Add to App.tsx
import { Profiler } from 'react'

const onRenderCallback = (
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  if (actualDuration > 100) { // Log slow renders
    console.log(`${id} ${phase} took ${actualDuration}ms`)
  }
}

// Wrap slow components
<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>
```

### 6. **Virtual Scrolling Implementation**
- Use for lists with 50+ items (service history, fill-ups)
- Fixed item sizes for best performance
- Implement windowing with react-window or react-virtualized
- Consider infinite scrolling for paginated data

### 7. **Performance Pitfalls to Avoid**
- **Don't memoize everything**: Only memoize when you can measure a performance benefit
- **Avoid excessive state in single components**: Split large components into smaller, focused ones
- **Be careful with useEffect dependencies**: Use useCallback for functions in dependency arrays
- **Don't create objects/arrays in render**: Use useMemo for stable references
- **Avoid inline functions in JSX**: Especially in mapped lists
- **Don't over-optimize without profiling**: Measure first, then optimize

### 8. **Philippines-Specific Performance Considerations**
- Optimize for slower network conditions (3G/4G)
- Use progressive loading for images
- Implement offline support with service workers
- Consider lower-end mobile devices for testing
- Optimize font loading for better perceived performance

**Expected Output**: Complete React components for authentication, layout, dashboard, and navigation with mobile-first design, Philippines-specific features, and production-ready performance optimizations.

**Validation Steps**:
1. Test authentication flow (login/register)
2. Verify dashboard loads with statistics
3. Check mobile responsiveness
4. Test navigation between pages
5. Verify Philippines-specific features are displayed
6. **Performance Testing**:
   - Use React DevTools Profiler to identify slow components
   - Test with 100+ service records to verify virtual scrolling
   - Monitor re-renders when adding new data
   - Verify cache behavior with React Query DevTools
7. **Load Testing**:
   - Measure initial bundle size (< 500KB)
   - Check time to interactive (< 3 seconds)
   - Test with slow network conditions
   - Verify smooth scrolling on mobile devices