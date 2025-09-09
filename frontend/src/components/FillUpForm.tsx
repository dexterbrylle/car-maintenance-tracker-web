import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FuelRecord, Vehicle } from "@/types";
import { api } from "@/lib/api";
import { X, Save, Loader2, Calculator } from "lucide-react";

interface FillUpFormProps {
  vehicleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<FuelRecord>;
}

interface FormData {
  date: string;
  odometer: string;
  liters: string;
  price_per_liter: string;
  total_cost: string;
  notes: string;
}

export const FillUpForm: React.FC<FillUpFormProps> = ({
  vehicleId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    odometer: "",
    liters: "",
    price_per_liter: "",
    total_cost: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastOdometerReading, setLastOdometerReading] = useState<number | null>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<string>("");

  // Fetch last odometer reading for validation
  useEffect(() => {
    const fetchLastOdometer = async () => {
      try {
        const response = await api.getFuelRecords(vehicleId);
        const records = Array.isArray(response) ? response : [];
        if (records.length > 0) {
          const sortedRecords = records.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setLastOdometerReading(sortedRecords[0].odometer_km);
        }
      } catch (error) {
        console.error('Failed to fetch last odometer reading:', error);
      }
    };

    if (!initialData) {
      fetchLastOdometer();
    }
  }, [vehicleId, initialData]);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        date: initialData.date || new Date().toISOString().split('T')[0],
        odometer: initialData.odometer_km?.toString() || "",
        liters: initialData.liters?.toString() || "",
        price_per_liter: initialData.price_per_liter?.toString() || "",
        total_cost: initialData.total_cost?.toString() || "",
        notes: initialData.notes || ""
      }));
    }
  }, [initialData]);

  // Auto-calculate total cost when liters or price changes
  useEffect(() => {
    const liters = parseFloat(formData.liters);
    const pricePerLiter = parseFloat(formData.price_per_liter);
    
    if (!isNaN(liters) && !isNaN(pricePerLiter) && liters > 0 && pricePerLiter > 0) {
      const total = liters * pricePerLiter;
      setCalculatedTotal(total.toFixed(2));
      
      // Auto-fill total cost if it's empty or matches the calculated value
      if (!formData.total_cost || parseFloat(formData.total_cost) === total) {
        setFormData(prev => ({ ...prev, total_cost: total.toFixed(2) }));
      }
    } else {
      setCalculatedTotal("");
    }
  }, [formData.liters, formData.price_per_liter]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "Please select a date";
    }

    if (!formData.odometer) {
      newErrors.odometer = "Please enter odometer reading";
    } else if (isNaN(parseInt(formData.odometer)) || parseInt(formData.odometer) <= 0) {
      newErrors.odometer = "Please enter a valid odometer reading";
    } else if (lastOdometerReading && parseInt(formData.odometer) < lastOdometerReading) {
      newErrors.odometer = `Odometer reading must be greater than the last reading (${lastOdometerReading.toLocaleString()} km)`;
    }

    if (!formData.liters) {
      newErrors.liters = "Please enter liters filled";
    } else if (isNaN(parseFloat(formData.liters)) || parseFloat(formData.liters) <= 0) {
      newErrors.liters = "Please enter a valid amount";
    }

    if (!formData.price_per_liter) {
      newErrors.price_per_liter = "Please enter price per liter";
    } else if (isNaN(parseFloat(formData.price_per_liter)) || parseFloat(formData.price_per_liter) <= 0) {
      newErrors.price_per_liter = "Please enter a valid price";
    }

    if (!formData.total_cost) {
      newErrors.total_cost = "Please enter total cost";
    } else if (isNaN(parseFloat(formData.total_cost)) || parseFloat(formData.total_cost) < 0) {
      newErrors.total_cost = "Please enter a valid total cost";
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
      const fuelData = {
        vehicle_id: vehicleId,
        date: formData.date,
        odometer_km: parseInt(formData.odometer),
        liters: parseFloat(formData.liters),
        price_per_liter: parseFloat(formData.price_per_liter),
        total_cost: parseFloat(formData.total_cost),
        notes: formData.notes || undefined
      };

      if (initialData?._id) {
        await api.updateFuelRecord(initialData._id, fuelData);
      } else {
        await api.addFuelRecord(fuelData);
      }

      // Update vehicle mileage if the new odometer is higher
      try {
        const vehiclesResponse = await api.getVehicles();
        const vehiclesData = Array.isArray(vehiclesResponse) ? vehiclesResponse : [];
        const currentVehicle = vehiclesData.find((v: Vehicle) => v._id === vehicleId);
        if (currentVehicle && fuelData.odometer_km > currentVehicle.current_mileage) {
          await api.updateVehicle(vehicleId, { current_mileage: fuelData.odometer_km });
        }
      } catch (error) {
        console.error('Failed to update vehicle mileage:', error);
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        odometer: "",
        liters: "",
        price_per_liter: "",
        total_cost: "",
        notes: ""
      });

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save fuel record:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: "Failed to save fuel record. Please try again." 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return "";
    return `₱${value.toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{initialData ? "Edit Fill-up" : "Add Fill-up"}</span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
        <CardDescription>Record fuel purchase details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Last Odometer Reading Info */}
          {lastOdometerReading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Last odometer reading: <span className="font-semibold">{lastOdometerReading.toLocaleString()} km</span>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                New reading must be greater than this value
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
            </div>

            {/* Odometer */}
            <div className="space-y-2">
              <Label htmlFor="odometer">Odometer (km)</Label>
              <Input
                id="odometer"
                type="number"
                value={formData.odometer}
                onChange={(e) => handleInputChange('odometer', e.target.value)}
                placeholder="Enter current odometer"
                className={errors.odometer ? 'border-red-500' : ''}
                min="0"
                step="1"
              />
              {errors.odometer && <p className="text-sm text-red-600">{errors.odometer}</p>}
            </div>

            {/* Liters */}
            <div className="space-y-2">
              <Label htmlFor="liters">Liters Filled</Label>
              <Input
                id="liters"
                type="number"
                step="0.01"
                value={formData.liters}
                onChange={(e) => handleInputChange('liters', e.target.value)}
                placeholder="0.00"
                className={errors.liters ? 'border-red-500' : ''}
                min="0"
              />
              {errors.liters && <p className="text-sm text-red-600">{errors.liters}</p>}
            </div>

            {/* Price per Liter */}
            <div className="space-y-2">
              <Label htmlFor="price_per_liter">Price per Liter (₱)</Label>
              <Input
                id="price_per_liter"
                type="number"
                step="0.01"
                value={formData.price_per_liter}
                onChange={(e) => handleInputChange('price_per_liter', e.target.value)}
                placeholder="0.00"
                className={errors.price_per_liter ? 'border-red-500' : ''}
                min="0"
              />
              {errors.price_per_liter && <p className="text-sm text-red-600">{errors.price_per_liter}</p>}
            </div>

            {/* Total Cost */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="total_cost">Total Cost (₱)</Label>
                {calculatedTotal && (
                  <div className="flex items-center space-x-1 text-sm text-blue-600">
                    <Calculator className="w-4 h-4" />
                    <span>Auto-calculated: {formatCurrency(calculatedTotal)}</span>
                  </div>
                )}
              </div>
              <Input
                id="total_cost"
                type="number"
                step="0.01"
                value={formData.total_cost}
                onChange={(e) => handleInputChange('total_cost', e.target.value)}
                placeholder="0.00"
                className={errors.total_cost ? 'border-red-500' : ''}
                min="0"
              />
              {errors.total_cost && <p className="text-sm text-red-600">{errors.total_cost}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this fill-up..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>{initialData ? "Update" : "Save"}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FillUpForm;