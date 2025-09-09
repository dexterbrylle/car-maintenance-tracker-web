import React from 'react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  className?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ className }) => {
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50',
      'md:hidden', // Only show on mobile
      className
    )}>
      <div className="flex justify-around items-center h-16">
        {/* Placeholder navigation items */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 bg-gray-300 rounded" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 bg-gray-300 rounded" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 bg-gray-300 rounded" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;