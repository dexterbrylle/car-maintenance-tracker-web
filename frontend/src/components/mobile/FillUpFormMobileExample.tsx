import React, { useState } from 'react';
import { FillUpFormMobile } from './FillUpFormMobile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface FillUpFormMobileExampleProps {
  vehicleId: string;
}

export const FillUpFormMobileExample: React.FC<FillUpFormMobileExampleProps> = ({
  vehicleId
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    // You could add a success toast here
    console.log('Fill-up recorded successfully!');
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-6 h-6 mr-2" />
          Add Fill-up
        </Button>
      </DialogTrigger>
      
      <DialogContent className="p-0 max-w-full w-full h-full max-h-full rounded-none">
        <FillUpFormMobile
          vehicleId={vehicleId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FillUpFormMobileExample;