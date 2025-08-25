import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import petAwake from '@/assets/pet-awake.png';
import petSleeping from '@/assets/pet-sleeping.png';

interface CircularTimerProps {
  minutes: number;
  seconds: number;
  totalMinutes: number;
  isRunning: boolean;
  isBreakMode: boolean;
  onMinutesChange: (minutes: number) => void;
  className?: string;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  minutes,
  seconds,
  totalMinutes,
  isRunning,
  isBreakMode,
  onMinutesChange,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const radius = 120;
  const strokeWidth = 8;
  const center = radius + strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate progress for the timer ring
  const totalSeconds = totalMinutes * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = isRunning ? (totalSeconds - currentSeconds) / totalSeconds : 0;
  const strokeDashoffset = circumference - (progress * circumference);
  
  // Calculate knob position for setting minutes
  const knobAngle = ((totalMinutes - 1) / 59) * 2 * Math.PI - Math.PI / 2;
  const knobX = center + radius * Math.cos(knobAngle);
  const knobY = center + radius * Math.sin(knobAngle);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isRunning) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [isRunning]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isRunning || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const normalizedAngle = ((angle + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const newMinutes = Math.round((normalizedAngle / (2 * Math.PI)) * 59) + 1;
    
    onMinutesChange(Math.max(1, Math.min(60, newMinutes)));
  }, [isDragging, isRunning, onMinutesChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerUp]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        width={center * 2}
        height={center * 2}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isBreakMode ? "hsl(var(--break-foreground))" : "hsl(var(--primary))"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
        
        {/* Draggable knob */}
        {!isRunning && (
          <circle
            cx={knobX}
            cy={knobY}
            r={16}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={3}
            className="cursor-pointer hover:scale-110 transition-transform shadow-lg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
          />
        )}
      </svg>
      
      {/* Pet in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={isBreakMode ? petSleeping : petAwake}
          alt={isBreakMode ? "Sleeping pet" : "Awake pet"}
          className="w-24 h-24 object-contain transition-all duration-500"
        />
      </div>
    </div>
  );
};