import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CircularTimer } from '@/components/CircularTimer';
import { CycleModal } from '@/components/CycleModal';
import { PetUnlockModal } from '@/components/PetUnlockModal';
import { usePomodoro } from '@/hooks/usePomodoro';
import { usePetCollection } from '@/hooks/usePetCollection';
import { cn } from '@/lib/utils';

export const HomeTab: React.FC = () => {
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [newUnlockedPet, setNewUnlockedPet] = useState<any>(null);
  
  const { currentCompanion, checkForNewPetUnlocks, setAsCompanion } = usePetCollection();
  
  const {
    minutes,
    seconds,
    totalMinutes,
    isRunning,
    isBreakMode,
    currentCycle,
    totalCycles,
    phase,
    startTimer,
    stopTimer,
    setWorkMinutes
  } = usePomodoro();

  const handleStartClick = () => {
    if (isRunning) {
      setShowStopDialog(true);
    } else {
      setShowCycleModal(true);
    }
  };

  const handleStopConfirm = () => {
    stopTimer();
    setShowStopDialog(false);
  };

  // Check for pet unlocks when session completes
  React.useEffect(() => {
    if (phase === 'completed') {
      // Mock stats for demonstration
      const totalCycles = 47;
      const currentStreak = 8;
      const totalFocusMinutes = Math.floor(totalCycles * 25);
      const level = 5;
      
      const newPets = checkForNewPetUnlocks(totalCycles, currentStreak, totalFocusMinutes, level);
      if (newPets.length > 0) {
        setNewUnlockedPet(newPets[0]); // Show first unlocked pet
      }
    }
  }, [phase, checkForNewPetUnlocks]);

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6 space-y-8">
      <Card 
        className={cn(
          "p-8 w-full max-w-sm transition-all duration-500 shadow-lg",
          isBreakMode ? "bg-break border-break-foreground/20" : "bg-card"
        )}
      >
        {/* Current cycle indicator */}
        {isRunning && (
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              {isBreakMode ? 'Break Time' : `Cycle ${currentCycle}/${totalCycles}`}
            </span>
          </div>
        )}
        
        {/* Circular timer with pet */}
        <div className="flex justify-center mb-6">
          <CircularTimer
            minutes={minutes}
            seconds={seconds}
            totalMinutes={totalMinutes}
            isRunning={isRunning}
            isBreakMode={isBreakMode}
            onMinutesChange={setWorkMinutes}
            petImage={currentCompanion?.image}
            sleepImage={currentCompanion?.sleepImage}
          />
        </div>
        
        {/* Time display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-foreground mb-2">
            {formatTime(minutes, seconds)}
          </div>
          {isBreakMode && (
            <div className="text-break-foreground font-medium">
              Break – {formatTime(minutes, seconds)}
            </div>
          )}
        </div>
        
        {/* Action button */}
        <Button
          onClick={handleStartClick}
          variant={isRunning ? "destructive" : "default"}
          className={cn(
            "w-full py-3 text-lg font-medium rounded-full transition-all duration-200",
            isRunning 
              ? "border-2 border-destructive text-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground" 
              : "border-2 border-success text-success bg-transparent hover:bg-success hover:text-success-foreground"
          )}
        >
          {isRunning ? 'Stop' : 'Start'}
        </Button>
      </Card>

      {/* Cycle selection modal */}
      <CycleModal
        isOpen={showCycleModal}
        onClose={() => setShowCycleModal(false)}
        onStart={(cycles) => startTimer(cycles, totalMinutes)}
      />

      {/* Stop confirmation dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Stop Session?</DialogTitle>
            <DialogDescription>
              If you exit, data will not be saved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowStopDialog(false)}
              className="flex-1"
            >
              Continue
            </Button>
            <Button
              variant="destructive"
              onClick={handleStopConfirm}
              className="flex-1"
            >
              Stop
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pet unlock modal */}
      <PetUnlockModal
        pet={newUnlockedPet}
        isOpen={!!newUnlockedPet}
        onClose={() => setNewUnlockedPet(null)}
        onSetAsCompanion={setAsCompanion}
      />
    </div>
  );
};