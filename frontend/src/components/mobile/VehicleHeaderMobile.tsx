import React, { useState, useRef, useEffect } from 'react';
import { Vehicle } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface VehicleHeaderMobileProps {
  vehicle: Vehicle;
  onMileageUpdate: (newMileage: number) => Promise<void>;
  className?: string;
}

export const VehicleHeaderMobile: React.FC<VehicleHeaderMobileProps> = ({
  vehicle,
  onMileageUpdate,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(vehicle.current_mileage.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset edit value when vehicle changes
  useEffect(() => {
    setEditValue(vehicle.current_mileage.toString());
    setError(null);
  }, [vehicle]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMileageClick = () => {
    if (!isLoading) {
      setIsEditing(true);
      setError(null);
    }
  };

  const handleSave = async () => {
    const newMileage = parseInt(editValue);
    
    // Validation
    if (isNaN(newMileage)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (newMileage < vehicle.current_mileage) {
      setError('Mileage cannot be less than current mileage');
      return;
    }
    
    if (newMileage === vehicle.current_mileage) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onMileageUpdate(newMileage);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update mileage');
      setEditValue(vehicle.current_mileage.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(vehicle.current_mileage.toString());
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow save button click
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 200);
  };

  return (
    <div className={cn(
      // Sticky positioning for mobile
      'sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm',
      
      // Mobile padding and spacing
      'px-4 py-4',
      
      // Prevent content jump during loading
      'min-h-[80px]',
      
      className
    )}>
      {/* Vehicle Information */}
      <div className="flex flex-col space-y-2">
        {/* Vehicle Name */}
        <h1 className="text-xl font-bold text-gray-900 leading-tight">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        
        {/* Mileage Section */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 font-medium">Current Mileage:</span>
          
          {isEditing ? (
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex-1 min-w-0">
                <Input
                  ref={inputRef}
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  className={cn(
                    // Mobile-optimized input
                    'h-11 text-lg',
                    
                    // Error state
                    error && 'border-red-500 focus:border-red-500',
                    
                    // Prevent zoom on iOS
                    'text-lg'
                  )}
                  min={vehicle.current_mileage}
                  step="1"
                />
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  size="sm"
                  className={cn(
                    // Mobile-optimized button
                    'h-11 px-3 text-sm font-medium',
                    
                    // Loading state
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Save</span>
                    </div>
                  ) : (
                    'Save'
                  )}
                </Button>
                
                <Button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="h-11 px-3 text-sm font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleMileageClick}
              disabled={isLoading}
              className={cn(
                // Mobile-optimized touch target (minimum 44px)
                'min-h-[44px] px-3 py-2 rounded-md',
                
                // Visual feedback
                'hover:bg-gray-50 active:bg-gray-100',
                
                // Focus state
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                
                // Loading state
                isLoading && 'opacity-50 cursor-not-allowed',
                
                // Transition
                'transition-colors duration-150'
              )}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900">
                  {vehicle.current_mileage.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">km</span>
                <svg
                  className={cn(
                    'w-4 h-4 text-gray-400',
                    // Rotate icon when loading
                    isLoading && 'animate-spin'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
            </button>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 mt-1">
            {error}
          </div>
        )}
        
        {/* Edit Hint */}
        {!isEditing && !isLoading && (
          <p className="text-xs text-gray-500 mt-1">
            Tap mileage to edit
          </p>
        )}
      </div>
    </div>
  );
};

export default VehicleHeaderMobile;