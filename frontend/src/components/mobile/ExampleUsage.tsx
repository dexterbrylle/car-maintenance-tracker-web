import React from 'react';
import { VehicleHeaderMobile } from '@/components/mobile';
import { Vehicle } from '@/types';

// Example usage of VehicleHeaderMobile component
const ExampleUsage: React.FC = () => {
  // Example vehicle data
  const exampleVehicle: Vehicle = {
    _id: '1',
    make: 'Mazda',
    model: 'CX-5',
    year: 2016,
    current_mileage: 75000,
    purchase_mileage: 50000,
    created_at: '2023-01-01T00:00:00Z'
  };

  // Example mileage update handler
  const handleMileageUpdate = async (newMileage: number): Promise<void> => {
    // Simulate API call
    console.log('Updating mileage to:', newMileage);
    
    // In a real application, you would:
    // 1. Call your API to update the vehicle mileage
    // 2. Update the local state or context
    // 3. Handle any errors
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate potential error (uncomment to test error handling)
    // if (newMileage > 100000) {
    //   throw new Error('Mileage too high');
    // }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <VehicleHeaderMobile
        vehicle={exampleVehicle}
        onMileageUpdate={handleMileageUpdate}
        className="bg-white"
      />
      
      {/* Example content below the header */}
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Maintenance Status</h2>
          <p className="text-gray-600">
            Your vehicle is in good condition. Next oil change due at 80,000 km.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Recent Services</h2>
          <p className="text-gray-600">
            Last service: Oil change at 72,000 km
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage;