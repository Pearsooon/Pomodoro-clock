import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Smartphone, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface App {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  blocked: boolean;
}

export const BlockTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<App[]>([
    { id: '1', name: 'Instagram', packageName: 'com.instagram.android', icon: '📷', blocked: true },
    { id: '2', name: 'TikTok', packageName: 'com.tiktok', icon: '🎵', blocked: true },
    { id: '3', name: 'Twitter', packageName: 'com.twitter.android', icon: '🐦', blocked: false },
    { id: '4', name: 'YouTube', packageName: 'com.google.android.youtube', icon: '📺', blocked: true },
    { id: '5', name: 'Facebook', packageName: 'com.facebook.katana', icon: '👥', blocked: false },
    { id: '6', name: 'WhatsApp', packageName: 'com.whatsapp', icon: '💬', blocked: false },
    { id: '7', name: 'Snapchat', packageName: 'com.snapchat.android', icon: '👻', blocked: true },
    { id: '8', name: 'Reddit', packageName: 'com.reddit.frontpage', icon: '🤖', blocked: false },
  ]);

  const [hasPermissions, setHasPermissions] = useState(false);

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const blockedApps = apps.filter(app => app.blocked);

  const toggleAppBlock = (id: string) => {
    setApps(prev => prev.map(app =>
      app.id === id ? { ...app, blocked: !app.blocked } : app
    ));
  };

  const requestPermissions = () => {
    // In a real app, this would open device settings
    setHasPermissions(true);
  };

  if (!hasPermissions) {
    return (
      <div className="p-6 pb-20 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">App Blocking</h1>
          <p className="text-muted-foreground">Block distracting apps during focus sessions</p>
        </div>

        <Card className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Permissions Required</h3>
            <p className="text-muted-foreground mb-4">
              To block apps during focus sessions, we need special permissions.
            </p>
          </div>
          
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-sm">Notification Listener Access</div>
                <div className="text-xs text-muted-foreground">To silence app notifications</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-sm">Do Not Disturb Access</div>
                <div className="text-xs text-muted-foreground">To manage focus mode settings</div>
              </div>
            </div>
          </div>

          <Button onClick={requestPermissions} className="w-full mt-6">
            Grant Permissions
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">App Blocking</h1>
        <p className="text-muted-foreground">Choose apps to block during focus sessions</p>
      </div>

      {/* Status */}
      {blockedApps.length > 0 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {blockedApps.length} apps will be blocked during focus sessions
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{blockedApps.length}</div>
          <div className="text-sm text-muted-foreground">Blocked Apps</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{apps.length - blockedApps.length}</div>
          <div className="text-sm text-muted-foreground">Allowed Apps</div>
        </Card>
      </div>

      {/* Apps list */}
      <div className="space-y-3">
        {filteredApps.map((app) => (
          <Card key={app.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{app.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{app.name}</div>
                <div className="text-sm text-muted-foreground truncate">{app.packageName}</div>
              </div>
              <div className="flex items-center gap-2">
                {app.blocked && (
                  <Badge variant="secondary" className="text-xs">
                    Blocked
                  </Badge>
                )}
                <Checkbox
                  checked={app.blocked}
                  onCheckedChange={() => toggleAppBlock(app.id)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No apps found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};