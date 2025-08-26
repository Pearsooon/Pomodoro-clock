import React, { useState } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { HomeTab } from '@/components/HomeTab';
import { TodoTab } from '@/components/TodoTab';
import { PetTab } from '@/components/PetTab';
import { BlockTab } from '@/components/BlockTab';
import { SettingsTab } from '@/components/SettingsTab';

type TabId = 'home' | 'todo' | 'pet' | 'block' | 'settings';

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        {/* GIỮ MOUNT, chỉ ẩn/hiện bằng "hidden" để timer không bị clear */}
        <div className={activeTab === 'home' ? '' : 'hidden'}>
          <HomeTab />
        </div>
        <div className={activeTab === 'todo' ? '' : 'hidden'}>
          <TodoTab />
        </div>
        <div className={activeTab === 'pet' ? '' : 'hidden'}>
          <PetTab />
        </div>
        <div className={activeTab === 'block' ? '' : 'hidden'}>
          <BlockTab />
        </div>
        <div className={activeTab === 'settings' ? '' : 'hidden'}>
          <SettingsTab />
        </div>
      </main>

      {/* Bottom nav cố định */}
      <BottomNavigation 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as TabId)}
      />
    </div>
  );
};

export default Index;
