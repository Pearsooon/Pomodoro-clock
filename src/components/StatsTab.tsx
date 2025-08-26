import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ChartType = "bar-vertical" | "bar-horizontal" | "line";

// ---- DEMO DATA (14 ngày)
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
  const [chartType, setChartType] = useState<ChartType>("bar-vertical");
  const data14 = DATA_14;

  // KPIs
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

  // Range & scale
  const maxHours = Math.max(2, ...data14.map((d) => d.hours));
  const rangeText = `${data14[0].date} → ${data14[data14.length - 1].date}`;

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Setting
        </Button>
        <h1 className="text-xl font-semibold">Focus Insights</h1>
        <div className="w-[130px]" /> {/* spacer */}
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
              variant={chartType === "bar-vertical" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar-vertical")}
            >
              Bar (Vertical)
            </Button>
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
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total hours (7d)</div>
          <div className="text-2xl font-bold">{totalHours7d}h</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Avg/day (14d)</div>
          <div className="text-2xl font-bold">{avgDay14d}h</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Active days (14d)</div>
          <div className="text-2xl font-bold">{activeDays14d}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Best day</div>
          <div className="text-2xl font-bold">{bestDay.date} • {bestDay.hours}h</div>
        </Card>
      </div>

      {/* Chart area */}
      <Card className="p-4">
        {/* title under card to keep consistent spacing */}
        <h3 className="font-medium text-sm mb-2">
          Daily focus hours (no tooltip; mobile-friendly)
        </h3>

        {/* BAR – VERTICAL */}
        {chartType === "bar-vertical" && (
          <div className="relative h-64">
            {/* grid lines + y labels */}
            {Array.from({ length: 4 }).map((_, i) => {
              const y = (i * 100) / 4;
              const label = ((maxHours * i) / 4).toFixed(0) + "h";
              return (
                <div key={i}>
                  <div
                    className="absolute left-10 right-2 h-px bg-border"
                    style={{ bottom: `calc(${y}% + 16px)` }}
                  />
                  <div
                    className="absolute left-0 w-8 text-[10px] text-right text-muted-foreground"
                    style={{ bottom: `calc(${y}% + 12px)` }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}

            {/* bars */}
            <div className="absolute left-10 right-2 top-3 bottom-10 flex items-end gap-1.5">
              {data14.map((d, idx) => {
                const hPct = (d.hours / maxHours) * 100;
                const showTick = idx % 2 === 0; // bớt dày
                return (
                  <div key={d.date} className="flex-1 h-full flex flex-col-reverse items-center">
                    {/* x label */}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {showTick ? d.date.slice(5) : ""}
                    </div>
                    {/* column container to give percentage height a reference */}
                    <div className="w-full h-full flex items-end">
                      <div
                        className="w-full bg-primary rounded-t-md"
                        style={{ height: `${hPct}%`, transition: "height .3s" }}
                        aria-label={`${d.date} ${d.hours} hours`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BAR – HORIZONTAL */}
        {chartType === "bar-horizontal" && (
          <div className="space-y-2">
            {data14.slice().reverse().map((d) => {
              const wPct = (d.hours / maxHours) * 100;
              return (
                <div key={d.date} className="flex items-center gap-2">
                  <div className="w-12 shrink-0 text-[10px] text-muted-foreground text-right">
                    {d.date.slice(5)}
                  </div>
                  <div className="flex-1 h-3 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${wPct}%`, transition: "width .3s" }}
                      aria-label={`${d.date} ${d.hours} hours`}
                    />
                  </div>
                  <div className="w-10 shrink-0 text-[10px] text-muted-foreground text-right">
                    {d.hours}h
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LINE */}
        {chartType === "line" && <SimpleLineChart data={data14} maxY={maxHours} />}
      </Card>
    </div>
  );
};

export default StatsTab;
export { StatsTab };

/** SVG line chart (no tooltip) */
function SimpleLineChart({
  data,
  maxY,
}: {
  data: { date: string; hours: number }[];
  maxY: number;
}) {
  const W = 640;
  const H = 240;
  const P = 24;
  const innerW = W - P * 2;
  const innerH = H - P * 2;

  const points = data.map((d, i) => {
    const x = P + (i * innerW) / (data.length - 1 || 1);
    const y = P + innerH - (d.hours / maxY) * innerH;
    return [x, y] as const;
  });
  const path = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div className="h-64">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        {/* grid */}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = P + (i * innerH) / 4;
          const label = ((maxY * i) / 4).toFixed(0) + "h";
          return (
            <g key={i}>
              <line x1={P} y1={y} x2={W - P} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <text x={P - 8} y={y + 3} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))">
                {label}
              </text>
            </g>
          );
        })}
        {/* x labels */}
        {data.map((d, i) => {
          const x = P + (i * innerW) / (data.length - 1 || 1);
          return (
            <text key={d.date} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
              {d.date.slice(5)}
            </text>
          );
        })}
        {/* line + dots */}
        <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2" points={path} />
        {points.map(([x, y], idx) => (
          <circle key={idx} cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
        ))}
      </svg>
    </div>
  );
}
