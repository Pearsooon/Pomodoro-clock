import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface PomodoroState {
  minutes: number;
  seconds: number;
  totalMinutes: number;
  isRunning: boolean;
  isBreakMode: boolean;
  currentCycle: number;
  totalCycles: number;
  phase: 'idle' | 'work' | 'break' | 'completed';
}

export const usePomodoro = () => {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<PomodoroState>({
    minutes: 25,
    seconds: 0,
    totalMinutes: 25,
    isRunning: false,
    isBreakMode: false,
    currentCycle: 0,
    totalCycles: 1,
    phase: 'idle'
  });

  const startTimer = useCallback((cycles: number, workMinutes: number) => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentCycle: 1,
      totalCycles: cycles,
      minutes: workMinutes,
      seconds: 0,
      totalMinutes: workMinutes,
      phase: 'work',
      isBreakMode: false
    }));
    
    toast({
      title: "Focus time started! 🍅",
      description: `Beginning cycle 1 of ${cycles}`,
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
      minutes: prev.totalMinutes,
      seconds: 0,
      isBreakMode: false
    }));
    
    toast({
      title: "Session stopped",
      description: "Data will not be saved",
    });
  }, [toast]);

  const setWorkMinutes = useCallback((minutes: number) => {
    setState(prev => ({
      ...prev,
      totalMinutes: minutes,
      minutes: prev.isRunning ? prev.minutes : minutes
    }));
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.minutes === 0 && prev.seconds === 0) {
            // Phase completed
            if (prev.phase === 'work') {
              if (prev.currentCycle === prev.totalCycles) {
                // All cycles completed
                toast({
                  title: "🎉 All cycles completed!",
                  description: "Great work! You've finished your Pomodoro session.",
                });
                return {
                  ...prev,
                  isRunning: false,
                  phase: 'completed',
                  isBreakMode: false
                };
              } else {
                // Start break
                toast({
                  title: "Break time! 😴",
                  description: "Take a 5-minute break",
                });
                return {
                  ...prev,
                  phase: 'break',
                  isBreakMode: true,
                  minutes: 5,
                  seconds: 0,
                  totalMinutes: 5
                };
              }
            } else {
              // Break completed, start next work cycle
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
                minutes: prev.totalMinutes,
                seconds: 0
              };
            }
          } else {
            // Countdown
            if (prev.seconds === 0) {
              return {
                ...prev,
                minutes: prev.minutes - 1,
                seconds: 59
              };
            } else {
              return {
                ...prev,
                seconds: prev.seconds - 1
              };
            }
          }
        });
      }, 1000);
    }

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
    setWorkMinutes
  };
};