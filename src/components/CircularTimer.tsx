import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import petAwake from "@/assets/pet-awake.png";
import petSleeping from "@/assets/pet-sleeping.png";

interface CircularTimerProps {
  minutes: number;        // minutes remaining (for progress)
  seconds: number;        // seconds remaining (for progress)
  totalMinutes: number;   // selected work length (1..60)
  isRunning: boolean;
  isBreakMode: boolean;
  onMinutesChange: (m: number) => void; // update totalMinutes (1..60)
  className?: string;
  petImage?: string;
  sleepImage?: string;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  minutes,
  seconds,
  totalMinutes,
  isRunning,
  isBreakMode,
  onMinutesChange,
  className,
  petImage,
  sleepImage,
}) => {
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const radius = 120;
  const strokeWidth = 8;
  const center = radius + strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const petSrc = isBreakMode ? (sleepImage || petSleeping) : (petImage || petAwake);

  // ===== Progress ring (only when running) =====
  const totalSeconds = Math.max(1, totalMinutes * 60);
  const currentSeconds = Math.max(0, minutes * 60 + seconds);
  const progress = isRunning ? (totalSeconds - currentSeconds) / totalSeconds : 0;
  const dashOffset = circumference - progress * circumference;

  // ===== Helper: convert (clientX, clientY) -> minutes (1..60) =====
  const clientToMinutes = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return totalMinutes;

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // angle in radians with 0 at +X axis; we want 0 at TOP and clockwise
    const angle = Math.atan2(clientY - cy, clientX - cx); // [-PI, PI], 0 at +X
    let a = angle + Math.PI / 2;                          // shift so TOP = 0
    if (a < 0) a += 2 * Math.PI;                          // [0, 2PI)
    // map [0, 2PI) -> [1..60]
    const m = Math.round((a / (2 * Math.PI)) * 59) + 1;
    return Math.min(60, Math.max(1, m));
  }, [totalMinutes]);

  // ===== Drag handlers on window (robust) =====
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging || isRunning) return;
      onMinutesChange(clientToMinutes(e.clientX, e.clientY));
    };
    const up = () => setDragging(false);

    if (dragging) {
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once: true });
    }
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, isRunning, clientToMinutes, onMinutesChange]);

  // Start dragging from anywhere on the SVG (ring or knob)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    // set immediately to the point clicked
    onMinutesChange(clientToMinutes(e.clientX, e.clientY));
    setDragging(true);
  };

  // Also support move while pointer is captured on the SVG itself
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || isRunning) return;
    onMinutesChange(clientToMinutes(e.clientX, e.clientY));
  };

  // ===== Knob position from totalMinutes =====
  const angle = ((totalMinutes - 1) / 59) * 2 * Math.PI - Math.PI / 2; // top start
  const knobX = center + radius * Math.cos(angle);
  const knobY = center + radius * Math.sin(angle);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        width={center * 2}
        height={center * 2}
        className="transform -rotate-90"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ touchAction: "none" }} // prevent page scroll on touch
      >
        {/* Background ring (clickable) */}
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
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
        {/* Knob */}
        {!isRunning && (
          <circle
            cx={knobX}
            cy={knobY}
            r={16}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={3}
            className="cursor-pointer hover:scale-110 transition-transform shadow-lg"
          />
        )}
      </svg>

      {/* Pet in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={petSrc}
          alt={isBreakMode ? "Sleeping pet" : "Awake pet"}
          className="w-24 h-24 object-contain transition-all duration-500"
        />
      </div>
    </div>
  );
};
