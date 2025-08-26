import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ChartType = "bar-vertical" | "bar-horizontal" | "line";

// ----- DEMO DATA: 14 ngày (set cứng)
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

  // Scale chung cho mọi chart
  const maxHours = Math.max(2, ...data14.map(d => d.hours)); // ít nhất 2 để cột/line không dẹt

  return (
    <div className="p-6 pb-20 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">Insights</h1>
        <p className="text-sm text-muted-foreground">Hours by day (last 14 days)</p>
      </div>

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
          <div className="text-xs text-muted-foreground">Best day (14d)</div>
          <div className="text-2xl font-bold">
            {bestDay.date} • {bestDay.hours}h
          </div>
        </Card>
      </div>

      {/* Filter chọn loại chart */}
      <Card className="p-3">
        <div className="flex gap-2">
          <Button
            variant={chartType === "bar-vertical" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar-vertical")}
            className="flex-1"
          >
            Bar (Vertical)
          </Button>
          <Button
            variant={chartType === "bar-horizontal" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("bar-horizontal")}
            className="flex-1"
          >
            Bar (Horizontal)
          </Button>
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
            className="flex-1"
          >
            Line
          </Button>
        </div>
      </Card>

      {/* Charts – không dùng tooltip, không cần lib */}
      <Card className="p-4">
        {chartType === "bar-vertical" && (
          <div className="h-64 flex items-end gap-2">
            {data14.map((d) => {
              const hPct = (d.hours / maxHours) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-md bg-primary"
                    style={{ height: `${hPct}%`, transition: "height .3s" }}
                    aria-label={`${d.date} ${d.hours} hours`}
                  />
                  <div className="mt-1 text-[10px] text-muted-foreground">{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        )}

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

        {chartType === "line" && (
          <SimpleLineChart data={data14} maxY={maxHours} />
        )}

        <p className="text-xs text-muted-foreground text-center mt-3">
          No tooltip (mobile friendly). Switch chart type above.
        </p>
      </Card>
    </div>
  );
};

export default StatsTab;
export { StatsTab };

/** SVG line chart siêu gọn, không tooltip */
function SimpleLineChart({ data, maxY }: { data: { date: string; hours: number }[]; maxY: number }) {
  const W = 640; // nội bộ, sẽ scale theo container ngoài
  const H = 240;
  const P = 24; // padding
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
        {/* grid ngang */}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = P + (i * innerH) / 4;
          return <line key={i} x1={P} y1={y} x2={W - P} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 3" />;
        })}

        {/* trục X nhãn ngày */}
        {data.map((d, i) => {
          const x = P + (i * innerW) / (data.length - 1 || 1);
          return (
            <text key={d.date} x={x} y={H - 6} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
              {d.date.slice(5)}
            </text>
          );
        })}

        {/* polyline */}
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          points={path}
        />

        {/* dots */}
        {points.map(([x, y], idx) => (
          <circle key={idx} cx={x} cy={y} r="3" fill="hsl(var(--primary))" />
        ))}
      </svg>
    </div>
  );
}
