import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ChartType = "bar-horizontal" | "line";

const DATA_14 = [
  { date: "08-13", hours: 0.8 },
  { date: "08-14", hours: 1.2 },
  { date: "08-15", hours: 0.0 },
  { date: "08-16", hours: 2.0 },
  { date: "08-17", hours: 1.6 },
  { date: "08-18", hours: 0.7 },
  { date: "08-19", hours: 2.4 },
  { date: "08-20", hours: 1.1 },
  { date: "08-21", hours: 0.5 },
  { date: "08-22", hours: 1.9 },
  { date: "08-23", hours: 0.0 },
  { date: "08-24", hours: 2.8 },
  { date: "08-25", hours: 1.3 },
  { date: "08-26", hours: 2.1 },
];

const StatsTab: React.FC = () => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState<ChartType>("bar-horizontal");
  const data14 = DATA_14;

  const totalHours7d = useMemo(
    () => data14.slice(-7).reduce((s, d) => s + d.hours, 0).toFixed(1),
    [data14]
  );
  const avgDay14d = useMemo(
    () => (data14.reduce((s, d) => s + d.hours, 0) / data14.length).toFixed(1),
    [data14]
  );
  const activeDays14d = useMemo(
    () => data14.filter((d) => d.hours > 0).length,
    [data14]
  );
  const bestDay = useMemo(() => {
    let max = -Infinity, item = data14[0];
    data14.forEach((d) => { if (d.hours > max) { max = d.hours; item = d; } });
    return item;
  }, [data14]);

  const maxHours = Math.max(2, ...data14.map((d) => d.hours));
  const rangeText = `${data14[0].date} → ${data14[data14.length - 1].date}`;

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Top bar */}
      <div className="grid grid-cols-3 items-center">
        <button
          aria-label="Back to Settings"
          onClick={() => navigate("/", { state: { tab: "settings" } })}
          className="justify-self-start inline-flex items-center justify-center w-12 h-12 rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <ArrowLeft className="w-7 h-7 text-primary" />
        </button>

        <div className="justify-self-center text-center">
          <h1 className="text-2xl font-bold leading-tight">Focus Insights</h1>
          <p className="text-sm text-muted-foreground">Your last 14 days of focus time</p>
        </div>

        <div className="justify-self-end w-12 h-12" />
      </div>

      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground -mt-1">
        <button
          className="cursor-pointer hover:underline"
          onClick={() => navigate("/", { state: { tab: "settings" } })}
        >
          Settings
        </button>
        <span className="mx-1">›</span>
        <span className="font-semibold">Insights</span>
      </div>

      {/* Summary */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Hours by Day</h2>
            <p className="text-xs text-muted-foreground">
              Last 14 days • {rangeText}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === "bar-horizontal" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar-horizontal")}
            >
              Bar (Horizontal)
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
            >
              Line
            </Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-[11px] sm:text-xs text-muted-foreground">Total hours (7d)</div>
          <div className="text-xl sm:text-2xl font-bold">{totalHours7d}h</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] sm:text-xs text-muted-foreground">Avg/day (14d)</div>
          <div className="text-xl sm:text-2xl font-bold">{avgDay14d}h</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] sm:text-xs text-muted-foreground">Active days (14d)</div>
          <div className="text-xl sm:text-2xl font-bold">{activeDays14d}</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] sm:text-xs text-muted-foreground">Best day</div>
          <div className="text-xl sm:text-2xl font-bold">
            {bestDay.date} • {bestDay.hours}h
          </div>
        </Card>
      </div>

      {/* Chart area */}
      <Card className="p-4" role="group" aria-labelledby="chart-title">
        <div className="mb-4">
          <h3 id="chart-title" className="font-medium text-sm">
            {chartType === "bar-horizontal"
              ? "Daily Focus Hours (Horizontal Bar)"
              : "Daily Focus Hours (Line Chart)"}
          </h3>
          <div className="mt-2 flex items-center gap-3" role="list" aria-label="Legend">
            <LegendSwatch label="Focus hours (h)" />
            <span className="text-xs text-muted-foreground">Date: MM-DD</span>
            <span className="text-xs text-muted-foreground">Hours: 0 - {maxHours}</span>
          </div>
        </div>

        {chartType === "bar-horizontal" && (
          <BarHorizontal data={data14} maxY={maxHours} />
        )}
        {chartType === "line" && (
          <SimpleLineChart data={data14} maxY={maxHours} />
        )}
      </Card>
    </div>
  );
};

