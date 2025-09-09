import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'

// Lazy load components for better performance
const LazyVehicles = React.lazy(() => import('./pages/Vehicles').then(module => ({ default: module.Vehicles })))
const LazyServiceHistory = React.lazy(() => import('./pages/ServiceHistory').then(module => ({ default: module.ServiceHistory })))
const LazyServiceSchedulerPage = React.lazy(() => import('./pages/ServiceScheduler').then(module => ({ default: module.ServiceSchedulerPage })))
const LazyFuelHistory = React.lazy(() => import('./pages/FuelHistory').then(module => ({ default: module.FuelHistory })))
const LazyExportsPage = React.lazy(() => import('./pages/ExportsPage').then(module => ({ default: module.ExportsPage })))
const LazySettings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))

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
import { Button } from './components/ui/button'
import { ToastProvider, ToastContainer } from './components/ui/toast'
import { Car, Settings as SettingsIcon, History, Calendar, Download, Fuel } from 'lucide-react'
import { BottomNavigation } from './components/mobile'

function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Car className="w-6 h-6" />
            <span className="font-semibold text-lg">Maintenance Tracker</span>
          </div>
          <div className="flex space-x-4">
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
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="pb-20 md:pb-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicles" element={
                <Suspense fallback={<RouteLoading />}>
                  <LazyVehicles />
                </Suspense>
              } />
              <Route path="/services" element={
                <Suspense fallback={<RouteLoading />}>
                  <LazyServiceHistory />
                </Suspense>
              } />
              <Route path="/fuel" element={
                <Suspense fallback={<RouteLoading />}>
                  <LazyFuelHistory />
                </Suspense>
              } />
              <Route path="/scheduler" element={
                <Suspense fallback={<RouteLoading />}>
                  <LazyServiceSchedulerPage />
                </Suspense>
              } />
              <Route path="/exports" element={
                <Suspense fallback={<RouteLoading />}>
                  <LazyExportsPage />
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<RouteLoading />}>
                  <LazySettings />
                </Suspense>
              } />
            </Routes>
          </main>
          <ToastContainer />

          {/* Mobile Navigation */}
          <BottomNavigation />
        </div>
      </Router>
    </ToastProvider>
  )
}

export default App
