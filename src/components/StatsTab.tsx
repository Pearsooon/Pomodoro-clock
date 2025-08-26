import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFocusStats } from "@/hooks/useFocusStats";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

export const StatsTab: React.FC = () => {
  const { lastNDaysSeries, totalHours7d, activeDaysThisMonth, reset, exportJSON } = useFocusStats();
  const data14 = useMemo(() => lastNDaysSeries(14), [lastNDaysSeries]);

  return (
    <div className="p-6 pb-20 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total hours (7d)</div>
          <div className="text-2xl font-bold">{totalHours7d}h</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active days (this month)</div>
          <div className="text-2xl font-bold">{activeDaysThisMonth}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Hours by day (last 14 days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data14}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v: any) => [`${v}h`, "Hours"]} />
              <Bar dataKey="hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => {
          const blob = new Blob([exportJSON()], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "focus-stats.json"; a.click();
          URL.revokeObjectURL(url);
        }}>
          Export JSON
        </Button>
        <Button variant="destructive" onClick={reset}>Reset stats</Button>
      </div>
    </div>
  );
};
