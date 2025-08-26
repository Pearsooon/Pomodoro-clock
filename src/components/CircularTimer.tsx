import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import petAwake from "@/assets/pet-awake.png";
import petSleeping from "@/assets/pet-sleeping.png";

interface CircularTimerProps {
  minutes: number;        // phút còn lại (để hiển thị khi đang chạy)
  seconds: number;        // giây còn lại
  totalMinutes: number;   // độ dài phiên làm việc đã chọn (1..60)
  isRunning: boolean;
  isBreakMode: boolean;
  onMinutesChange: (m: number) => void; // update totalMinutes (1..60)
  className?: string;
  petImage?: string;
  sleepImage?: string;
}

const MAX_MINUTES = 60;

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

  // giá trị nút hiển thị (để có thể "hồi" về 0 khi start)
  const [knobValue, setKnobValue] = useState<number>(totalMinutes);

  const svgRef = useRef<SVGSVGElement>(null);

  const radius = 120;
  const strokeWidth = 8;
  const center = radius + strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const petSrc = isBreakMode ? (sleepImage || petSleeping) : (petImage || petAwake);

  // ======= Progress ring (chỉ khi đang chạy) =======
  const workTotalSeconds = Math.max(1, totalMinutes * 60);
  const currentSeconds = Math.max(0, minutes * 60 + seconds);
  const progress = isRunning ? (workTotalSeconds - currentSeconds) / workTotalSeconds : 0;
  const dashOffset = circumference - progress * circumference;

  // ======= Selection arc (khi chưa chạy): vệt xanh lá giữ nguyên =======
  const selectionFraction = Math.min(1, Math.max(0, (knobValue ?? totalMinutes) / MAX_MINUTES));
  const selectionDashArray = `${selectionFraction * circumference} ${circumference}`;

  // ======= Sync knobValue theo trạng thái chạy =======
  // Khi start -> hồi nút về 0
  useEffect(() => {
    if (isRunning) {
      setKnobValue(0);
    } else {
      // khi dừng, đồng bộ với totalMinutes bên ngoài
      setKnobValue(totalMinutes);
    }
  }, [isRunning, totalMinutes]);

  // ======= Helper: convert (clientX, clientY) -> minutes (1..60) =======
  const clientToMinutes = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return totalMinutes;

      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // góc chuẩn: 0 ở +X; cần 0 ở TOP, quay thuận chiều kim đồng hồ
      const angle = Math.atan2(clientY - cy, clientX - cx); // [-PI, PI]
      let a = angle + Math.PI / 2; // chuyển 12h = 0
      if (a < 0) a += 2 * Math.PI; // [0, 2PI)

      // map [0..2PI) -> [0..59] (ở đây ta muốn 1..60, nhưng trail đẹp hơn khi nhận 0..60)
      let mFloat = (a / (2 * Math.PI)) * MAX_MINUTES; // [0..60)
      // làm tròn tới phút gần nhất
      const m = Math.round(mFloat);
      // ràng buộc 0..60 và tránh 0 trở thành 60
      const bounded = Math.min(MAX_MINUTES, Math.max(0, m));
      // chuyển về 1..60 cho state chính (nếu muốn 0..59 thì đổi tại đây)
      return bounded === 0 ? 1 : bounded; // giữ 1..60 cho logic timer
    },
    [totalMinutes]
  );

  // pointer handlers
  const onDown = (e: React.PointerEvent) => {
    if (isRunning) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const m = clientToMinutes(e.clientX, e.clientY);
    onMinutesChange(m);
    setKnobValue(m);
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging || isRunning) return;
    const m = clientToMinutes(e.clientX, e.clientY);
    onMinutesChange(m);
    setKnobValue(m);
  };
  useEffect(() => {
    const up = () => setDragging(false);
    if (dragging) window.addEventListener("pointerup", up, { once: true });
    return () => window.removeEventListener("pointerup", up);
  }, [dragging]);

  // ======= Knob position từ knobValue (khi chưa chạy) =======
  const valueForAngle = isRunning ? 0 : (knobValue ?? totalMinutes);
  const angle =
    ((valueForAngle % MAX_MINUTES) / MAX_MINUTES) * 2 * Math.PI - Math.PI / 2; // start at top
  const knobX = center + radius * Math.cos(angle);
  const knobY = center + radius * Math.sin(angle);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        width={center * 2}
        height={center * 2}
        className="transform -rotate-90"
        onPointerDown={onDown}
        onPointerMove={onMove}
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

        {/* Selection arc (green) – chỉ hiển thị khi KHÔNG chạy */}
        {!isRunning && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="hsl(var(--success))"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={selectionDashArray}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-200 ease-linear"
          />
        )}

        {/* Progress ring (red on work / break color) – khi ĐANG chạy */}
        {isRunning && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isBreakMode ? "hsl(var(--break-foreground))" : "hsl(var(--destructive))"}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        )}

        {/* Draggable knob – ẩn khi running. Có transition để “hồi” về 0 khi Start */}
        {!isRunning && (
          <circle
            cx={knobX}
            cy={knobY}
            r={16}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={3}
            className="cursor-pointer transition-all duration-300 shadow-lg"
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
