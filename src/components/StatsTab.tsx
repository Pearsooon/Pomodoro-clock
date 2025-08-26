import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

// ----- DEMO DATA: 14 ngày gần nhất (bịa cứng)
const DATA_14 = [
  { date: "08-13", hours: 0.8, sessions: 2 },
  { date: "08-14", hours: 1.2, sessions: 3 },
  { date: "08-15", hours: 0.0, sessions: 0 },
  { date: "08-16", hours: 2.0, sessions: 4 },
  { date: "08-17", hours: 1.6, sessions: 3 },
  { date: "08-18", hours: 0.7, sessions: 1 },
  { date: "08-19", hours: 2.4, sessions: 5 },
  { date: "08-20", hours: 1.1, sessions: 2 },
  { date: "08-21", hours: 0.5, sessions: 1 },
  { date: "08-22", hours: 1.9, sessions: 4 },
  { date: "08-23", hours: 0.0, sessions: 0 },
  { date: "08-24", hours: 2.8, sessions: 6 },
  { date: "08-25", hours: 1.3, sessions: 3 },
  { date: "08-26", hours: 2.1, sessions: 4 },
];

type ChartType = "bar-vertical" | "bar-horizontal" | "line";

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
  const activeDaysThisMonth = useMemo(
    () => data14.filter((d) => d.hours > 0).length,
    [data14]
  );
  const bestDay = useMemo(() => {
    let max = -1, item = data14[0];
    data14.forEach((d) => { if (d.hours > max) { max = d.hours; item = d; } });
    return item;
  }, [data14]);

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
          <div className="text-2xl font-bold">{activeDaysThisMonth}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Best day (14d)</div>
          <div className="text-2xl font-bold">
            {bestDay.date} • {bestDay.hours}h
          </div>
        </Card>
      </div>

      {/* Filter chọn chart type */}
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

      {/* Chart (không tooltip) */}
      <Card className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar-vertical" && (
              <BarChart data={data14} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Bar dataKey="hours" />
              </BarChart>
            )}

            {chartType === "bar-horizontal" && (
              <BarChart
                data={data14}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="date" width={48} tick={{ fontSize: 12 }} />
                <Bar dataKey="hours" />
              </BarChart>
            )}

            {chartType === "line" && (
              <LineChart data={data14} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Line dataKey="hours" dot />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          No tooltip (mobile friendly). Switch chart type above.
        </p>
      </Card>
    </div>
  );
};

export default StatsTab;
export { StatsTab };
