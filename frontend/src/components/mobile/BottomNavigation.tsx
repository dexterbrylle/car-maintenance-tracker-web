import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Car, 
  Wrench, 
  Fuel, 
  BarChart, 
  Settings 
} from 'lucide-react';

interface BottomNavigationProps {
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Maintenance', href: '/services', icon: Wrench },
  { name: 'Fuel', href: '/fuel', icon: Fuel },
  { name: 'Analytics', href: '/exports', icon: BarChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ className }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50',
      'md:hidden', // Only show on mobile
      className
    )}>
      <div className="flex justify-around items-center h-16">
        {navigationItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 px-1',
                'transition-colors duration-200',
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mb-1',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )} />
              <span className={cn(
                'text-xs',
                isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;