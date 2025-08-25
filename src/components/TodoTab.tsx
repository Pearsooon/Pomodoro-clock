import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Task = {
  id: string;
  title: string;
  note?: string;
  completed: boolean;
  /** yyyy-mm-dd (ngày mà task thuộc về, Today/Tomorrow dựa theo field này) */
  dateFor: string;
  createdAt: string; // ISO
  createdTime: string; // HH:mm
};

type DaySnapshot = {
  dateFor: string; // yyyy-mm-dd
  addedCount: number;
  doneCount: number;
  remainingCount: number;
  completionPct: number; // 0..100
};

const LS_TASKS = 'todo_tasks_v1';
const LS_SNAPSHOTS = 'todo_snapshots_v1';
const LS_LAST_RESET = 'todo_last_reset_v1';

// Cấu hình nhắc nhở / reset (có thể chuyển sang Settings sau)
const EVENING_REMIND = '20:30'; // HH:mm – nhắc lập kế hoạch ngày mai
const RESET_TIME = '00:00';     // HH:mm – chốt ngày & carry-over

function todayStr(d = new Date()) {
  return d.toLocaleDateString('en-CA'); // yyyy-mm-dd
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayStr(d);
}
function isSameYMD(a: string, b: string) {
  return a === b;
}
function hhmmNow() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const TodoTab: React.FC = () => {
  const { toast } = useToast();

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

  const [newTaskToday, setNewTaskToday] = useState('');
  const [newTaskTomorrow, setNewTaskTomorrow] = useState('');

  // ===== Persist anytime lists change
  useEffect(() => {
    localStorage.setItem(LS_TASKS, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(LS_SNAPSHOTS, JSON.stringify(snapshots));
  }, [snapshots]);

  // ===== Daily reset & carry-over logic (run on mount and then every minute)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nowYMD = todayStr(now);
      const lastReset = localStorage.getItem(LS_LAST_RESET);
      const nowHHMM = hhmmNow();

      // 1) Ở thời điểm RESET_TIME mỗi ngày: tạo snapshot ngày hôm nay, carry unfinished sang ngày mai
      if (nowHHMM === RESET_TIME && lastReset !== nowYMD) {
        // snapshot cho ngày hiện tại (đã kết thúc)
        const day = nowYMD;
        const dayTasks = tasks.filter(t => t.dateFor === day);
        if (dayTasks.length > 0) {
          const addedCount = dayTasks.length;
          const doneCount = dayTasks.filter(t => t.completed).length;
          const remainingCount = addedCount - doneCount;
          const completionPct = Math.round((doneCount / addedCount) * 100);
          setSnapshots(prev => {
            const filtered = prev.filter(s => s.dateFor !== day);
            return [...filtered, { dateFor: day, addedCount, doneCount, remainingCount, completionPct }];
          });
        }

        // carry-over unfinished -> tomorrow
        const tomorrow = tomorrowStr();
        setTasks(prev => {
          const carry = prev
            .filter(t => t.dateFor === day && !t.completed)
            .map(t => ({ ...t, dateFor: tomorrow } as Task));
          const keepOthers = prev.filter(t => t.dateFor !== day || t.completed);
          return [...carry, ...keepOthers];
        });

        localStorage.setItem(LS_LAST_RESET, nowYMD);
      }

      // 2) Evening remind nếu chưa có task cho ngày mai
      if (nowHHMM === EVENING_REMIND) {
        const existTomorrow = tasks.some(t => t.dateFor === tomorrowStr());
        if (!existTomorrow) {
          toast({
            title: 'Plan tomorrow?',
            description: 'You have not added any tasks for tomorrow yet.',
          });
        }
      }
    };

    // tick ngay khi mount để xử lý nếu app mở sau reset-time
    tick();
    const id = setInterval(tick, 60 * 1000); // mỗi phút
    return () => clearInterval(id);
  }, [tasks, toast]);

  // ===== Yesterday stats (Added/Completed/Remaining)
  const yesterdayStats = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = todayStr(d);
    const snap = snapshots.find(s => s.dateFor === y);
    if (snap) return snap;
    const yTasks = tasks.filter(t => t.dateFor === y);
    const added = yTasks.length;
    const done = yTasks.filter(t => t.completed).length;
    const rem = added - done;
    const pct = added ? Math.round((done / added) * 100) : 0;
    return { dateFor: y, addedCount: added, doneCount: done, remainingCount: rem, completionPct: pct };
  }, [snapshots, tasks]);

  // ===== Derived lists
  const today = todayStr();
  const tomorrow = tomorrowStr();

  const todayTasks = tasks.filter(t => t.dateFor === today);
  const tomorrowTasks = tasks.filter(t => t.dateFor === tomorrow);

  const completedCountToday = todayTasks.filter(t => t.completed).length;

  // ===== CRUD
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
      createdTime: hhmmNow(), // ⬅️ thêm thời gian hiện tại
    };
    setTasks(prev => [task, ...prev]);
  };

  const addTaskToday = () => addTask(today, newTaskToday), clearToday = () => setNewTaskToday('');
  const addTaskTomorrow = () => addTask(tomorrow, newTaskTomorrow), clearTomorrow = () => setNewTaskTomorrow('');

  useEffect(() => { /* clear input sau khi add */ }, [todayTasks.length]); // no-op; bạn có thể bỏ

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const updateTitle = (id: string, newTitle: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, title: newTitle } : task));
  };

  // ===== History search/sort
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyMonth, setHistoryMonth] = useState<string>('all'); // '1'..'12' | 'all'
  const [historyYear, setHistoryYear] = useState<string>('all');   // '2024'.. | 'all'
  const [historySort, setHistorySort] = useState<'date_desc' | 'date_asc' | 'pct_desc' | 'count_desc'>('date_desc');

  const historySnapshots = useMemo(() => {
    let list = [...snapshots];

    // tạo snapshot tạm cho ngày hôm nay (đang chạy) để xem lịch sử
    const addedCount = todayTasks.length;
    const doneCount = todayTasks.filter(t => t.completed).length;
    const remainingCount = addedCount - doneCount;
    const completionPct = addedCount ? Math.round((doneCount / addedCount) * 100) : 0;
    list = list.filter(s => s.dateFor !== today);
    list.push({ dateFor: today, addedCount, doneCount, remainingCount, completionPct });

    // lọc theo query (tìm trong tiêu đề task của ngày đó)
    if (historyQuery.trim()) {
      const q = historyQuery.toLowerCase();
      list = list.filter(s => {
        const dayTasks = tasks.filter(t => t.dateFor === s.dateFor);
        return dayTasks.some(t => t.title.toLowerCase().includes(q));
      });
    }

    // lọc theo month/year
    list = list.filter(s => {
      const d = new Date(s.dateFor);
      const m = String(d.getMonth() + 1);
      const y = String(d.getFullYear());
      const okM = historyMonth === 'all' || historyMonth === m;
      const okY = historyYear === 'all' || historyYear === y;
      return okM && okY;
    });

    // sort
    list.sort((a, b) => {
      switch (historySort) {
        case 'date_asc': return a.dateFor.localeCompare(b.dateFor);
        case 'pct_desc': return b.completionPct - a.completionPct;
        case 'count_desc': return (b.addedCount) - (a.addedCount);
        default: // 'date_desc'
          return b.dateFor.localeCompare(a.dateFor);
      }
    });

    return list;
  }, [snapshots, tasks, todayTasks, historyQuery, historyMonth, historyYear, historySort]);

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

        {/* TOMORROW (kế hoạch ngày mai) */}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
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
                  <option key={i+1} value={String(i+1)}>{`Month ${i+1}`}</option>
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
                  .map(y => <option key={y} value={String(y)}>{y}</option>)
                }
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
            {historySnapshots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No history yet</div>
            ) : (
              historySnapshots.map(s => (
                <Card key={s.dateFor} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4"/>
                      <span className="font-medium">{new Date(s.dateFor).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {s.addedCount} tasks • {s.doneCount} done • {s.remainingCount} left • {s.completionPct}%
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
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          {!editing ? (
            <div className="group">
              <div
                className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                onDoubleClick={() => setEditing(true)}
                title="Double-click to edit"
              >
                {task.title}
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
            </div>
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
              />
              <Button onClick={save} variant="outline" size="sm">Save</Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
