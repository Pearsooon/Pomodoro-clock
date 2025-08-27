import React, { useEffect, useMemo, useState } from "react";
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
import { PETS } from "@/data/pets";
import { Badge } from "@/components/ui/badge";

const EVENT_PET_UNLOCKED = "pet:unlocked";

/** Kiểm tra đã block app nào chưa (quét rộng localStorage) */
function hasAnyBlockedApps(): boolean {
  try {
    const preferred = [
      "block_apps_v1",
      "blockedApps",
      "blocklist_v1",
      "blocklist",
      "focus_block_apps",
      "blockSettings",
      "notificationBlocks",
      "blocked_notifications",
    ];
    const fields = ["apps", "blocked", "list", "items", "bundleIds", "services"];

    for (const k of preferred) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const val = JSON.parse(raw);
      if (Array.isArray(val) && val.length > 0) return true;
      if (val && typeof val === "object") {
        for (const f of fields) {
          const arr = (val as any)[f];
          if (Array.isArray(arr) && arr.length > 0) return true;
        }
      }
    }

    const re = /(block|notif|noti|mute|silenc)/i;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? "";
      if (!re.test(key)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      let val: any;
      try {
        val = JSON.parse(raw);
      } catch {
        if (raw.trim().length > 0) return true;
      }

      if (Array.isArray(val) && val.length > 0) return true;
      if (val && typeof val === "object") {
        for (const f of fields) {
          const arr = val[f];
          if (Array.isArray(arr) && arr.length > 0) return true;
        }
      }
    }
  } catch {}
  return false;
}

export const HomeTab: React.FC = () => {
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);

  // Prompt block
  const [showBlockPrompt, setShowBlockPrompt] = useState(false);

  // Queue modal unlock pet
  const [unlockedPet, setUnlockedPet] = useState<Pet | null>(null);
  const [pendingUnlockedPets, setPendingUnlockedPets] = useState<Pet[]>([]);

  // Welcome
  const [showWelcome, setShowWelcome] = useState(false);

  const { currentCompanion, setAsCompanion } = usePetCollection();

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

  const focusBuddy = useMemo(
    () => PETS.find((p) => p.id === "focus-buddy") || null,
    []
  );

  const handleStartClick = () => {
    if (isRunning) {
      setShowStopDialog(true);
      return;
    }
    if (!hasAnyBlockedApps()) {
      setShowBlockPrompt(true);
      return;
    }
    setShowCycleModal(true);
  };

  const handleStopConfirm = () => {
    stopTimer();
    setShowStopDialog(false);
  };

  // Tự đóng prompt nếu blocklist đổi ở tab khác
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (/(block|notif|noti|mute|silenc)/i.test(e.key)) {
        if (hasAnyBlockedApps()) setShowBlockPrompt(false);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Lắng nghe event mở khoá pet -> chỉ thêm vào queue
  useEffect(() => {
    const onPetUnlocked = (e: Event) => {
      const ce = e as CustomEvent<Pet>;
      if (ce?.detail) setPendingUnlockedPets((prev) => [...prev, ce.detail]);
    };
    window.addEventListener(EVENT_PET_UNLOCKED, onPetUnlocked as EventListener);
    return () =>
      window.removeEventListener(
        EVENT_PET_UNLOCKED,
        onPetUnlocked as EventListener
      );
  }, []);

  // Welcome first visit
  useEffect(() => {
    const SEEN_KEY = "welcome_seen_v1";
    const seen =
      typeof window !== "undefined" ? localStorage.getItem(SEEN_KEY) : "1";
    if (!seen) {
      setShowWelcome(true);
      localStorage.setItem(SEEN_KEY, "1");
    }
  }, []);

  const letsGo = () => {
    setAsCompanion("focus-buddy");
    setShowWelcome(false);
  };

  // Mở modal pet nếu không ở break
  useEffect(() => {
    if (phase !== "break" && !unlockedPet && pendingUnlockedPets.length > 0) {
      setUnlockedPet(pendingUnlockedPets[0]);
      setPendingUnlockedPets((prev) => prev.slice(1));
    }
  }, [phase, unlockedPet, pendingUnlockedPets]);

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
      {/* ---------- Header giống Pet Gallery ---------- */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Focus Timer</h1>
        <p className="text-muted-foreground">
          Complete Pomodoro cycles to unlock pets
        </p>
        {currentCompanion && (
          <div className="mt-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Current: {currentCompanion.name}
            </Badge>
          </div>
        )}
      </div>
      {/* --------------------------------------------- */}

      <Card
        className={cn(
          "p-8 w-full max-w-sm transition-all duration-500 shadow-lg",
          isBreakMode ? "bg-break border-break-foreground/20" : "bg-card"
        )}
      >
        {isRunning && (
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              {isBreakMode
                ? "Break Time"
                : `Cycle ${currentCycle}/${totalCycles}`}
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

      <CycleModal
        isOpen={showCycleModal}
        onClose={() => setShowCycleModal(false)}
        onStart={(cycles) => startTimer(cycles, totalMinutes)}
      />

      <Dialog
        open={showStopDialog}
        onOpenChange={(open) => !open && setShowStopDialog(false)}
      >
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] sm:w-full mx-0">
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

      <Dialog open={showBlockPrompt} onOpenChange={setShowBlockPrompt}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] sm:w-full mx-0">
          <DialogHeader>
            <DialogTitle>No blocked apps detected!</DialogTitle>
            <DialogDescription>
              Do you want to block notifications before starting your session?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-6">
            <Button
              className="flex-1 bg-[#FF6D53] text-white border-[#FF6D53] hover:bg-[#FF6D53]/90"
              onClick={() => {
                try {
                  localStorage.setItem("active_tab", "block");
                } catch {}
                try {
                  window.dispatchEvent(
                    new CustomEvent("nav:tab", { detail: "block" as const })
                  );
                } catch {}
                setShowBlockPrompt(false);
              }}
            >
              Yes
            </Button>

            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                setShowBlockPrompt(false);
                setShowCycleModal(true);
              }}
            >
              No
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showWelcome}
        onOpenChange={(open) => !open && setShowWelcome(false)}
      >
        <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] sm:w-full mx-0 [&_[aria-label='Close']]:hidden">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full animate-ping bg-blue-300/60" />
                <div className="relative w-20 h-20 rounded-full border-4 flex items-center justify-center bg-background border-blue-400">
                  <img
                    src={focusBuddy?.image || currentCompanion?.image}
                    alt="Focus Buddy"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </div>
            <DialogTitle className="text-xl">
              Meet Focus Buddy! Your first Pomodoro pet.
            </DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Start focusing with Focus Buddy and earn more pets!
            </p>
            <Button
              onClick={() => {
                setAsCompanion("focus-buddy");
                setShowWelcome(false);
              }}
              className="w-full"
            >
              Let&apos;s go
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
