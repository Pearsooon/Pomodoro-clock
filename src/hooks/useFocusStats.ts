import { useCallback, useEffect, useMemo, useState } from "react";

type SessionLog = { t: number; m: number; c: number }; // time, minutes, cycles
type StatsStore = {
  version: 1;
  sessions: SessionLog[];
  opens: string[]; // array of "YYYY-MM-DD"
};

const STORAGE_KEY = "focus_stats_v1";

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function load(): StatsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, sessions: [], opens: [] };
    const parsed = JSON.parse(raw);
    // migrate here if needed
    return {
      version: 1,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      opens: Array.isArray(parsed.opens) ? parsed.opens : [],
    };
  } catch {
    return { version: 1, sessions: [], opens: [] };
  }
}
function save(s: StatsStore) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function useFocusStats() {
  const [store, setStore] = useState<StatsStore>(() => load());

  useEffect(() => { save(store); }, [store]);

  const logAppOpen = useCallback(() => {
    const key = todayKey();
    setStore(prev => prev.opens.includes(key) ? prev : { ...prev, opens: [...prev.opens, key] });
  }, []);

  const logSession = useCallback((minutes: number, cycles: number) => {
    const t = Date.now();
    setStore(prev => ({ ...prev, sessions: [...prev.sessions, { t, m: minutes, c: cycles }] }));
  }, []);

  const reset = useCallback(() => setStore({ version: 1, sessions: [], opens: [] }), []);

  const exportJSON = useCallback(() => JSON.stringify(store, null, 2), [store]);

  // ---- Aggregations ----
  const lastNDaysSeries = useCallback((n: number) => {
    // build map yyyy-mm-dd -> hours
    const map = new Map<string, number>();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map.set(todayKey(d), 0);
    }
    store.sessions.forEach(s => {
      const k = todayKey(new Date(s.t));
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + s.m / 60);
    });
    return Array.from(map.entries()).map(([date, hours]) => ({ date: date.slice(5), hours: +hours.toFixed(2) }));
  }, [store.sessions]);

  const totalHours7d = useMemo(() => {
    const series = lastNDaysSeries(7);
    return series.reduce((sum, d) => sum + d.hours, 0).toFixed(1);
  }, [lastNDaysSeries]);

  const activeDaysThisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-`;
    return store.opens.filter(k => k.startsWith(ym)).length;
  }, [store.opens]);

  return {
    // write
    logAppOpen,
    logSession,
    reset,
    exportJSON,
    // read
    lastNDaysSeries,
    totalHours7d,
    activeDaysThisMonth,
  };
}
