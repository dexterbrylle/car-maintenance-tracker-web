import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '@/types';
import { api, APIError } from '@/lib/api';
import { useError } from '@/contexts/ErrorContext';
import { useNavigate } from 'react-router-dom';

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  loading: boolean;
  error: Error | null;
  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicleId: (id: string) => void;
  refreshVehicles: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing vehicles with improved error handling
 * Prevents duplicate error notifications and provides centralized state management
 */
export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehiclesState] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showError } = useError();
  const navigate = useNavigate();

  const refreshVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getVehicles();
      const vehiclesData = Array.isArray(response) ? response : [];
      
      setVehiclesState(vehiclesData);
      
      // Auto-select first vehicle if none selected
      if (vehiclesData.length > 0 && !selectedVehicleId) {
        setSelectedVehicleIdState(vehiclesData[0]._id);
      }
      
      // Handle empty vehicles state
      if (vehiclesData.length === 0) {
        // Only show this message if not already on settings page
        if (!window.location.pathname.includes('/settings')) {
          showError("Let's add your first vehicle to get started", {
            title: "No Vehicles Found",
            variant: "info"
          });
          navigate('/settings');
        }
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err);
      
      // Only set error if it's not a suppressed duplicate
      if (err instanceof APIError) {
        setError(err);
        
        // Only show toast for actual errors, not suppressed duplicates
        if (err.code !== 'VEHICLES_LOAD_ERROR_SUPPRESSED') {
          showError(err, {
            description: "Failed to load vehicles. Please try again later.",
            errorKey: 'vehicles_load_error',
            suppressDuplicate: true
          });
        }
      } else if (err instanceof Error) {
        setError(err);
        showError(err, {
          description: "An unexpected error occurred while loading vehicles.",
          errorKey: 'vehicles_load_unexpected',
          suppressDuplicate: true
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId, showError, navigate]);

  const setVehicles = useCallback((newVehicles: Vehicle[]) => {
    setVehiclesState(newVehicles);
    
    // Update selected vehicle if current selection is no longer valid
    if (selectedVehicleId && !newVehicles.find(v => v._id === selectedVehicleId)) {
      setSelectedVehicleIdState(newVehicles.length > 0 ? newVehicles[0]._id : null);
    }
  }, [selectedVehicleId]);

  const setSelectedVehicleId = useCallback((id: string) => {
    setSelectedVehicleIdState(id);
    // Clear any previous vehicles-related errors when changing selection
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    refreshVehicles();
  }, []); // Only run once on mount

  return {
    vehicles,
    selectedVehicleId,
    loading,
    error,
    setVehicles,
    setSelectedVehicleId,
    refreshVehicles,
    clearError,
  };
}

/**
 * Hook for checking if user has vehicles and redirecting if needed
 */
export function useVehicleCheck(): { hasVehicles: boolean; loading: boolean; redirectToSettings: () => void } {
  const { vehicles, loading } = useVehicles();
  const navigate = useNavigate();

  const redirectToSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  return {
    hasVehicles: vehicles.length > 0,
    loading,
    redirectToSettings,
  };
}