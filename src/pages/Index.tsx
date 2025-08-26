import React, { useEffect, useState } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { HomeTab } from "@/components/HomeTab";
import { TodoTab } from "@/components/TodoTab";
import { PetTab } from "@/components/PetTab";
import { BlockTab } from "@/components/BlockTab";
import { SettingsTab } from "@/components/SettingsTab";

type TabId = "home" | "todo" | "pet" | "block" | "settings";
const DEFAULT_TAB: TabId = "home";
const ALLOWED: TabId[] = ["home", "todo", "pet", "block", "settings"];
const ACTIVE_TAB_KEY = "active_tab";

function getTabFromLocation(): TabId {
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("tab") as TabId | null;
    const hash = (window.location.hash?.replace("#", "") || null) as TabId | null;
    if (q && ALLOWED.includes(q)) return q;
    if (hash && ALLOWED.includes(hash)) return hash;
  } catch {}
  return DEFAULT_TAB;
}

const Index: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromLocation());

  // đổi tab + cập nhật URL (để deep-link & back/forward)
  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      history.replaceState({}, "", url);
    } catch {}
  };

  useEffect(() => {
    // Ưu tiên đọc yêu cầu điều hướng do HomeTab đặt sẵn
    const stored = localStorage.getItem(ACTIVE_TAB_KEY) as TabId | null;
    if (stored && ALLOWED.includes(stored)) {
      changeTab(stored);
      localStorage.removeItem(ACTIVE_TAB_KEY);
    } else {
      // nếu không có, đồng bộ theo URL lúc vào trang
      changeTab(getTabFromLocation());
    }

    // Nghe sự kiện nav:tab (HomeTab dispatch khi bấm Yes)
    const onNav = (e: Event) => {
      const ce = e as CustomEvent<TabId>;
      if (ce?.detail && ALLOWED.includes(ce.detail)) {
        changeTab(ce.detail);
      }
    };

    // Bắt thay đổi localStorage từ tab khác (phòng mở nhiều tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_TAB_KEY && e.newValue && ALLOWED.includes(e.newValue as TabId)) {
        changeTab(e.newValue as TabId);
        localStorage.removeItem(ACTIVE_TAB_KEY);
      }
    };

    // Đồng bộ khi người dùng bấm nút back/forward của trình duyệt
    const onPopState = () => changeTab(getTabFromLocation());

    window.addEventListener("nav:tab", onNav as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("nav:tab", onNav as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("popstate", onPopState);
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
        onTabChange={(tab) => changeTab(tab as TabId)}
      />
    </div>
  );
};

export default Index;
