import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Vehicles } from './pages/Vehicles'
import { ServiceHistory } from './pages/ServiceHistory'
import { ServiceSchedulerPage } from './pages/ServiceScheduler'
import { Settings } from './pages/Settings'
import { Button } from './components/ui/button'
import { Car, Settings as SettingsIcon, History, Calendar } from 'lucide-react'

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
              <a href="/settings" className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                Settings
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
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/services" element={<ServiceHistory />} />
          <Route path="/scheduler" element={<ServiceSchedulerPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App