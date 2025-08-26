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

  // Modal đang hiển thị 1 pet
  const [unlockedPet, setUnlockedPet] = useState<Pet | null>(null);
  // Hàng chờ pet mở khóa (không bật modal nếu đang break)
  const [pendingUnlockedPets, setPendingUnlockedPets] = useState<Pet[]>([]);

  // ✅ Popup chào mừng đầu vào
  const [showWelcome, setShowWelcome] = useState(false);

  const { currentCompanion, checkForNewPetUnlocks, setAsCompanion, awardSessionXP } =
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

  // ⛳ Lắng nghe sự kiện mở khóa pet → CHỈ thêm vào queue (không mở modal ngay)
  useEffect(() => {
    const onPetUnlocked = (e: Event) => {
      const ce = e as CustomEvent<Pet>;
      if (ce?.detail) {
        setPendingUnlockedPets((prev) => [...prev, ce.detail]);
      }
    };
    window.addEventListener(EVENT_PET_UNLOCKED, onPetUnlocked as EventListener);
    return () =>
      window.removeEventListener(
        EVENT_PET_UNLOCKED,
        onPetUnlocked as EventListener
      );
  }, []);

  // ✅ Hiện popup chào mừng khi lần đầu vào trang
  useEffect(() => {
    const SEEN_KEY = "welcome_seen_v1";
    const seen = typeof window !== "undefined" ? localStorage.getItem(SEEN_KEY) : "1";
    if (!seen) {
      setShowWelcome(true);
      localStorage.setItem(SEEN_KEY, "1");
    }
  }, []);

  const closeWelcome = () => setShowWelcome(false);
  const setFocusBuddyAndCloseWelcome = () => {
    // ID mặc định của pet đầu tiên là 'focus-buddy'
    setAsCompanion("focus-buddy");
    setShowWelcome(false);
  };

  // Phát hiện chuyển pha
  const prevPhase = useRef(phase);
  useEffect(() => {
    const endedWork =
      prevPhase.current === "work" &&
      (phase === "break" || phase === "completed");

    if (endedWork) {
      // Gọi logic rơi pet nhưng KHÔNG mở modal tại đây
      const cyclesDone = currentCycle;
      const currentStreak = 0;
      const focusMinutes = totalMinutes;
      const level = 1;

      checkForNewPetUnlocks({
        totalCycles: cyclesDone,
        currentStreak,
        totalFocusMinutes: focusMinutes,
        level,
      });
    }

    // Cộng XP khi hoàn tất toàn bộ buổi học
    if (prevPhase.current === "work" && phase === "completed") {
      const xp = awardSessionXP(totalMinutes, totalCycles);
      console.log(
        `[XP] +${xp} XP to companion for session: ${totalMinutes}m × ${totalCycles} cycles`
      );
    }

    prevPhase.current = phase;
  }, [
    phase,
    currentCycle,
    totalMinutes,
    totalCycles,
    checkForNewPetUnlocks,
    awardSessionXP,
  ]);

  // Khi KHÔNG ở break (tức break vừa xong hoặc đã completed) → nếu có queue & chưa mở modal → bật modal
  useEffect(() => {
    const notInBreak = phase !== "break";
    if (notInBreak && !unlockedPet && pendingUnlockedPets.length > 0) {
      setUnlockedPet(pendingUnlockedPets[0]);
      setPendingUnlockedPets((prev) => prev.slice(1));
    }
  }, [phase, unlockedPet, pendingUnlockedPets]);

  // Đóng modal pet unlock: nếu còn queue & không ở break → mở tiếp; ngược lại đóng hẳn
  const handleCloseUnlockedModal = () => {
    if (phase !== "break" && pendingUnlockedPets.length > 0) {
      setUnlockedPet(pendingUnlockedPets[0]);
      setPendingUnlockedPets((prev) => prev.slice(1));
    } else {
      setUnlockedPet(null);
    }
  };

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
        </div>

        {/* Start/Stop button: Start = cam; Stop = nền đỏ chữ trắng */}
        <Button
          onClick={handleStartClick}
          className={cn(
            "w-full py-3 text-lg font-medium rounded-full transition-all duration-200 border-2",
            isRunning
              ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-destructive"
              : "bg-[#FF6D53] text-white border-[#FF6D53] hover:bg-[#FF6D53]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF6D53]"
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
      <Dialog
        open={showStopDialog}
        onOpenChange={(open) => !open && setShowStopDialog(false)}
      >
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Stop Session?</DialogTitle>
            <DialogDescription>
              If you exit, data will not be saved.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* ✅ Welcome dialog khi mới vào trang */}
      <Dialog
        open={showWelcome}
        onOpenChange={(open) => {
          if (!open) closeWelcome();
        }}
      >
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-blue-300/60" />
                <div className="relative w-20 h-20 rounded-full border-4 flex items-center justify-center bg-background border-blue-400">
                  <img
                    src={currentCompanion?.image}
                    alt="Focus Buddy"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </div>
            <DialogTitle className="text-xl">Meet Focus Buddy! Your first Pomodoro pet.</DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Start focusing with Focus Buddy and earn more pets!
            </p>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={closeWelcome} className="flex-1">
                View Later
              </Button>
              <Button onClick={setFocusBuddyAndCloseWelcome} className="flex-1">
                Set as Companion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pet unlock modal (sau break mới hiện) */}
      <PetUnlockModal
        pet={unlockedPet}
        isOpen={!!unlockedPet}
        onClose={handleCloseUnlockedModal}
        onSetAsCompanion={setAsCompanion}
        isUnlocked={true}
      />
    </div>
  );
};
