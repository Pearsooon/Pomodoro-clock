import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import petAwake from "@/assets/pet-awake.png";
import petSleeping from "@/assets/pet-sleeping.png";
import { Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // ⬅️ shadcn toast hook

interface CircularTimerProps {
  minutes: number;
  seconds: number;
  totalMinutes: number;   // 0..59
  isRunning: boolean;
  isBreakMode: boolean;
  onMinutesChange: (m: number) => void;
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
  const { toast } = useToast(); // ⬅️ dùng để bắn popup
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // ===== Layout constants
  const radius = 120;
  const strokeWidth = 8;
  const KNOB_R = 16;
  const PADDING = KNOB_R + 6; // tránh knob bị cắt ở viền
  const center = radius + strokeWidth + PADDING;
  const circumference = 2 * Math.PI * radius;

  const petSrc = isBreakMode ? (sleepImage || petSleeping) : (petImage || petAwake);

  // ===== Time / progress
  const selectedMin = Math.max(0, Math.min(59, totalMinutes));
  const totalSeconds = Math.max(1, selectedMin * 60); // tránh chia 0
  const currentSeconds = Math.max(0, minutes * 60 + seconds);

  // ===== Convert pointer -> minute (0..59), 12h = 0
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

  const selectedFrac = selectedMin / 60;
  const selectedLen = selectedFrac * circumference;

  const remainFrac = selectedFrac * (currentSeconds / totalSeconds);
  const remainLen = remainFrac * circumference;

  // Vị trí knob
  const knobMinute = isRunning
    ? Math.round(selectedMin * (currentSeconds / totalSeconds))
    : selectedMin;

  const knobAngle = angleFromMinute(knobMinute);
  const knobX = center + radius * Math.cos(knobAngle);
  const knobY = center + radius * Math.sin(knobAngle);

  // ===== Popup for mobile & desktop
  const showHelp = () =>
    toast({
      title: "Guide",
      description: (
        <ol className="list-decimal ml-5 space-y-1">
          <li>Slide the orange knob around the ring to adjust minutes. Tip: tap anywhere on the ring to jump.</li>
          <li>The longer you focus, the higher your chances of unlocking a pet.</li>
        </ol>
      ),
      duration: 4000,
    });


  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Info button overlay (mobile friendly) */}
      <div className="absolute right-2 top-2 z-10">
        <button
          type="button"
          aria-label="Help: slide to adjust time"
          onClick={showHelp}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-muted-foreground/40 bg-background/80 backdrop-blur hover:bg-background"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

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

        {/* Vệt (selection) */}
        {!isRunning && (
          <g transform={`rotate(-90 ${center} ${center})`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#FF6D53"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${selectedLen} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Vệt đỏ (progress) */}
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

        {/* Knob */}
        <circle
          cx={knobX}
          cy={knobY}
          r={KNOB_R}
          fill="hsl(var(--primary))"
          stroke="white"
          strokeWidth={3}
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
