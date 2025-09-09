import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Wrench
} from 'lucide-react';
import { DashboardMaintenanceItem, ServiceRecord } from '@/types';

interface StatsGridMobileProps {
  maintenanceStatus: {
    due_now: DashboardMaintenanceItem[];
    due_soon: DashboardMaintenanceItem[];
    ok: DashboardMaintenanceItem[];
  };
  serviceRecords?: ServiceRecord[];
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  bgColor,
  textColor,
  borderColor,
  onClick
}) => {
  return (
    <Card 
      className={cn(
        // Mobile-optimized card with touch-friendly sizing
        'min-h-[120px] cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]',
        
        // Color scheme
        bgColor,
        borderColor,
        
        // Border styling
        'border-2'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col h-full justify-between">
          {/* Header with icon and title */}
          <div className="flex items-start justify-between mb-2">
            <div className={cn(
              // Icon container with proper sizing
              'w-10 h-10 rounded-lg flex items-center justify-center',
              textColor.replace('text-', 'bg-').replace('800', '100').replace('600', '100')
            )}>
              <div className={cn('w-6 h-6', textColor)}>
                {icon}
              </div>
            </div>
            
            {/* Value display */}
            <div className="text-right">
              <div className={cn(
                // Large, mobile-friendly typography
                'text-2xl font-bold leading-tight',
                textColor
              )}>
                {value}
              </div>
            </div>
          </div>
          
          {/* Title and description */}
          <div className="space-y-1">
            <h3 className={cn(
              // Mobile-optimized typography
              'text-sm font-semibold leading-tight',
              textColor
            )}>
              {title}
            </h3>
            <p className={cn(
              // Smaller descriptive text
              'text-xs leading-tight',
              textColor.replace('800', '600').replace('600', '500')
            )}>
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatsGridMobile: React.FC<StatsGridMobileProps> = ({
  maintenanceStatus,
  serviceRecords = [],
  className
}) => {
  // Calculate statistics
  const dueNowCount = maintenanceStatus.due_now.length;
  const dueSoonCount = maintenanceStatus.due_soon.length;
  const upToDateCount = maintenanceStatus.ok.length;
  const totalServicesCount = serviceRecords.length;
  const totalMaintenanceItems = dueNowCount + dueSoonCount + upToDateCount;

  // Calculate completion rate
  const completionRate = totalMaintenanceItems > 0 
    ? Math.round((upToDateCount / totalMaintenanceItems) * 100) 
    : 0;

  const handleCardClick = (_type: 'due_now' | 'due_soon' | 'ok' | 'services') => {
    // Placeholder for navigation or filtering functionality
    // This could be used to navigate to different views or filter content
  };

  return (
    <div className={cn(
      // Mobile-optimized container
      'w-full px-4 py-4',
      
      // 2-column grid layout for mobile
      'grid grid-cols-2 gap-4',
      
      // Responsive adjustments
      'sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4',
      
      className
    )}>
      {/* Due Now Card */}
      <StatCard
        title="Due Now"
        value={dueNowCount}
        description="Requires immediate attention"
        icon={<AlertTriangle className="w-full h-full" />}
        bgColor="bg-red-50"
        textColor="text-red-800"
        borderColor="border-red-200"
        onClick={() => handleCardClick('due_now')}
      />
      
      {/* Due Soon Card */}
      <StatCard
        title="Due Soon"
        value={dueSoonCount}
        description="Plan within next service"
        icon={<Clock className="w-full h-full" />}
        bgColor="bg-yellow-50"
        textColor="text-yellow-800"
        borderColor="border-yellow-200"
        onClick={() => handleCardClick('due_soon')}
      />
      
      {/* Up to Date Card */}
      <StatCard
        title="Up to Date"
        value={upToDateCount}
        description={`${completionRate}% completion rate`}
        icon={<CheckCircle className="w-full h-full" />}
        bgColor="bg-green-50"
        textColor="text-green-800"
        borderColor="border-green-200"
        onClick={() => handleCardClick('ok')}
      />
      
      {/* Total Services Card */}
      <StatCard
        title="Total Services"
        value={totalServicesCount}
        description="Service history logged"
        icon={<Wrench className="w-full h-full" />}
        bgColor="bg-gray-50"
        textColor="text-gray-800"
        borderColor="border-gray-200"
        onClick={() => handleCardClick('services')}
      />
    </div>
  );
};

export default StatsGridMobile;