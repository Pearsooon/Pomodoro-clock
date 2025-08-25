import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Search, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/* ===================== Types & consts ===================== */

type Task = {
  id: string;
  title: string;
  note?: string;
  completed: boolean;
  /** yyyy-mm-dd: ngày mà task thuộc về (để phân Today/Tomorrow/History) */
  dateFor: string;
  createdAt: string;   // ISO
  createdTime: string; // HH:mm
};

type DaySnapshot = {
  dateFor: string;     // yyyy-mm-dd
  addedCount: number;
  doneCount: number;
  remainingCount: number;
  completionPct: number; // 0..100
};

const LS_TASKS = 'todo_tasks_v1';
const LS_SNAPSHOTS = 'todo_snapshots_v1';
const LS_LAST_RESET = 'todo_last_reset_v1';
const TODO_PREFS_KEY = 'todoReminderPrefs';

function getTodoPrefs() {
  try {
    const raw = localStorage.getItem(TODO_PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      eveningRemindEnabled: boolean;
      eveningRemindTime: string;   // "HH:MM"
      unfinishedAlertEnabled: boolean;
      resetTime: string;           // "HH:MM"
    };
  } catch {
    return null;
  }
}

function todayStr(d = new Date()) {
  return d.toLocaleDateString('en-CA'); // yyyy-mm-dd
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayStr(d);
}
function hhmmNow() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/* ===================== Component ===================== */

