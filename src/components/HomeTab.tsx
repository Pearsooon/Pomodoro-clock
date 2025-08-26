import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CircularTimer } from "@/components/CircularTimer";
import { CycleModal } from "@/components/CycleModal";
import { PetUnlockModal } from "@/components/PetUnlockModal";
import { usePomodoro } from "@/hooks/usePomodoro";
import { usePetCollection } from "@/hooks/usePetCollection";
import { cn } from "@/lib/utils";
import type { Pet } from "@/types/pet";

const EVENT_PET_UNLOCKED = "pet:unlocked";

export const HomeTab: React.FC = () => {
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [unlockedPet, setUnlockedPet] = useState<Pet | null>(null);

  const { currentCompanion, checkForNewPetUnlocks, setAsCompanion } =
    usePetCollection();

  const {
    minutes,
    seconds,
    totalMinutes,
    isRunning,
    isBreakMode,
    currentCycle,
    totalCycles,
    phase, // 'idle' | 'work' | 'break' | 'completed'
    startTimer,
    stopTimer,
    setWorkMinutes,
  } = usePomodoro();

  const handleStartClick = () => {
    if (isRunning) setShowStopDialog(true);
    else setShowCycleModal(true);
  };

  const handleStopConfirm = () => {
    stopTimer();
    setShowStopDialog(false);
  };

  // ── Listen global "pet:unlocked" event to always open modal
  useEffect(() => {
    const onPetUnlocked = (e: Event) => {
      const ce = e as CustomEvent<Pet>;
      if (ce?.detail) setUnlockedPet(ce.detail);
    };
    window.addEventListener(EVENT_PET_UNLOCKED, onPetUnlocked as EventListener);
    return () =>
      window.removeEventListener(
        EVENT_PET_UNLOCKED,
        onPetUnlocked as EventListener
      );
  }, []);

  // ── Detect end-of-work-phase (work -> break | completed)
  const prevPhase = useRef(phase);
  useEffect(() => {
    const endedWork =
      prevPhase.current === "work" &&
      (phase === "break" || phase === "completed");

    if (endedWork) {
      // các số liệu tối thiểu để tính drop
      const cyclesDone = currentCycle; // số cycle đã hoàn thành đến thời điểm này
      const currentStreak = 0; // TODO: thay nếu có cơ chế streak
      const focusMinutes = totalMinutes; // độ dài phiên work vừa xong
      const level = 1; // TODO: level thực tế nếu có

      // Gọi đúng chữ ký (object)
      const newPets = checkForNewPetUnlocks({
        totalCycles: cyclesDone,
        currentStreak,
        totalFocusMinutes: focusMinutes,
        level,
      });

      if (newPets && newPets.length > 0) {
        // Mở modal ngay cả khi event vì lý do nào đó không catch
        setUnlockedPet(newPets[0]);
      }
    }
    prevPhase.current = phase;
  }, [phase, currentCycle, totalMinutes, checkForNewPetUnlocks]);

  const formatTime = useMemo(
    () => (m: number, s: number) =>
      `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
    []
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6 space-y-8">
      <Card
        className={cn(
          "p-8 w-full max-w-sm transition-all duration-500 shadow-lg",
          isBreakMode ? "bg-break border-break-foreground/20" : "bg-card"
        )}
      >
        {isRunning && (
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              {isBreakMode ? "Break Time" : `Cycle ${currentCycle}/${totalCycles}`}
            </span>
          </div>
        )}

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
          {isRunning ? "Stop" : "Start"}
        </Button>
      </Card>

      {/* Cycle selection */}
      <CycleModal
        isOpen={showCycleModal}
        onClose={() => setShowCycleModal(false)}
        onStart={(cycles) => startTimer(cycles, totalMinutes)}
      />

      {/* Stop confirm */}
      <Dialog open={showStopDialog} onOpenChange={(open) => !open && setShowStopDialog(false)}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Stop Session?</DialogTitle>
            <DialogDescription>If you exit, data will not be saved.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowStopDialog(false)}
              className="flex-1"
            >
              Continue
            </Button>
            <Button variant="destructive" onClick={handleStopConfirm} className="flex-1">
              Stop
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pet unlock modal */}
      <PetUnlockModal
        pet={unlockedPet}
        isOpen={!!unlockedPet}
        onClose={() => setUnlockedPet(null)}
        onSetAsCompanion={setAsCompanion}
        isUnlocked={true}
      />
    </div>
  );
};
