import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  note?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export const TodoTab: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete project documentation',
      note: 'Review and finalize all project docs',
      completed: false,
      dueDate: '2024-01-15',
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      title: 'Team meeting prep',
      completed: true,
      createdAt: '2024-01-09'
    }
  ]);
  
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [task, ...prev]);
      setNewTask('');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const today = new Date().toDateString();
    const taskDate = new Date(dateString).toDateString();
    return today === taskDate;
  };

  const todayTasks = tasks.filter(task => isToday(task.dueDate) || isToday(task.createdAt));
  const completedCount = tasks.filter(task => task.completed).length;

  return (
    <div className="p-6 pb-20 space-y-6">
      {/* Header stats */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Tasks</h1>
        <p className="text-muted-foreground">
          {completedCount} of {tasks.length} tasks completed
        </p>
      </div>

      {/* Add new task */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            className="flex-1"
          />
          <Button onClick={addTask} size="icon" className="shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Task list tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-3 mt-4">
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks for today
            </div>
          ) : (
            todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-3 mt-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; onToggle: (id: string) => void }> = ({ task, onToggle }) => (
  <Card className="p-4">
    <div className="flex items-start gap-3">
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </div>
        {task.note && (
          <div className="text-sm text-muted-foreground mt-1">{task.note}</div>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  </Card>
);