export const TodoTab: React.FC = () => {
  const { toast } = useToast();

  // ---- state & persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem(LS_TASKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [snapshots, setSnapshots] = useState<DaySnapshot[]>(() => {
    try {
      const raw = localStorage.getItem(LS_SNAPSHOTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => localStorage.setItem(LS_TASKS, JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem(LS_SNAPSHOTS, JSON.stringify(snapshots)), [snapshots]);

  // ---- inputs
  const [newTaskToday, setNewTaskToday] = useState('');
  const [newTaskTomorrow, setNewTaskTomorrow] = useState('');

  // ---- derived
  const today = todayStr();
  const tomorrow = tomorrowStr();

  const todayTasks = tasks.filter(t => t.dateFor === today);
  const tomorrowTasks = tasks.filter(t => t.dateFor === tomorrow);
  const completedCountToday = todayTasks.filter(t => t.completed).length;

  // ---- daily tick: reset & reminders
  useEffect(() => {
    const tick = () => {
      const prefs = getTodoPrefs();
      const eveningTime = prefs?.eveningRemindTime || '20:30';
      const resetTime = prefs?.resetTime || '00:00';
      const nowHHMM = hhmmNow();
      const nowYMD = todayStr(new Date());
      const lastReset = localStorage.getItem(LS_LAST_RESET);

      // 1) Chốt ngày ở thời điểm resetTime: snapshot + carry unfinished -> tomorrow
      if (nowHHMM === resetTime && lastReset !== nowYMD) {
        const day = nowYMD;
        const dayTasks = tasks.filter(t => t.dateFor === day);

        if (dayTasks.length > 0) {
          const added = dayTasks.length;
          const done = dayTasks.filter(t => t.completed).length;
          const remaining = added - done;
          const pct = added ? Math.round((done / added) * 100) : 0;

          setSnapshots(prev => {
            const filtered = prev.filter(s => s.dateFor !== day);
            return [...filtered, { dateFor: day, addedCount: added, doneCount: done, remainingCount: remaining, completionPct: pct }];
          });
        }

        // carry unfinished to tomorrow
        const tom = tomorrowStr();
        setTasks(prev => {
          const carry = prev
            .filter(t => t.dateFor === day && !t.completed)
            .map(t => ({ ...t, dateFor: tom } as Task));
          const keep = prev.filter(t => t.dateFor !== day || t.completed);
          return [...carry, ...keep];
        });

        localStorage.setItem(LS_LAST_RESET, nowYMD);
      }

      // 2) Evening remind: nếu chưa có task cho ngày mai
      if (prefs?.eveningRemindEnabled && nowHHMM === eveningTime) {
        const existTomorrow = tasks.some(t => t.dateFor === tomorrowStr());
        if (!existTomorrow) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Plan tomorrow?', { body: 'You have not added any tasks for tomorrow yet.' });
          }
          toast({ title: 'Plan tomorrow?', description: 'You have not added any tasks for tomorrow yet.' });
        }
      }

      // 3) Cảnh báo còn unfinished trước reset-time (ví dụ 15’)
      if (prefs?.unfinishedAlertEnabled) {
        const [rh, rm] = (prefs.resetTime || '00:00').split(':').map(Number);
        const now = new Date();
        const reset = new Date();
        reset.setHours(rh, rm, 0, 0);
        const diffMin = Math.round((reset.getTime() - now.getTime()) / 60000);
        if (diffMin === 15) {
          const unfinished = tasks.some(t => t.dateFor === today && !t.completed);
          if (unfinished) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Unfinished tasks', { body: 'You still have unfinished tasks before reset.' });
            }
            toast({ title: 'Unfinished tasks', description: 'You still have unfinished tasks before reset.' });
          }
        }
      }
    };

    // run now + per minute
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [tasks, toast, today]);

  // ---- stats yesterday
  const yesterdayStats = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = todayStr(d);
    const snap = snapshots.find(s => s.dateFor === y);
    if (snap) return snap;
    const yTasks = tasks.filter(t => t.dateFor === y);
    const added = yTasks.length;
    const done = yTasks.filter(t => t.completed).length;
    const remaining = added - done;
    const pct = added ? Math.round((done / added) * 100) : 0;
    return { dateFor: y, addedCount: added, doneCount: done, remainingCount: remaining, completionPct: pct };
  }, [snapshots, tasks]);

  // ---- CRUD
  const addTask = (dateFor: string, title: string) => {
    const v = title.trim();
    if (!v) return;
    const now = new Date();
    const task: Task = {
      id: String(now.getTime()) + Math.random().toString(36).slice(2),
      title: v,
      completed: false,
      dateFor,
      createdAt: now.toISOString(),
      createdTime: hhmmNow(),
    };
    setTasks(prev => [task, ...prev]);
  };
  const addTaskToday = () => addTask(today, newTaskToday);
  const addTaskTomorrow = () => addTask(tomorrow, newTaskTomorrow);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };
  const updateTitle = (id: string, newTitle: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, title: newTitle } : t)));
  };

  // ---- History: search / filter / sort + hiển thị tên task
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyMonth, setHistoryMonth] = useState<string>('all'); // '1'..'12' | 'all'
  const [historyYear, setHistoryYear] = useState<string>('all');   // 'yyyy' | 'all'
  const [historySort, setHistorySort] = useState<'date_desc' | 'date_asc' | 'pct_desc' | 'count_desc'>('date_desc');

  const historyDays = useMemo(() => {
    // tập hợp ngày có dữ liệu
    const dayKeys = Array.from(new Set([
      ...snapshots.map(s => s.dateFor),
      ...tasks.map(t => t.dateFor),
      today,
    ]));

    // lọc theo month/year + search
    const filtered = dayKeys.filter(d => {
      const date = new Date(d);
      const m = String(date.getMonth() + 1);
      const y = String(date.getFullYear());
      const okM = historyMonth === 'all' || historyMonth === m;
      const okY = historyYear === 'all' || historyYear === y;
      if (!okM || !okY) return false;

      if (!historyQuery.trim()) return true;
      const q = historyQuery.toLowerCase();
      const dayTasks = tasks.filter(t => t.dateFor === d);
      return dayTasks.some(t => t.title.toLowerCase().includes(q));
    });

    // sort
    filtered.sort((a, b) => {
      if (historySort === 'date_asc') return a.localeCompare(b);

      const calc = (day: string) => {
        const snap = snapshots.find(s => s.dateFor === day);
        if (snap) return { count: snap.addedCount, pct: snap.completionPct };
        const ds = tasks.filter(t => t.dateFor === day);
        const done = ds.filter(t => t.completed).length;
        const count = ds.length;
        const pct = count ? Math.round((done / count) * 100) : 0;
        return { count, pct };
      };

      if (historySort === 'pct_desc') return calc(b).pct - calc(a).pct;
      if (historySort === 'count_desc') return calc(b).count - calc(a).count;

      return b.localeCompare(a); // date_desc
    });

    // build data per-day
    return filtered.map(d => {
      const ds = tasks.filter(t => t.dateFor === d);
      const snap = snapshots.find(s => s.dateFor === d);
      const added = snap?.addedCount ?? ds.length;
      const done = snap?.doneCount ?? ds.filter(t => t.completed).length;
      const left = snap?.remainingCount ?? (added - done);
      const pct  = snap?.completionPct ?? (added ? Math.round((done / added) * 100) : 0);
      const completed = ds.filter(t => t.completed);
      const remaining = ds.filter(t => !t.completed);
      return { dateFor: d, added, done, left, pct, completed, remaining };
    });
  }, [snapshots, tasks, historyQuery, historyMonth, historyYear, historySort, today]);

  /* ===================== UI ===================== */

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Header stats */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Tasks</h1>
        <p className="text-muted-foreground">
          Today: {completedCountToday} of {todayTasks.length} completed
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Yesterday — Added: {yesterdayStats.addedCount} • Completed: {yesterdayStats.doneCount} • Remaining: {yesterdayStats.remainingCount} ({yesterdayStats.completionPct}%)
        </p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* TODAY */}
        <TabsContent value="today" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a task for today..."
                value={newTaskToday}
                onChange={(e) => setNewTaskToday(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTaskToday();
                    setNewTaskToday('');
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => { addTaskToday(); setNewTaskToday(''); }}
                size="icon"
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tasks for today</div>
            ) : (
              todayTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onEditTitle={updateTitle} />
              ))
            )}
          </div>
        </TabsContent>

        {/* TOMORROW */}
        <TabsContent value="tomorrow" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Plan a task for tomorrow..."
                value={newTaskTomorrow}
                onChange={(e) => setNewTaskTomorrow(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTaskTomorrow();
                    setNewTaskTomorrow('');
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => { addTaskTomorrow(); setNewTaskTomorrow(''); }}
                size="icon"
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {tomorrowTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tasks planned for tomorrow</div>
            ) : (
              tomorrowTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onEditTitle={updateTitle} />
              ))
            )}
          </div>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search in task titles..."
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
              >
                <option value="all">All months</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{`Month ${i + 1}`}</option>
                ))}
              </select>

              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={historyYear}
                onChange={(e) => setHistoryYear(e.target.value)}
              >
                <option value="all">All years</option>
                {Array.from(new Set([...snapshots.map(s => new Date(s.dateFor).getFullYear()), new Date().getFullYear()]))
                  .sort()
                  .map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
              </select>

              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value as any)}
              >
                <option value="date_desc">Sort by date (new→old)</option>
                <option value="date_asc">Sort by date (old→new)</option>
                <option value="pct_desc">Sort by completion %</option>
                <option value="count_desc">Sort by task count</option>
              </select>
            </div>
          </Card>

          <div className="space-y-3">
            {historyDays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No history yet</div>
            ) : (
              historyDays.map(day => (
                <Card key={day.dateFor} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{new Date(day.dateFor).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.added} tasks • {day.done} done • {day.left} left • {day.pct}%
                    </div>
                  </div>

                  {/* Danh sách task hoàn thành / còn lại */}
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Completed</div>
                      {day.completed.length === 0 ? (
                        <div className="text-xs text-muted-foreground/70">—</div>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1">
                          {day.completed.map(t => (
                            <li key={t.id} className="text-sm line-through text-muted-foreground">
                              {t.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Remaining</div>
                      {day.remaining.length === 0 ? (
                        <div className="text-xs text-muted-foreground/70">—</div>
                      ) : (
                        <ul className="list-disc pl-5 space-y-1">
                          {day.remaining.map(t => (
                            <li key={t.id} className="text-sm">{t.title}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ===================== Row ===================== */

const TaskRow: React.FC<{
  task: Task;
  onToggle: (id: string) => void;
  onEditTitle: (id: string, newTitle: string) => void;
}> = ({ task, onToggle, onEditTitle }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const save = () => {
    const v = draft.trim();
    if (v && v !== task.title) onEditTitle(task.id, v);
    setEditing(false);
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {/* Checkbox hoàn thành */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1"
        />

        {/* Nội dung task */}
        <div className="flex-1 min-w-0">
          {!editing ? (
            <>
              <div className="flex items-start gap-2">
                <div className={`flex-1 font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </div>

                {/* Nút Edit */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => {
                    setDraft(task.title);
                    setEditing(true);
                  }}
                  aria-label="Edit task"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {task.createdTime}
                </span>
                {task.note && <span className="truncate">{task.note}</span>}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save();
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="flex-1"
              />
              <Button onClick={save} variant="outline" size="sm">Save</Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
