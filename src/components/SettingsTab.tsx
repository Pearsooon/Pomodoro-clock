import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, BarChart3, Download, Info } from 'lucide-react';

const SETTINGS_KEY = 'appSettings';
const TODO_PREFS_KEY = 'todoReminderPrefs';

type AppSettings = {
  shortBreakLength: number;   // Break (min)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoStartNext: boolean;
};

type TodoReminderPrefs = {
  eveningRemindEnabled: boolean;
  eveningRemindTime: string;   // "HH:MM"
  unfinishedAlertEnabled: boolean;
  resetTime: string;           // "HH:MM"
};

const DEFAULT_TODO_PREFS: TodoReminderPrefs = {
  eveningRemindEnabled: true,
  eveningRemindTime: '20:30',
  unfinishedAlertEnabled: true,
  resetTime: '00:00',
};

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    shortBreakLength: 5,
    soundEnabled: true,
    vibrationEnabled: true,
    autoStartNext: false,
  });

  const [todoPrefs, setTodoPrefs] = useState<TodoReminderPrefs>(DEFAULT_TODO_PREFS);

  // Load settings
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
      alert('Settings saved.');
    } catch {
      alert('Failed to save settings.');
    }
  };

  const requestNotifPerm = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') alert('Notifications enabled.');
    else alert('Notifications not granted.');
  };

  return (
    <div className="p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your Pomodoro & To-Do experience</p>
      </div>

      {/* Timer Settings: chỉ Break (min) + Save */}
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

      {/* Notifications (Pomodoro) */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Pomodoro Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Sound</div>
              <div className="text-sm text-muted-foreground">Play sound when phases end</div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, soundEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Vibration</div>
              <div className="text-sm text-muted-foreground">Vibrate on phase transitions</div>
            </div>
            <Switch
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, vibrationEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-start next session</div>
              <div className="text-sm text-muted-foreground">Automatically begin next phase</div>
            </div>
            <Switch
              checked={settings.autoStartNext}
              onCheckedChange={(checked) => setSettings((p) => ({ ...p, autoStartNext: checked }))}
            />
          </div>
        </div>
      </Card>

      {/* NEW: To-Do Reminders */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">To-Do Reminders</h3>
        </div>

        <div className="space-y-4">
          {/* Evening remind */}
          <div className="flex items-center justify-between">
            <div className="mr-4">
              <div className="font-medium">Evening reminder to plan tomorrow</div>
              <div className="text-sm text-muted-foreground">
                Prompts you to add tasks for tomorrow at a set time each evening
              </div>
            </div>
            <Switch
              checked={todoPrefs.eveningRemindEnabled}
              onCheckedChange={(checked) => setTodoPrefs((p) => ({ ...p, eveningRemindEnabled: checked }))}
            />
          </div>
          <div className="max-w-[220px]">
            <Label htmlFor="evening-time">Evening reminder time</Label>
            <Input
              id="evening-time"
              type="time"
              value={todoPrefs.eveningRemindTime}
              onChange={(e) => setTodoPrefs((p) => ({ ...p, eveningRemindTime: e.target.value || '20:30' }))}
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Unfinished alert before reset-time */}
          <div className="flex items-center justify-between">
            <div className="mr-4">
              <div className="font-medium">Alert unfinished tasks before reset-time</div>
              <div className="text-sm text-muted-foreground">
                Warns you if there are unfinished tasks before the daily reset
              </div>
            </div>
            <Switch
              checked={todoPrefs.unfinishedAlertEnabled}
              onCheckedChange={(checked) => setTodoPrefs((p) => ({ ...p, unfinishedAlertEnabled: checked }))}
            />
          </div>
          <div className="max-w-[220px]">
            <Label htmlFor="reset-time">Daily reset time</Label>
            <Input
              id="reset-time"
              type="time"
              value={todoPrefs.resetTime}
              onChange={(e) => setTodoPrefs((p) => ({ ...p, resetTime: e.target.value || '00:00' }))}
              className="mt-1"
            />
          </div>

          {/* Browser notification permission */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" onClick={requestNotifPerm}>Enable browser notifications</Button>
            <span className="text-xs text-muted-foreground">
              (optional) Allow notifications so reminders can appear even when tab is inactive
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={saveAll} className="min-w-[120px]">Save</Button>
        </div>
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
