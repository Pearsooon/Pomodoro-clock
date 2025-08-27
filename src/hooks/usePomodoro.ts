import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const SETTINGS_KEY = "appSettings";

export interface PomodoroState {
  minutes: number;
  seconds: number;
  /** tổng phút của PHASE hiện tại (work/break) */
  totalMinutes: number;
  /** độ dài work cố định trong phiên */
  workLength: number;
  /** độ dài break (có thể = 0 để bỏ break) */
  breakLength: number;

  isRunning: boolean;
  isBreakMode: boolean;
  currentCycle: number;
  totalCycles: number;
  phase: "idle" | "work" | "break" | "completed";
}

/** Đọc break (phút) từ Settings; cho phép 0 */
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
  // trong trình duyệt setInterval trả về number
  const intervalRef = useRef<number | null>(null);

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
    if (intervalRef.current !== null) {
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

  // cho phép đổi work length khi chưa chạy
  const setWorkMinutes = useCallback((m: number) => {
    setState((prev) => ({
      ...prev,
      workLength: m,
      totalMinutes: prev.isRunning ? prev.totalMinutes : m,
      minutes: prev.isRunning ? prev.minutes : m,
    }));
  }, []);

  // Timer countdown + chuyển phase (hỗ trợ break = 0)
  useEffect(() => {
    if (!state.isRunning) return;

    intervalRef.current = window.setInterval(() => {
      setState((prev) => {
        // Hết thời gian của phase hiện tại?
        if (prev.minutes === 0 && prev.seconds === 0) {
          if (prev.phase === "work") {
            const b = prev.breakLength; // KHÔNG dùng "|| 5"

            // Nếu không có break → nhảy thẳng
            if (b <= 0) {
              const isLast = prev.currentCycle >= prev.totalCycles;
              if (isLast) {
                toast({
                  title: "🎉 All cycles completed!",
                  description:
                    "Great work! You've finished your Pomodoro session.",
                });
                return {
                  ...prev,
                  isRunning: false,
                  phase: "completed",
                  isBreakMode: false,
                  minutes: prev.workLength,
                  seconds: 0,
                  totalMinutes: prev.workLength,
                };
              }
              const nextCycle = prev.currentCycle + 1;
              toast({
                title: `Starting cycle ${nextCycle} 🍅`,
                description: `Focus time for cycle ${nextCycle} of ${prev.totalCycles}`,
              });
              return {
                ...prev,
                phase: "work",
                isBreakMode: false,
                currentCycle: nextCycle,
                minutes: prev.workLength,
                seconds: 0,
                totalMinutes: prev.workLength,
              };
            }

            // Có break → vào break
            toast({
              title: "Break time! 😴",
              description: `Take a ${b}-minute break`,
            });
            return {
              ...prev,
              phase: "break",
              isBreakMode: true,
              minutes: b,
              seconds: 0,
              totalMinutes: b,
            };
          } else {
            // Kết thúc BREAK
            const isLast = prev.currentCycle >= prev.totalCycles;
            if (isLast) {
              toast({
                title: "🎉 All cycles completed!",
                description:
                  "Great work! You've finished your Pomodoro session.",
              });
              return {
                ...prev,
                isRunning: false,
                phase: "completed",
                isBreakMode: false,
                minutes: prev.workLength,
                seconds: 0,
                totalMinutes: prev.workLength,
              };
            }
            const nextCycle = prev.currentCycle + 1;
            toast({
              title: `Starting cycle ${nextCycle} 🍅`,
              description: `Focus time for cycle ${nextCycle} of ${prev.totalCycles}`,
            });
            return {
              ...prev,
              phase: "work",
              isBreakMode: false,
              currentCycle: nextCycle,
              minutes: prev.workLength,
              seconds: 0,
              totalMinutes: prev.workLength,
            };
          }
        }

        // Vẫn đang đếm
        if (prev.seconds === 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
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
