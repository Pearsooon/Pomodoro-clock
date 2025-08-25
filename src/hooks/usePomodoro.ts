import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const SETTINGS_KEY = 'appSettings';

export interface PomodoroState {
  minutes: number;
  seconds: number;
  /** tổng phút của PHASE hiện tại (work hoặc break) để tính progress/ngăn đổi khi đang chạy */
  totalMinutes: number;
  /** độ dài work (đã chọn trước khi start) – luôn giữ nguyên suốt phiên */
  workLength: number;
  /** độ dài break (đọc từ Settings) */
  breakLength: number;

  isRunning: boolean;
  isBreakMode: boolean;
  currentCycle: number;
  totalCycles: number;
  phase: 'idle' | 'work' | 'break' | 'completed';
}

export const usePomodoro = () => {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // đọc breakLength từ localStorage
  const readBreakLen = () => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return 5;
      const parsed = JSON.parse(raw);
      const v = Number(parsed?.shortBreakLength);
      return Number.isFinite(v) && v > 0 ? Math.min(60, Math.max(1, v)) : 5;
    } catch {
      return 5;
    }
  };

  const [state, setState] = useState<PomodoroState>({
    minutes: 25,
    seconds: 0,
    totalMinutes: 25,     // tổng phút của phase hiện tại (ban đầu = work)
    workLength: 25,       // sẽ cập nhật khi Start
    breakLength: readBreakLen(),
    isRunning: false,
    isBreakMode: false,
    currentCycle: 0,
    totalCycles: 1,
    phase: 'idle',
  });

  // nếu user đổi setting Break rồi quay lại màn hình, cập nhật breakLength
  useEffect(() => {
    const onFocus = () => {
      setState(prev => ({ ...prev, breakLength: readBreakLen() }));
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const startTimer = useCallback((cycles: number, workMinutes: number) => {
    const breakLen = (() => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? (JSON.parse(raw)?.shortBreakLength ?? 5) : 5;
      } catch { return 5; }
    })();

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentCycle: 1,
      totalCycles: Math.max(1, cycles),
      minutes: workMinutes,
      seconds: 0,
      totalMinutes: workMinutes, // phase = work → tổng phút = work
      workLength: workMinutes,
      breakLength: Number(breakLen) || 5,
      phase: 'work',
      isBreakMode: false,
    }));

    toast({
      title: "Focus time started! 🍅",
      description: `Beginning cycle 1 of ${Math.max(1, cycles)}`,
    });
  }, [toast]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      phase: 'idle',
      currentCycle: 0,
      minutes: prev.workLength,      // quay về work length đã chọn
      seconds: 0,
      totalMinutes: prev.workLength, // tổng phút hiển thị về work
      isBreakMode: false,
    }));

    toast({
      title: "Session stopped",
      description: "Data will not be saved",
    });
  }, [toast]);

  // Cho phép đổi work length khi chưa chạy
  const setWorkMinutes = useCallback((m: number) => {
    setState(prev => ({
      ...prev,
      workLength: m,
      totalMinutes: prev.isRunning ? prev.totalMinutes : m,
      minutes: prev.isRunning ? prev.minutes : m,
    }));
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!state.isRunning) return;

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.minutes === 0 && prev.seconds === 0) {
          // ===== phase finished
          if (prev.phase === 'work') {
            // luôn vào BREAK, kể cả là cycle cuối
            const nextBreak = prev.breakLength || 5;
            toast({
              title: "Break time! 😴",
              description: `Take a ${nextBreak}-minute break`,
            });
            return {
              ...prev,
              phase: 'break',
              isBreakMode: true,
              minutes: nextBreak,
              seconds: 0,
              totalMinutes: nextBreak,   // tổng phút của phase break
            };
          } else {
            // break finished
            const isLastCycle = prev.currentCycle >= prev.totalCycles;
            if (isLastCycle) {
              toast({
                title: "🎉 All cycles completed!",
                description: "Great work! You've finished your Pomodoro session.",
              });
              return {
                ...prev,
                isRunning: false,
                phase: 'completed',
                isBreakMode: false,
                minutes: prev.workLength,
                seconds: 0,
                totalMinutes: prev.workLength,
              };
            } else {
              const nextCycle = prev.currentCycle + 1;
              toast({
                title: `Starting cycle ${nextCycle} 🍅`,
                description: `Focus time for cycle ${nextCycle} of ${prev.totalCycles}`,
              });
              return {
                ...prev,
                phase: 'work',
                isBreakMode: false,
                currentCycle: nextCycle,
                minutes: prev.workLength,
                seconds: 0,
                totalMinutes: prev.workLength, // trả về tổng phút work
              };
            }
          }
        }

        // ===== still counting
        if (prev.seconds === 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
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
