import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePetCollection } from '@/hooks/usePetCollection';
import { PETS } from '@/data/pets';

const SETTINGS_KEY = 'appSettings';

export interface PomodoroState {
  minutes: number;
  seconds: number;
  /** tổng phút của PHASE hiện tại (work/break) để vẽ progress đúng */
  totalMinutes: number;
  /** độ dài work được chọn khi Start – cố định trong suốt phiên */
  workLength: number;
  /** độ dài break đọc từ Settings */
  breakLength: number;

  isRunning: boolean;
  isBreakMode: boolean;
  currentCycle: number;
  totalCycles: number;
  phase: 'idle' | 'work' | 'break' | 'completed';
}

/** đọc Break (min) từ localStorage Settings */
function readBreakLen(): number {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return 5;
    const parsed = JSON.parse(raw);
    const v = Number(parsed?.shortBreakLength);
    return Number.isFinite(v) && v > 0 ? Math.min(60, Math.max(1, v)) : 5;
  } catch {
    return 5;
  }
}

/** hàm random rơi pet dựa trên độ dài work (phút).
 *  Bạn có thể thay rule này cho khớp yêu cầu:
 *  - baseChance = (workMinutes / 60) * (dropChance trong PETS)
 *  - chỉ rơi pet chưa sở hữu
 */
function pickDroppedPetId(workMinutes: number, isUnlocked: (id: string) => boolean): string | null {
  const eligible = PETS.filter(p => !isUnlocked(p.id));
  if (eligible.length === 0) return null;

  // Tính trọng số cho từng pet
  const weights = eligible.map(p => {
    const base = (p.dropChance ?? 0.1);                // mặc định 10% nếu không có
    const lengthFactor = Math.min(1, Math.max(0, workMinutes / 60)); // dài hơn => cơ hội cao hơn
    // Bạn có thể thêm bonus theo rarity nếu muốn
    return Math.max(0, base * (0.5 + 0.5 * lengthFactor)); // kẹp [0..1], soft bonus
  });

  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return null;

  // Roulette wheel selection
  let r = Math.random() * sum;
  for (let i = 0; i < eligible.length; i++) {
    if ((r -= weights[i]) <= 0) return eligible[i].id;
  }
  return eligible[eligible.length - 1].id;
}

export const usePomodoro = () => {
  const { toast } = useToast();
  const { unlockPet, isPetUnlocked } = usePetCollection(); // ⬅️ dùng hook pet collection
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Để UI mở modal PetUnlockModal
  const [recentUnlockedPetId, setRecentUnlockedPetId] = useState<string | null>(null);

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
    phase: 'idle',
  });

  // Khi người dùng quay lại tab Settings và đổi Break rồi trở lại → cập nhật
  useEffect(() => {
    const onFocus = () => setState(prev => ({ ...prev, breakLength: readBreakLen() }));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const startTimer = useCallback((cycles: number, workMinutes: number) => {
    const breakLen = readBreakLen();

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentCycle: 1,
      totalCycles: Math.max(1, cycles),
      minutes: workMinutes,
      seconds: 0,
      totalMinutes: workMinutes, // phase = work
      workLength: workMinutes,
      breakLength: breakLen,
      phase: 'work',
      isBreakMode: false,
    }));

    toast({
      title: 'Focus time started! 🍅',
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
      minutes: prev.workLength,
      seconds: 0,
      totalMinutes: prev.workLength,
      isBreakMode: false,
    }));

    toast({
      title: 'Session stopped',
      description: 'Data will not be saved',
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

  // Timer countdown + chuyển phase + drop pet
  useEffect(() => {
    if (!state.isRunning) return;

    intervalRef.current = setInterval(() => {
      setState(prev => {
        // Hết thời gian phase hiện tại
        if (prev.minutes === 0 && prev.seconds === 0) {
          // Kết thúc WORK → luôn vào BREAK, đồng thời thử drop pet
          if (prev.phase === 'work') {
            // thử drop pet dựa vào workLength (hoặc prev.totalMinutes)
            const droppedId = pickDroppedPetId(prev.workLength, isPetUnlocked);
            if (droppedId) {
              unlockPet(droppedId);
              setRecentUnlockedPetId(droppedId); // để UI show modal
            }

            const b = prev.breakLength || 5;
            toast({
              title: 'Break time! 😴',
              description: `Take a ${b}-minute break`,
            });
            return {
              ...prev,
              phase: 'break',
              isBreakMode: true,
              minutes: b,
              seconds: 0,
              totalMinutes: b,
            };
          }

          // Kết thúc BREAK → nếu là cycle cuối thì completed, ngược lại sang WORK kế
          const isLast = prev.currentCycle >= prev.totalCycles;
          if (isLast) {
            toast({
              title: '🎉 All cycles completed!',
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRunning, toast, isPetUnlocked, unlockPet]);

  /** UI có thể dùng `recentUnlockedPetId` để mở PetUnlockModal rồi gọi clear */
  const clearRecentUnlocked = useCallback(() => setRecentUnlockedPetId(null), []);

  return {
    // state
    ...state,
    // actions
    startTimer,
    stopTimer,
    setWorkMinutes,
    // pet unlock modal support
    recentUnlockedPetId,
    clearRecentUnlocked,
  };
};
