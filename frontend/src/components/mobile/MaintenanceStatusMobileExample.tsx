import React from 'react';
import { MaintenanceStatusMobile } from './MaintenanceStatusMobile';

// Example data for demonstration
const exampleMaintenanceStatus = {
  due_now: [
    {
      maintenance_item: {
        _id: '1',
        name: 'Engine Oil Change',
        category: 'Engine',
        interval_km: 5000,
        description: 'Replace engine oil and oil filter',
        action: 'Replace',
        vehicle_id: 'vehicle-1'
      },
      miles_overdue: 1200,
      miles_until_due: 0,
      last_service_date: '2024-01-15',
      last_service_mileage: 45000,
      due_at_mileage: 50000
    },
    {
      maintenance_item: {
        _id: '2',
        name: 'Air Filter Replacement',
        category: 'Engine',
        interval_km: 20000,
        description: 'Replace engine air filter for optimal performance',
        action: 'Replace',
        vehicle_id: 'vehicle-1'
      },
      miles_overdue: 500,
      miles_until_due: 0,
      last_service_date: '2023-08-20',
      last_service_mileage: 30000,
      due_at_mileage: 50000
    }
  ],
  due_soon: [
    {
      maintenance_item: {
        _id: '3',
        name: 'Tire Rotation',
        category: 'Tires',
        interval_km: 10000,
        description: 'Rotate tires for even wear',
        action: 'Service',
        vehicle_id: 'vehicle-1'
      },
      miles_overdue: 0,
      miles_until_due: 800,
      last_service_date: '2024-02-01',
      last_service_mileage: 49200,
      due_at_mileage: 50000
    },
    {
      maintenance_item: {
        _id: '4',
        name: 'Brake Inspection',
        category: 'Brakes',
        interval_km: 15000,
        description: 'Inspect brake pads, rotors, and fluid',
        action: 'Inspect',
        vehicle_id: 'vehicle-1'
      },
      miles_overdue: 0,
      miles_until_due: 1200,
      last_service_date: '2023-12-10',
      last_service_mileage: 35000,
      due_at_mileage: 50000
    }
  ],
  ok: [
    {
      maintenance_item: {
        _id: '5',
        name: 'Coolant Replacement',
        category: 'Cooling System',
        interval_km: 40000,
        description: 'Replace engine coolant and check system',
        action: 'Replace',
        vehicle_id: 'vehicle-1'
      },
      miles_overdue: 0,
      miles_until_due: 25000,
      last_service_date: '2023-10-15',
      last_service_mileage: 25000,
      due_at_mileage: 65000
    },
    {
      maintenance_item: {
        _id: '6',
        name: 'Transmission Fluid',
        category: 'Transmission',
        interval_km: 60000,
        description: 'Replace transmission fluid and filter',
        action: 'Replace',
        vehicle_id: 'vehicle-1'
      },
      miles_overdue: 0,
      miles_until_due: 35000,
      last_service_date: '2023-06-20',
      last_service_mileage: 15000,
      due_at_mileage: 75000
    }
  ]
};

export const MaintenanceStatusMobileExample: React.FC = () => {
  const handleMarkComplete = async (itemId: string) => {
    console.log('Marking item as complete:', itemId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Service ${itemId} marked as complete!`);
  };

  const handleScheduleService = (itemId: string) => {
    console.log('Scheduling service for item:', itemId);
    alert(`Quick service logging for item ${itemId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Vehicle Maintenance Status
        </h1>
        
        <MaintenanceStatusMobile
          maintenanceStatus={exampleMaintenanceStatus}
          onMarkComplete={handleMarkComplete}
          onScheduleService={handleScheduleService}
          className="space-y-4"
        />
      </div>
    </div>
  );
};

export default MaintenanceStatusMobileExample;

// Usage example:
/*
import { MaintenanceStatusMobile } from '@/components/mobile/MaintenanceStatusMobile';

function YourComponent() {
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    due_now: [],
    due_soon: [],
    ok: []
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/dashboard/vehicle-id');
      const data = await response.json();
      setMaintenanceStatus(data);
    };
    fetchData();
  }, []);

  return (
    <MaintenanceStatusMobile
      maintenanceStatus={maintenanceStatus}
      onMarkComplete={async (itemId) => {
        // Handle marking item as complete
        await markServiceComplete(itemId);
        // Refresh data
        fetchData();
      }}
      onScheduleService={(itemId) => {
        // Handle quick service logging
        openQuickServiceModal(itemId);
      }}
    />
  );
}
*/