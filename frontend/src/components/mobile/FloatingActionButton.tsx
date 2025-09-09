import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onLogService: () => void;
  onUpdateMileage: () => void;
  onScheduleService: () => void;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onLogService,
  onUpdateMileage,
  onScheduleService,
  className
}) => {
  // Prevent unused variable warnings
  void onUpdateMileage;
  void onScheduleService;
  return (
    <div className={cn(
      'fixed bottom-20 right-4 z-40',
      'md:hidden', // Only show on mobile
      className
    )}>
      <Button
        size="lg"
        className="w-14 h-14 rounded-full shadow-lg"
        onClick={onLogService}
      >
        <div className="w-6 h-6 bg-white rounded" />
      </Button>
    </div>
  );
};

export default FloatingActionButton;