import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import petAwake from "@/assets/pet-awake.png";
import petSleeping from "@/assets/pet-sleeping.png";

interface CircularTimerProps {
  minutes: number;        // minutes remaining (for progress)
  seconds: number;        // seconds remaining (for progress)
  totalMinutes: number;   // SELECTED length: 0..59 (0 = 0 phút, 59 = 59 phút)
  isRunning: boolean;
  isBreakMode: boolean;
  onMinutesChange: (m: number) => void; // update totalMinutes (0..59)
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

  // ===== Progress ring (running only) =====
  const totalSeconds = Math.max(1, totalMinutes * 60); // nếu chọn 0 phút, progress sẽ coi như 1s để tránh chia 0
  const currentSeconds = Math.max(0, minutes * 60 + seconds);
  const progress = isRunning && totalMinutes > 0
    ? (totalSeconds - currentSeconds) / totalSeconds
    : 0;
  const dashOffset = circumference - progress * circumference;

  // ===== Convert pointer -> minute in [0..59], 12 o'clock = 0, clockwise =====
  const clientToMinute = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return totalMinutes;

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // angle in radians with 0 at +X axis
    const angle = Math.atan2(clientY - cy, clientX - cx); // [-PI, PI]
    let a = angle + Math.PI / 2;                          // shift so TOP = 0
    if (a < 0) a += 2 * Math.PI;                          // [0, 2PI)
    const m = Math.floor((a / (2 * Math.PI)) * 60);       // snap down to reduce jitter
    return Math.min(59, Math.max(0, m));
  }, [totalMinutes]);

  // ===== Drag handlers (window-level for robustness) =====
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging || isRunning) return;
      onMinutesChange(clientToMinute(e.clientX, e.clientY));
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
  }, [dragging, isRunning, clientToMinute, onMinutesChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    onMinutesChange(clientToMinute(e.clientX, e.clientY)); // jump to clicked point
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || isRunning) return;
    onMinutesChange(clientToMinute(e.clientX, e.clientY));
  };

  // ===== Knob position from minute -> angle (12h start, clockwise) =====
  const angleFromMinute = (m: number) => (m / 60) * 2 * Math.PI - Math.PI / 2;
  const a = angleFromMinute(totalMinutes);
  const knobX = center + radius * Math.cos(a);
  const knobY = center + radius * Math.sin(a);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        width={center * 2}
        height={center * 2}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ touchAction: "none" }} // prevent page scroll on touch
      >
        {/* Clock tick marks (60 ticks; every 5th is longer & thicker) */}
        {Array.from({ length: 60 }).map((_, i) => {
          const tickAngle = (i / 60) * 2 * Math.PI - Math.PI / 2; // 12h start
          const inner = i % 5 === 0 ? radius - 12 : radius - 6;
          const outer = radius;
          const x1 = center + inner * Math.cos(tickAngle);
          const y1 = center + inner * Math.sin(tickAngle);
          const x2 = center + outer * Math.cos(tickAngle);
          const y2 = center + outer * Math.sin(tickAngle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={i % 5 === 0 ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring: rotate visual only to start at 12h */}
        <g transform={`rotate(-90 ${center} ${center})`}>
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
        </g>

        {/* Invisible hit ring for easy drag/click */}
        {!isRunning && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="transparent"
            strokeWidth={40}
            pointerEvents="stroke"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          />
        )}

        {/* Knob: purely visual, does not capture events (prevents jitter) */}
        {!isRunning && (
          <circle
            cx={knobX}
            cy={knobY}
            r={16}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={3}
            className="shadow-lg"
            pointerEvents="none"
            style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}
          />
        )}
      </svg>

      {/* Pet in center (do not block pointer) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src={petSrc}
          alt={isBreakMode ? "Sleeping pet" : "Awake pet"}
          className="w-24 h-24 object-contain transition-all duration-500 pointer-events-none"
        />
      </div>
    </div>
  );
};
