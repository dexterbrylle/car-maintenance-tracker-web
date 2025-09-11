import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, useFeatureAccess, useAuth } from './components/auth/ProtectedRoute'

// Lazy load components for better performance
const LazyVehicles = React.lazy(() => import('./pages/Vehicles').then(module => ({ default: module.Vehicles })))
const LazyServiceHistory = React.lazy(() => import('./pages/ServiceHistory').then(module => ({ default: module.ServiceHistory })))
const LazyServiceSchedulerPage = React.lazy(() => import('./pages/ServiceScheduler').then(module => ({ default: module.ServiceSchedulerPage })))
const LazyFuelHistory = React.lazy(() => import('./pages/FuelHistory').then(module => ({ default: module.FuelHistory })))
const LazyExportsPage = React.lazy(() => import('./pages/ExportsPage').then(module => ({ default: module.ExportsPage })))
const LazySettings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))

// Authentication pages (lazy loaded)
const LazyLogin = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const LazyRegister = React.lazy(() => import('./pages/Register').then(module => ({ default: module.Register })))
const LazyForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })))
const LazyResetPassword = React.lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })))

// Loading component for lazy-loaded routes
function RouteLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-muted-foreground">Loading page...</span>
      </div>
    </div>
  )
}

// Public route component (accessible without authentication)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}
import { Button } from './components/ui/button'
import { ToastProvider, ToastContainer } from './components/ui/toast'
import { Car, Settings as SettingsIcon, History, Calendar, Download, Fuel } from 'lucide-react'
import { MobileNavigation } from './components/mobile/MobileNavigation'

function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()
  
  return (
    <nav className="border-b bg-background hidden lg:block">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Car className="w-6 h-6" />
            <span className="font-semibold text-lg">Maintenance Tracker</span>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                asChild
              >
                <a href="/" className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Dashboard
                </a>
              </Button>
              <Button
                variant="ghost"
                asChild
              >
                <a href="/services" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Service History
                </a>
              </Button>
              <Button
                variant="ghost"
                asChild
              >
                <a href="/scheduler" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </a>
              </Button>
              <Button
                variant="ghost"
                asChild
              >
                <a href="/fuel" className="flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  Fuel History
                </a>
              </Button>
              <Button
                variant="ghost"
                asChild
              >
                <a href="/exports" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exports
                </a>
              </Button>
              <Button
                variant="ghost"
                asChild
              >
                <a href="/settings" className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </a>
              </Button>
              
              {/* User Account Section */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                      {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                    </div>
                    <span className="text-sm">
                      {user?.first_name || user?.email}
                    </span>
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                asChild
              >
                <a href="/login">Login</a>
              </Button>
              <Button
                asChild
              >
                <a href="/register">Sign Up</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="pb-20 md:pb-0">
              <Routes>
                {/* Public Routes (Authentication) */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyLogin />
                    </Suspense>
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyRegister />
                    </Suspense>
                  </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                  <PublicRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyForgotPassword />
                    </Suspense>
                  </PublicRoute>
                } />
                <Route path="/reset-password/:token" element={
                  <PublicRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyResetPassword />
                    </Suspense>
                  </PublicRoute>
                } />
                
                {/* Protected Routes (require authentication) */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/vehicles" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyVehicles />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/services" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyServiceHistory />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/fuel" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyFuelHistory />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/scheduler" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyServiceSchedulerPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/exports" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazyExportsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <LazySettings />
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Subscription and Account Management */}
                <Route path="/upgrade" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <div className="min-h-screen flex items-center justify-center">
                        <h1 className="text-2xl font-bold">Upgrade Page - Coming Soon</h1>
                      </div>
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <Suspense fallback={<RouteLoading />}>
                      <div className="min-h-screen flex items-center justify-center">
                        <h1 className="text-2xl font-bold">Account Management - Coming Soon</h1>
                      </div>
                    </Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <ToastContainer />

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
