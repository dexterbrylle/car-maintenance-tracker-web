import { Link, useLocation } from "react-router-dom"
import { Home, Fuel, Wrench, Settings, Home as HomeFilled, Fuel as FuelFilled, Wrench as WrenchFilled, Settings as SettingsFilled } from "lucide-react"

export function MobileNavigation() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden pb-safe-bottom">
      <div className="grid grid-cols-5">
        {/* Dashboard */}
        <Link
          to="/"
          className={`
            flex flex-col items-center py-3 text-xs font-medium transition-colors touch-target
            ${location.pathname === "/" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
          `}
        >
          {location.pathname === "/" ? (
            <HomeFilled className="mb-1 h-5 w-5 text-slate-900" />
          ) : (
            <Home className={`mb-1 h-5 w-5 ${location.pathname === "/" ? "text-slate-900" : "text-slate-500"}`} />
          )}
          <span>Dashboard</span>
        </Link>

        {/* Fuel */}
        <Link
          to="/fuel"
          className={`
            flex flex-col items-center py-3 text-xs font-medium transition-colors touch-target
            ${location.pathname === "/fuel" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
          `}
        >
          {location.pathname === "/fuel" ? (
            <FuelFilled className="mb-1 h-5 w-5 text-slate-900" />
          ) : (
            <Fuel className={`mb-1 h-5 w-5 ${location.pathname === "/fuel" ? "text-slate-900" : "text-slate-500"}`} />
          )}
          <span>Fuel</span>
        </Link>

        {/* Spacer to maintain 5-column layout */}
        <div className="flex flex-col items-center py-3">
          <div className="mb-1 h-5 w-5" />
          <span className="text-xs font-medium text-slate-300">
            •
          </span>
        </div>

        {/* Maintenance */}
        <Link
          to="/services"
          className={`
            flex flex-col items-center py-3 text-xs font-medium transition-colors touch-target
            ${location.pathname === "/services" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
          `}
        >
          {location.pathname === "/services" ? (
            <WrenchFilled className="mb-1 h-5 w-5 text-slate-900" />
          ) : (
            <Wrench className={`mb-1 h-5 w-5 ${location.pathname === "/services" ? "text-slate-900" : "text-slate-500"}`} />
          )}
          <span>Maintenance</span>
        </Link>

        {/* Settings */}
        <Link
          to="/settings"
          className={`
            flex flex-col items-center py-3 text-xs font-medium transition-colors touch-target
            ${location.pathname === "/settings" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
          `}
        >
          {location.pathname === "/settings" ? (
            <SettingsFilled className="mb-1 h-5 w-5 text-slate-900" />
          ) : (
            <Settings className={`mb-1 h-5 w-5 ${location.pathname === "/settings" ? "text-slate-900" : "text-slate-500"}`} />
          )}
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  )
}
