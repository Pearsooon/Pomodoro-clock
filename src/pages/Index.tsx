import React, { useState } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { HomeTab } from '@/components/HomeTab';
import { TodoTab } from '@/components/TodoTab';
import { PetTab } from '@/components/PetTab';
import { BlockTab } from '@/components/BlockTab';
import { SettingsTab } from '@/components/SettingsTab';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'todo':
        return <TodoTab />;
      case 'pet':
        return <PetTab />;
      case 'block':
        return <BlockTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        {renderActiveTab()}
      </main>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