export default StatsTab;
export { StatsTab };

/* ---------- Legend ---------- */
function LegendSwatch({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full border" role="listitem">
      <span className="inline-block w-3 h-3 rounded-sm bg-primary" aria-hidden />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

/* ---------- Horizontal Bar Chart ---------- */
function BarHorizontal({
  data,
  maxY,
}: {
  data: { date: string; hours: number }[];
  maxY: number;
}) {
  return (
    <div className="space-y-2">
      {data.slice().reverse().map((d) => {
        const wPct = (d.hours / maxY) * 100;
        return (
          <div key={d.date} className="flex items-center gap-2">
            {/* DATE: luôn hiện đầy đủ bên trái */}
            <div className="w-14 shrink-0 text-[10px] text-muted-foreground text-right font-bold">
              {d.date}
            </div>
            <div className="flex-1 h-3 rounded bg-muted overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-foreground/60" />
              <div
                className="h-full bg-primary"
                style={{ width: `${wPct}%`, transition: "width .3s" }}
              />
            </div>
            <div className="w-10 shrink-0 text-[10px] text-muted-foreground text-right">
              {d.hours}h
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">0h</span>
        <span className="text-[10px] text-muted-foreground">Hours (h)</span>
      </div>
    </div>
  );
}

/* ---------- Line Chart (rotated bottom labels) ---------- */
function SimpleLineChart({
  data,
  maxY,
}: {
  data: { date: string; hours: number }[];
  maxY: number;
}) {
  // Responsive width for mobile/desktop (guard SSR)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

  // Chart size
  const W = isMobile ? 420 : 1200;
  const H = isMobile ? 320 : 500;

  // Separate paddings to have extra space at bottom for rotated labels
  const PT = 40;          // top
  const PR = 40;          // right
  const PB = 80;          // bottom (extra for -45° labels)
  const PL = isMobile ? 48 : 56; // left (room for Y labels)

  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const points = data.map((d, i) => {
    const x = PL + (i * innerW) / (data.length - 1 || 1);
    const y = PT + innerH - (d.hours / maxY) * innerH;
    return [x, y] as const;
  });
  const path = points.map(([x, y]) => `${x},${y}`).join(" ");

  // Where to place axis labels
  const axisX = PL;
  const axisY = PT + innerH;

  return (
    <div className="w-full min-h-[320px] h-[500px]">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="w-full h-full">
        {/* Y grid + labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const ratio = i / 4;
          const y = PT + (1 - ratio) * innerH;
          const label = (maxY * ratio).toFixed(0) + "h";
          return (
            <g key={i}>
              <line
                x1={PL}
                y1={y}
                x2={W - PR}
                y2={y}
                stroke="hsl(var(--border))"
                strokeDasharray={i === 4 ? undefined : "3 3"}
              />
              <text
                x={PL - 10}
                y={y + 3}
                textAnchor="end"
                fontSize={isMobile ? "9" : "10"}
                fill="hsl(var(--muted-foreground))"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* X labels (rotated -45°) */}
        {data.map((d, i) => {
          const x = PL + (i * innerW) / (data.length - 1 || 1);
          return (
            <text
              key={d.date}
              x={x}
              y={axisY + 18}                           // a bit below the axis
              transform={`rotate(-45, ${x}, ${axisY + 18})`}
              textAnchor="end"
              fontSize={isMobile ? "9" : "10"}
              fill="hsl(var(--muted-foreground))"
              fontWeight="bold"
            >
              {d.date}
            </text>
          );
        })}

        {/* Line + Dots */}
        <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2" points={path} />
        {points.map(([x, y], idx) => (
          <circle key={idx} cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
        ))}

        {/* Axis labels */}
        {/* Y axis title */}
        <text
          x={PL - 24}
          y={PT - 12}
          textAnchor="start"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          Hours (h)
        </text>

        {/* X axis title — put near the right but above rotated labels */}
        <text
          x={W - PR}
          y={H - 10}
          textAnchor="end"
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
        >
          Date
        </text>
      </svg>
    </div>
  );
}
