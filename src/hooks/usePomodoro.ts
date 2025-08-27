import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEY = "appSettings";

export interface PomodoroState {
  minutes: number;
  seconds: number;
  totalMinutes: number;     // tổng phút của PHASE hiện tại
  workLength: number;       // độ dài work cố định trong phiên
  breakLength: number;

  isRunning: boolean;
  isBreakMode: boolean;
  currentCycle: number;
  totalCycles: number;
  phase: "idle" | "work" | "break" | "completed";
}

/** đọc Break (min) từ localStorage Settings */
function readBreakLen(): number {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return 5;
    const parsed = JSON.parse(raw);
    const v = Number(parsed?.shortBreakLength);
    if (!Number.isFinite(v)) return 5;
    return Math.min(60, Math.max(0, v)); // ⬅️ cho phép 0
  } catch {
    return 5;
  }
}


export const usePomodoro = () => {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<PomodoroState>({
    minutes: 25,
    seconds: 0,
    totalMinutes: 25,
    workLength: 25,
    breakLength: readBreakLen(),
    isRunning: false,
    isBreakMode: false,
    currentCycle: 0,
    totalCycles: 1,
    phase: "idle",
  });

  // cập nhật breakLength khi quay lại tab
  useEffect(() => {
    const onFocus = () =>
      setState((prev) => ({ ...prev, breakLength: readBreakLen() }));
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const startTimer = useCallback(
    (cycles: number, workMinutes: number) => {
      const breakLen = readBreakLen();

      setState((prev) => ({
        ...prev,
        isRunning: true,
        currentCycle: 1,
        totalCycles: Math.max(1, cycles),
        minutes: workMinutes,
        seconds: 0,
        totalMinutes: workMinutes,
        workLength: workMinutes,
        breakLength: breakLen,
        phase: "work",
        isBreakMode: false,
      }));

      toast({
        title: "Focus time started! 🍅",
        description: `Beginning cycle 1 of ${Math.max(1, cycles)}`,
      });
    },
    [toast]
  );

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRunning: false,
      phase: "idle",
      currentCycle: 0,
      minutes: prev.workLength,
      seconds: 0,
      totalMinutes: prev.workLength,
      isBreakMode: false,
    }));

    toast({
      title: "Session stopped",
      description: "Data will not be saved",
    });
  }, [toast]);

  const setWorkMinutes = useCallback((m: number) => {
    setState((prev) => ({
      ...prev,
      workLength: m,
      totalMinutes: prev.isRunning ? prev.totalMinutes : m,
      minutes: prev.isRunning ? prev.minutes : m,
    }));
  }, []);

  // Timer countdown + chuyển phase
  useEffect(() => {
    if (!state.isRunning) return;

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.phase === 'work') {
          const b = prev.breakLength; // không dùng "|| 5" nữa

          // ⬅️ nếu b = 0, bỏ qua break, nhảy tiếp
          if (b <= 0) {
            const isLast = prev.currentCycle >= prev.totalCycles;
            if (isLast) {
              toast({ title: '🎉 All cycles completed!', description: "Great work! You've finished your Pomodoro session." });
              return {
                ...prev,
                isRunning: false,
                phase: 'completed',
                isBreakMode: false,
                minutes: prev.workLength,
                seconds: 0,
                totalMinutes: prev.workLength,
              };
            }
            const nextCycle = prev.currentCycle + 1;
            toast({ title: `Starting cycle ${nextCycle} 🍅`, description: `Focus time for cycle ${nextCycle} of ${prev.totalCycles}` });
            return {
              ...prev,
              phase: 'work',
              isBreakMode: false,
              currentCycle: nextCycle,
              minutes: prev.workLength,
              seconds: 0,
              totalMinutes: prev.workLength,
            };
          }

          // b > 0: vào break như cũ
          toast({ title: 'Break time! 😴', description: `Take a ${b}-minute break` });
          return {
            ...prev,
            phase: 'break',
            isBreakMode: true,
            minutes: b,
            seconds: 0,
            totalMinutes: b,
          };
        }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, toast]);

  return {
    ...state,
    startTimer,
    stopTimer,
    setWorkMinutes,
  };
};
