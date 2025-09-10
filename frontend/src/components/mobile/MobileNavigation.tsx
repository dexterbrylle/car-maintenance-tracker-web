import { Link, useLocation } from "react-router-dom"
import { Home, Fuel, Wrench, Settings, Home as HomeFilled, Fuel as FuelFilled, Wrench as WrenchFilled, Settings as SettingsFilled } from "lucide-react"

export function MobileNavigation() {
  const location = useLocation()
  
  const navItems = [
    { path: "/", icon: Home, filledIcon: HomeFilled, label: "Dashboard" },
    { path: "/fuel", icon: Fuel, filledIcon: FuelFilled, label: "Fuel" },
    { path: "/services", icon: Wrench, filledIcon: WrenchFilled, label: "Maintenance" },
    { path: "/settings", icon: Settings, filledIcon: SettingsFilled, label: "Settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden pb-safe-bottom">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center py-3 text-xs font-medium transition-colors touch-target
                ${isActive
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
                }
              `}
            >
              {isActive ? (
                <item.filledIcon className="mb-1 h-5 w-5 text-slate-900" />
              ) : (
                <Icon className={`mb-1 h-5 w-5 ${isActive ? "text-slate-900" : "text-slate-500"}`} />
              )}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}