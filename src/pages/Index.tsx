import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomeTab } from "@/components/HomeTab";
import { TodoTab } from "@/components/TodoTab";
import { PetTab } from "@/components/PetTab";
import { BlockTab } from "@/components/BlockTab";
import { SettingsTab } from "@/components/SettingsTab";

type TabId = "home" | "todo" | "pet" | "block" | "settings";
const ACTIVE_TAB_KEY = "active_tab";

const Index: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("home");

  // ❶ Nếu từ Stats quay về bằng: navigate("/", { state: { tab: "settings" } })
  //    thì đọc location.state.tab và bật đúng tab, sau đó xóa state để tránh lặp.
  useEffect(() => {
    const next = (location.state as { tab?: TabId } | null)?.tab;
    if (next) {
      setActiveTab(next);
      // xóa history.state (React Router dùng history.state để giữ location.state)
      try {
        window.history.replaceState({}, document.title, location.pathname);
      } catch {}
    }
  }, [location.state, location.pathname]);

  // ❷ Khôi phục từ localStorage nếu có (tuỳ bạn đang dùng logic này để sync tab)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null;
      if (saved) {
        setActiveTab(saved);
        localStorage.removeItem(ACTIVE_TAB_KEY);
      }
    } catch {}

    // Nghe custom event để chuyển tab (nếu nơi khác dispatch)
    const onNav = (e: Event) => {
      const ce = e as CustomEvent<TabId>;
      const tab = ce?.detail;
      if (tab === "home" || tab === "todo" || tab === "pet" || tab === "block" || tab === "settings") {
        setActiveTab(tab);
      }
    };

    // Đồng bộ khi mở nhiều tab trình duyệt
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_TAB_KEY && e.newValue) {
        const tab = e.newValue as TabId;
        setActiveTab(tab);
        try {
          localStorage.removeItem(ACTIVE_TAB_KEY);
        } catch {}
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

      {/* Bottom nav cố định */}
      <BottomNavigation
        activeTab={activeTab}
        // Nếu BottomNavigation định nghĩa onTabChange: (tab: string) => void,
        // ta cast về TabId cho an toàn.
        onTabChange={(tab) => setActiveTab(tab as TabId)}
      />
    </div>
  );
};

export default Index;
