import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import petAwake from "@/assets/pet-awake.png";
import petSleeping from "@/assets/pet-sleeping.png";

interface CircularTimerProps {
  minutes: number;        // minutes remaining (for progress)
  seconds: number;        // seconds remaining (for progress)
  totalMinutes: number;   // SELECTED length, now 0..59
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
  const totalSeconds = Math.max(1, (totalMinutes + 1) * 60); // nếu bạn coi 0=1p thì bỏ +1
  const currentSeconds = Math.max(0, minutes * 60 + seconds);
  const progress = isRunning ? (totalSeconds - currentSeconds) / totalSeconds : 0;
  const dashOffset = circumference - progress * circumference;

  // ⭐ Convert pointer -> minute in [0..59], 12 o'clock = 0, clockwise
  const clientToMinute = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return totalMinutes;

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const angle = Math.atan2(clientY - cy, clientX - cx); // [-PI,PI], 0 at +X
    let a = angle + Math.PI / 2;                          // shift so TOP=0
    if (a < 0) a += 2 * Math.PI;                          // [0,2PI)
    // Map [0,2PI) -> [0..59]
    const m = Math.round((a / (2 * Math.PI)) * 59);
    return Math.min(59, Math.max(0, m));
  }, [totalMinutes]);

  // ===== Drag handlers =====
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging || isRunning) return;
      onMinutesChange(clientToMinute(e.clientX, e.clientY)); // ⭐ luôn chiếu lên vòng bằng góc
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
    onMinutesChange(clientToMinute(e.clientX, e.clientY));
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || isRunning) return;
    onMinutesChange(clientToMinute(e.clientX, e.clientY));
  };

  // ⭐ Knob exactly on circle from minute -> angle (12h start, clockwise)
  const angleFromMinute = (m: number) => (m / 59) * 2 * Math.PI - Math.PI / 2;
  const a = angleFromMinute(totalMinutes);
  const knobX = center + radius * Math.cos(a);
  const knobY = center + radius * Math.sin(a);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        width={center * 2}
        height={center * 2}
        // ❌ bỏ -rotate-90 để không xoay hệ trục
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ touchAction: "none" }}
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
        {/* Progress ring; nếu muốn start tại 12h, xoay riêng vòng progress */}
        <g transform={`rotate(-90 ${center} ${center})`}> {/* ⭐ xoay chỉ stroke hiển thị */}
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

        {/* (Optional) invisible hit ring cho dễ kéo */}
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

        {/* Knob (luôn nằm đúng bán kính) */}
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

      {/* Pet ở giữa không chặn sự kiện */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src={isBreakMode ? (sleepImage || petSleeping) : (petImage || petAwake)}
          alt={isBreakMode ? "Sleeping pet" : "Awake pet"}
          className="w-24 h-24 object-contain transition-all duration-500 pointer-events-none"
        />
      </div>
    </div>
  );
};
