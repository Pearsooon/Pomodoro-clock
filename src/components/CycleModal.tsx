import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (cycles: number) => void;
}

export const CycleModal: React.FC<CycleModalProps> = ({
  isOpen,
  onClose,
  onStart
}) => {
  const [cycles, setCycles] = useState([1]);

  const handleContinue = () => {
    onStart(cycles[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] sm:w-full mx-0">
        <DialogHeader>
          <DialogTitle className="text-center">
            How many pomodoro cycles would you like to run?
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {cycles[0]} {cycles[0] === 1 ? 'cycle' : 'cycles'}
            </div>
          </div>

          <div className="px-4">
            <Slider
              value={cycles}
              onValueChange={setCycles}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />

            {/* Vạch chia 1–10 (căn thẳng với track) */}
            <div className="mt-3">
              {/* thanh tick */}
              <div className="grid grid-cols-10 gap-0">
                {Array.from({ length: 10 }).map((_, i) => {
                  const major = i === 0 || i === 4 || i === 9; // 1,5,10 đậm hơn
                  return (
                    <div key={i} className="flex justify-center">
                      <div
                        className={
                          major
                            ? "w-[3px] h-3.5 bg-border opacity-95 rounded-full"
                            : "w-[2px] h-3 bg-border opacity-90 rounded-full"
                        }
                      />
                    </div>
                  );
                })}
              </div>
              {/* nhãn số */}
              <div className="grid grid-cols-10 text-[11px] text-foreground/70 mt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="text-center">{i + 1}</div>
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={handleContinue}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
