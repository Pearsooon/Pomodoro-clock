import React, { useEffect, useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomeTab } from "@/components/HomeTab";
import { TodoTab } from "@/components/TodoTab";
import { PetTab } from "@/components/PetTab";
import { BlockTab } from "@/components/BlockTab";
import { SettingsTab } from "@/components/SettingsTab";

type TabId = "home" | "todo" | "pet" | "block" | "settings";
const ACTIVE_TAB_KEY = "active_tab";

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  useEffect(() => {
    // 1) Điều hướng ban đầu qua localStorage nếu có
    try {
      const saved = localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null;
      if (saved) {
        setActiveTab(saved);
        localStorage.removeItem(ACTIVE_TAB_KEY);
      }
    } catch {}

    // 2) Nghe custom event để chuyển tab (HomeTab sẽ dispatch)
    const onNav = (e: Event) => {
      const ce = e as CustomEvent<TabId>;
      const tab = ce?.detail;
      if (tab === "home" || tab === "todo" || tab === "pet" || tab === "block" || tab === "settings") {
        setActiveTab(tab);
      }
    };

    // 3) Đồng bộ khi mở nhiều tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_TAB_KEY && e.newValue) {
        const tab = e.newValue as TabId;
        setActiveTab(tab);
        try { localStorage.removeItem(ACTIVE_TAB_KEY); } catch {}
      }
    };

    window.addEventListener("nav:tab", onNav as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("nav:tab", onNav as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        {/* GIỮ MOUNT, chỉ ẩn/hiện bằng "hidden" để timer không bị clear */}
        <div className={activeTab === "home" ? "" : "hidden"}>
          <HomeTab />
        </div>
        <div className={activeTab === "todo" ? "" : "hidden"}>
          <TodoTab />
        </div>
        <div className={activeTab === "pet" ? "" : "hidden"}>
          <PetTab />
        </div>
        <div className={activeTab === "block" ? "" : "hidden"}>
          <BlockTab />
        </div>
        <div className={activeTab === "settings" ? "" : "hidden"}>
          <SettingsTab />
        </div>
      </main>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
      />
    </div>
  );
};

export default Index;
