import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaintenanceItem, ServiceRecord } from "@/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X, Save, Loader2, Settings, Search } from "lucide-react";

interface ServiceFormMobileProps {
  vehicleId: string;
  maintenanceItems: MaintenanceItem[];
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<ServiceRecord>;
  className?: string;
}

interface FormData {
  maintenance_item_id: string;
  date: string;
  mileage: string;
  cost: string;
  notes: string;
}

export const ServiceFormMobile: React.FC<ServiceFormMobileProps> = ({
  vehicleId,
  maintenanceItems,
  onSuccess,
  onCancel,
  initialData,
  className
}) => {
  const [formData, setFormData] = useState<FormData>({
    maintenance_item_id: "",
    date: new Date().toISOString().split('T')[0],
    mileage: "",
    cost: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Filter maintenance items based on search term
  const filteredItems = maintenanceItems.filter(item =>
    !searchTerm ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group maintenance items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MaintenanceItem[]>);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        maintenance_item_id: initialData.maintenance_item_id || "",
        date: initialData.date || new Date().toISOString().split('T')[0],
        mileage: initialData.mileage?.toString() || "",
        cost: initialData.cost?.toString() || "",
        notes: initialData.notes || ""
      }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.maintenance_item_id) {
      newErrors.maintenance_item_id = "Please select a maintenance item";
    }

    if (!formData.date) {
      newErrors.date = "Please select a date";
    }

    if (!formData.mileage) {
      newErrors.mileage = "Please enter mileage";
    } else if (isNaN(parseInt(formData.mileage)) || parseInt(formData.mileage) <= 0) {
      newErrors.mileage = "Please enter a valid mileage";
    }

    if (!formData.cost) {
      newErrors.cost = "Please enter cost";
    } else if (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0) {
      newErrors.cost = "Please enter a valid cost";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const serviceData = {
        vehicle_id: vehicleId,
        maintenance_item_id: formData.maintenance_item_id,
        date: formData.date,
        mileage: parseInt(formData.mileage),
        cost: parseFloat(formData.cost),
        notes: formData.notes || undefined
      };

      await api.addService(serviceData);

      // Update vehicle mileage if the new mileage is higher
      try {
        const vehicles = await api.getVehicles();
        const currentVehicle = vehicles.find((v: any) => v._id === vehicleId);
        if (currentVehicle && serviceData.mileage > currentVehicle.current_mileage) {
          await api.updateVehicle(vehicleId, { current_mileage: serviceData.mileage });
        }
      } catch (error) {
        console.error('Failed to update vehicle mileage:', error);
      }

      // Reset form
      setFormData({
        maintenance_item_id: "",
        date: new Date().toISOString().split('T')[0],
        mileage: "",
        cost: "",
        notes: ""
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to add service record:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: "Failed to save service record. Please try again." 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const selectedMaintenanceItem = maintenanceItems.find(item => item._id === formData.maintenance_item_id);

  return (
    <div className={cn(
      // Full-screen mobile layout
      'min-h-screen bg-white',
      
      // Prevent zoom on iOS
      'touch-manipulation',
      
      className
    )}>
      {/* Sticky Header */}
      <div className={cn(
        // Sticky positioning
        'sticky top-0 z-50 bg-white border-b border-gray-200',
        
        // Mobile padding
        'px-4 py-4',
        
        // Shadow for depth
        'shadow-sm'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className={cn(
                // Mobile-optimized touch target
                'h-11 w-11 p-0',
                
                // Hover states
                'hover:bg-gray-100 active:bg-gray-200'
              )}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {initialData ? "Edit Service" : "Add Service"}
              </h1>
              <p className="text-sm text-gray-600">
                Log maintenance completed
              </p>
            </div>
          </div>
          
          <Button
            type="submit"
            form="service-form"
            disabled={isSubmitting}
            className={cn(
              // Mobile-optimized button
              'h-11 px-6 text-base font-medium',
              
              // Loading state
              isSubmitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-5 w-5" />
                <span>Save</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 py-6 space-y-6">
        <form 
          id="service-form" 
          onSubmit={handleSubmit}
          className="space-y-6"
          noValidate
        >
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Maintenance Item Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-900">
              Maintenance Item
            </Label>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search maintenance items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  // Mobile-optimized input
                  'h-12 pl-12 pr-4 text-base',
                  
                  // Prevent zoom on iOS
                  'text-base'
                )}
              />
            </div>

            {/* Maintenance Items Grid */}
            <div className="space-y-4">
              {Object.entries(groupedItems).length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">
                    {searchTerm ? `No items found matching "${searchTerm}"` : "No maintenance items available"}
                  </p>
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSearchTerm("")}
                      className="mt-2 text-sm"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {items.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => handleInputChange('maintenance_item_id', item._id)}
                          className={cn(
                            // Mobile-optimized touch target
                            'w-full p-4 text-left rounded-lg border-2 transition-colors',
                            
                            // Selected state
                            formData.maintenance_item_id === item._id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                            
                            // Focus state
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium text-gray-900 truncate">
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Every {item.interval_km.toLocaleString()} km
                              </p>
                              {item.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {formData.maintenance_item_id === item._id && (
                              <div className="ml-3 flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {errors.maintenance_item_id && (
              <p className="text-sm text-red-600">{errors.maintenance_item_id}</p>
            )}
          </div>

          {/* Selected Item Summary */}
          {selectedMaintenanceItem && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Selected: {selectedMaintenanceItem.name}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {selectedMaintenanceItem.category} • Every {selectedMaintenanceItem.interval_km.toLocaleString()} km
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-semibold text-gray-900">
                  Service Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={cn(
                    // Mobile-optimized input
                    'h-12 px-4 text-base',
                    
                    // Error state
                    errors.date && 'border-red-500 focus:border-red-500',
                    
                    // Prevent zoom on iOS
                    'text-base'
                  )}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
              </div>

              {/* Mileage */}
              <div className="space-y-2">
                <Label htmlFor="mileage" className="text-base font-semibold text-gray-900">
                  Mileage (km)
                </Label>
                <Input
                  id="mileage"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange('mileage', e.target.value)}
                  placeholder="Enter mileage"
                  className={cn(
                    // Mobile-optimized input
                    'h-12 px-4 text-base',
                    
                    // Error state
                    errors.mileage && 'border-red-500 focus:border-red-500',
                    
                    // Prevent zoom on iOS
                    'text-base'
                  )}
                  min="0"
                  step="1"
                />
                {errors.mileage && <p className="text-sm text-red-600">{errors.mileage}</p>}
              </div>

              {/* Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-base font-semibold text-gray-900">
                  Cost (PHP)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    // Mobile-optimized input
                    'h-12 px-4 text-base',
                    
                    // Error state
                    errors.cost && 'border-red-500 focus:border-red-500',
                    
                    // Prevent zoom on iOS
                    'text-base'
                  )}
                  min="0"
                />
                {errors.cost && <p className="text-sm text-red-600">{errors.cost}</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold text-gray-900">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about the service..."
                className={cn(
                  // Mobile-optimized textarea
                  'min-h-[100px] px-4 py-3 text-base resize-none',
                  
                  // Prevent zoom on iOS
                  'text-base'
                )}
                rows={4}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceFormMobile;