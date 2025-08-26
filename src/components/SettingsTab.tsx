import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, Bell, BarChart3, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";

const SETTINGS_KEY = "appSettings";
const TODO_PREFS_KEY = "todoReminderPrefs";

type AppSettings = {
  shortBreakLength: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoStartNext: boolean;
};

type TodoReminderPrefs = {
  eveningRemindEnabled: boolean;
  eveningRemindTime: string; // "HH:MM"
  unfinishedAlertEnabled: boolean;
  resetTime: string; // "HH:MM"
};

const DEFAULT_TODO_PREFS: TodoReminderPrefs = {
  eveningRemindEnabled: true,
  eveningRemindTime: "20:30",
  unfinishedAlertEnabled: true,
  resetTime: "00:00",
};

export const SettingsTab: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({
    shortBreakLength: 5,
    soundEnabled: true,
    vibrationEnabled: true,
    autoStartNext: false,
  });
  const [todoPrefs, setTodoPrefs] = useState<TodoReminderPrefs>(DEFAULT_TODO_PREFS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {}
    try {
      const raw2 = localStorage.getItem(TODO_PREFS_KEY);
      if (raw2) setTodoPrefs({ ...DEFAULT_TODO_PREFS, ...JSON.parse(raw2) });
    } catch {}
  }, []);

  const saveAll = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(TODO_PREFS_KEY, JSON.stringify(todoPrefs));
      alert("Settings saved.");
    } catch {
      alert("Failed to save settings.");
    }
  };

  const openInsights = () => navigate("/stats");

  return (
    <div className="p-6 pb-20 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your Pomodoro & To-Do experience</p>
      </div>

      {/* Timer Settings */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Timer Settings</h3>
        </div>
        <div className="max-w-[220px]">
          <Label htmlFor="shortBreak">Break (min)</Label>
          <Input
            id="shortBreak"
            type="number"
            min={1}
            max={60}
            value={settings.shortBreakLength}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                shortBreakLength: Math.max(1, Math.min(60, Number(e.target.value) || 0)),
              }))
            }
            className="mt-1"
          />
        </div>
      </Card>

      {/* Pomodoro Notifications */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Pomodoro Notifications</h3>
        </div>
        <div className="space-y-4">
          <Row label="Sound" desc="Play sound when phases end">
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, soundEnabled: checked }))}
            />
          </Row>
          <Row label="Vibration" desc="Vibrate on phase transitions">
            <Switch
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, vibrationEnabled: checked }))}
            />
          </Row>
          <Row label="Auto-start next session" desc="Automatically begin next phase">
            <Switch
              checked={settings.autoStartNext}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, autoStartNext: checked }))}
            />
          </Row>
        </div>
      </Card>

      {/* To-Do Reminders */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">To-Do Reminders</h3>
        </div>

        <Row
          label="Evening reminder to plan tomorrow"
          desc="Prompts you to add tasks for tomorrow at a set time each evening"
        >
          <Switch
            checked={todoPrefs.eveningRemindEnabled}
            onCheckedChange={(checked) => setTodoPrefs((p) => ({ ...p, eveningRemindEnabled: checked }))}
          />
        </Row>

        <div className="max-w-[220px]">
          <Label htmlFor="evening-time">Evening reminder time</Label>
          <Input
            id="evening-time"
            type="time"
            value={todoPrefs.eveningRemindTime}
            onChange={(e) => setTodoPrefs((p) => ({ ...p, eveningRemindTime: e.target.value || "20:30" }))}
            className="mt-1"
          />
        </div>

        <Row
          label="Alert unfinished tasks before reset-time"
          desc="Warns you if there are unfinished tasks before the daily reset"
        >
          <Switch
            checked={todoPrefs.unfinishedAlertEnabled}
            onCheckedChange={(checked) => setTodoPrefs((p) => ({ ...p, unfinishedAlertEnabled: checked }))}
          />
        </Row>

        <div className="max-w-[220px]">
          <Label htmlFor="reset-time">Daily reset time</Label>
          <Input
            id="reset-time"
            type="time"
            value={todoPrefs.resetTime}
            onChange={(e) => setTodoPrefs((p) => ({ ...p, resetTime: e.target.value || "00:00" }))}
            className="mt-1"
          />
        </div>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={saveAll}
          className="px-4 py-1 text-lg font-semibold"
        >
          Save All Settings
        </Button>
      </div>

      {/* Insights (quick access) */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Insights</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          View charts of your Pomodoro hours and active days.
        </p>
        <Button onClick={openInsights} className="px-2.5 py-1.5 font-semibold">View Insights</Button>
      </Card>

      {/* About */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">About</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <Badge variant="secondary">1.0.0</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Build</span>
            <span className="font-mono">2024.01.15</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="mr-4">
        <div className="font-medium">{label}</div>
        {desc && <div className="text-sm text-muted-foreground">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export default SettingsTab;
