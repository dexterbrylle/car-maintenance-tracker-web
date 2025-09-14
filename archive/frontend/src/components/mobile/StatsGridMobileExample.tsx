import React from 'react';
import { StatsGridMobile } from './StatsGridMobile';
import { DashboardMaintenanceItem, ServiceRecord } from '@/types';

interface StatsGridMobileExampleProps {
  // Example data for demonstration
  maintenanceStatus?: {
    due_now: DashboardMaintenanceItem[];
    due_soon: DashboardMaintenanceItem[];
    ok: DashboardMaintenanceItem[];
  };
  serviceRecords?: ServiceRecord[];
}

export const StatsGridMobileExample: React.FC<StatsGridMobileExampleProps> = ({
  maintenanceStatus,
  serviceRecords
}) => {
  // Example data for demonstration purposes
  const exampleMaintenanceStatus = maintenanceStatus || {
    due_now: [
      {
        maintenance_item: {
          _id: '1',
          name: 'Engine Oil Change',
          category: 'Engine',
          interval_km: 5000,
          vehicle_id: 'vehicle1'
        },
        miles_overdue: 250,
        due_at_mileage: 10000
      }
    ],
    due_soon: [
      {
        maintenance_item: {
          _id: '2',
          name: 'Air Filter Replacement',
          category: 'Engine',
          interval_km: 15000,
          vehicle_id: 'vehicle1'
        },
        miles_until_due: 1200,
        due_at_mileage: 15000
      }
    ],
    ok: [
      {
        maintenance_item: {
          _id: '3',
          name: 'Tire Rotation',
          category: 'Tires',
          interval_km: 10000,
          vehicle_id: 'vehicle1'
        },
        miles_until_due: 7500,
        due_at_mileage: 20000
      }
    ]
  };

  const exampleServiceRecords = serviceRecords || [
    {
      _id: '1',
      vehicle_id: 'vehicle1',
      maintenance_item_id: '1',
      date: '2024-01-15',
      mileage: 9750,
      cost: 1500,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      _id: '2',
      vehicle_id: 'vehicle1',
      maintenance_item_id: '2',
      date: '2024-02-20',
      mileage: 11200,
      cost: 800,
      created_at: '2024-02-20T14:30:00Z'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Example header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          Vehicle Maintenance Stats
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Quick overview of your maintenance status
        </p>
      </div>

      {/* Stats Grid Component */}
      <StatsGridMobile
        maintenanceStatus={exampleMaintenanceStatus}
        serviceRecords={exampleServiceRecords}
        className="mt-4"
      />

      {/* Additional content example */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Maintenance Summary
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 1 item requires immediate attention</p>
            <p>• 1 item should be serviced soon</p>
            <p>• 1 item is up to date</p>
            <p>• 2 total services logged</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGridMobileExample;