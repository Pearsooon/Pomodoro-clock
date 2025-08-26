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

  // ===== Time / progress
  const selectedMin = Math.max(0, Math.min(59, totalMinutes));
  const totalSeconds = Math.max(1, selectedMin * 60); // tránh chia 0
  const currentSeconds = Math.max(0, minutes * 60 + seconds);

  // ===== Convert pointer -> minute in [0..59], 12 o'clock = 0, clockwise
  const clientToMinute = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return selectedMin;

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const angle = Math.atan2(clientY - cy, clientX - cx); // [-PI, PI], 0 tại +X
    let a = angle + Math.PI / 2;                          // dịch để TOP = 0
    if (a < 0) a += 2 * Math.PI;                          // [0, 2PI)
    const m = Math.floor((a / (2 * Math.PI)) * 60);       // snap xuống để bớt rung
    return Math.min(59, Math.max(0, m));
  }, [selectedMin]);

  // ===== Drag handlers
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
    onMinutesChange(clientToMinute(e.clientX, e.clientY)); // nhảy tới điểm click
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || isRunning) return;
    onMinutesChange(clientToMinute(e.clientX, e.clientY));
  };

  // ===== Angles & arc lengths
  const angleFromMinute = (m: number) => (m / 60) * 2 * Math.PI - Math.PI / 2;

  // Vệt xanh khi chưa chạy: từ 12h -> vị trí knob
  const selectedFrac = selectedMin / 60;                          // 0..1
  const selectedLen = selectedFrac * circumference;

  // Vệt đỏ khi đang chạy: co dần từ độ dài đã chọn về 0
  const remainFrac = selectedFrac * (currentSeconds / totalSeconds);
  const remainLen = remainFrac * circumference;

  // Vị trí knob:
  // - Khi chưa chạy: ở vị trí đã chọn (selectedMin)
  // - Khi chạy: chạy cùng đầu vệt đỏ (tức là phần còn lại)
  const knobMinute = isRunning
    ? Math.round(selectedMin * (currentSeconds / totalSeconds))
    : selectedMin;

  const knobAngle = angleFromMinute(knobMinute);
  const knobX = center + radius * Math.cos(knobAngle);
  const knobY = center + radius * Math.sin(knobAngle);

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
        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const tickAngle = (i / 60) * 2 * Math.PI - Math.PI / 2;
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

        {/* Vệt xanh (selection) – KHÔNG transition để kéo mượt */}
        {!isRunning && (
          <g transform={`rotate(-90 ${center} ${center})`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="hsl(var(--success))"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${selectedLen} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Vệt đỏ (progress) – khi chạy */}
        {isRunning && (
          <g transform={`rotate(-90 ${center} ${center})`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isBreakMode ? "hsl(var(--break-foreground))" : "hsl(var(--destructive))"}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${remainLen} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              // giảm delay mỗi giây (nhanh hơn trước)
              className="transition-all duration-300 ease-linear"
            />
          </g>
        )}

        {/* Vòng "hit" để kéo dễ hơn (chỉ khi không chạy) */}
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

        {/* Knob luôn hiển thị.
            - Khi chạy: chỉ là marker (pointerEvents=none)
            - Khi dừng: vẫn pointerEvents=none (drag đã bắt ở ring) => không giật */}
        <circle
          cx={knobX}
          cy={knobY}
          r={16}
          fill="hsl(var(--primary))"
          stroke="white"
          strokeWidth={3}
          className={cn("shadow-lg", isRunning ? "" : "")}
          pointerEvents="none"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}
        />
      </svg>

      {/* Pet ở giữa */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src={petSrc}
          alt={isBreakMode ? "Sleeping pet" : "Awake pet"}
          className="w-24 h-24 object-contain pointer-events-none"
        />
      </div>
    </div>
  );
};
