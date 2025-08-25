import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, BarChart3, Download, Info } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    defaultWorkLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    soundEnabled: true,
    vibrationEnabled: true,
    autoStartNext: false,
  });

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your Pomodoro experience</p>
      </div>

      {/* Timer Settings */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Timer Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workLength">Work Length (min)</Label>
              <Input
                id="workLength"
                type="number"
                min="1"
                max="60"
                value={settings.defaultWorkLength}
                onChange={(e) => updateSetting('defaultWorkLength', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shortBreak">Short Break (min)</Label>
              <Input
                id="shortBreak"
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakLength}
                onChange={(e) => updateSetting('shortBreakLength', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="longBreak">Long Break (min)</Label>
            <Input
              id="longBreak"
              type="number"
              min="1"
              max="60"
              value={settings.longBreakLength}
              onChange={(e) => updateSetting('longBreakLength', parseInt(e.target.value))}
              className="mt-1 max-w-[150px]"
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Sound</div>
              <div className="text-sm text-muted-foreground">Play sound when phases end</div>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Vibration</div>
              <div className="text-sm text-muted-foreground">Vibrate on phase transitions</div>
            </div>
            <Switch
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => updateSetting('vibrationEnabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-start next session</div>
              <div className="text-sm text-muted-foreground">Automatically begin next phase</div>
            </div>
            <Switch
              checked={settings.autoStartNext}
              onCheckedChange={(checked) => updateSetting('autoStartNext', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Analytics */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Analytics</h3>
        </div>
        
        <Button variant="outline" className="w-full mb-3">
          <BarChart3 className="w-4 h-4 mr-2" />
          View Analytics Dashboard
        </Button>
        
        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Export Data (CSV)
        </Button>
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

      <Separator />

      {/* Quick stats */}
      <div className="text-center space-y-2">
        <div className="text-lg font-semibold text-foreground">Keep building your focus!</div>
        <div className="text-sm text-muted-foreground">
          Every completed session helps your pet grow stronger 🚀
        </div>
      </div>
    </div>
  );
};