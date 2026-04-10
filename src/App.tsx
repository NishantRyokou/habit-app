
import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  subDays, 
  startOfDay, 
  eachDayOfInterval, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  setMonth, 
  setYear,
  getWeek
} from 'date-fns';
import { 
  Plus, 
  LogOut, 
  Check, 
  X, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Target,
  Grid3X3,
  Settings2,
  Calendar as CalendarIcon,
  TrendingUp,
  PieChart as PieChartIcon,
  CheckSquare,
  Square,
  Heart,
  Zap,
  User as UserIcon,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from './lib/utils';

// --- Types ---

interface Habit {
  id: string;
  name: string;
  category: string;
  color: string;
  createdAt: number;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

interface WeeklyTask {
  id: string;
  name: string;
}

interface WeeklyLog {
  id: string;
  taskId: string;
  weekKey: string; // YYYY-MM-W
  completed: boolean;
}

interface SpecialTask {
  id: string;
  name: string;
  date: string;
  type: 'daily' | 'weekly';
  completed: boolean;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// --- Configuration & Constants ---
const CATEGORIES = ['Health', 'Productivity', 'Mindfulness', 'Personal Development'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const YEARS = [2023, 2024, 2025, 2026];

/**
 * Main Application Component
 * Manages authentication, data synchronization with Firebase, 
 * and the terminal-themed user interface.
 */
export default function App() {
  const [isInitialized, setIsInitialized] = useState(() => {
    return localStorage.getItem('isekai_initialized') === 'true';
  });
  
  // Data State
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('isekai_habits');
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState<HabitLog[]>(() => {
    const saved = localStorage.getItem('isekai_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>(() => {
    const saved = localStorage.getItem('isekai_weeklyTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>(() => {
    const saved = localStorage.getItem('isekai_weeklyLogs');
    return saved ? JSON.parse(saved) : [];
  });
  const [specialTasks, setSpecialTasks] = useState<SpecialTask[]>(() => {
    const saved = localStorage.getItem('isekai_specialTasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  // UI State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyGoal, setMonthlyGoal] = useState(75);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [isAddWeeklyOpen, setIsAddWeeklyOpen] = useState(false);
  const [isAddSpecialOpen, setIsAddSpecialOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Persistence Logic ---
  useEffect(() => {
    localStorage.setItem('isekai_initialized', JSON.stringify(isInitialized));
  }, [isInitialized]);

  useEffect(() => {
    localStorage.setItem('isekai_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('isekai_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('isekai_weeklyTasks', JSON.stringify(weeklyTasks));
  }, [weeklyTasks]);

  useEffect(() => {
    localStorage.setItem('isekai_weeklyLogs', JSON.stringify(weeklyLogs));
  }, [weeklyLogs]);

  useEffect(() => {
    localStorage.setItem('isekai_specialTasks', JSON.stringify(specialTasks));
  }, [specialTasks]);
  
  // Form State
  const [newHabit, setNewHabit] = useState({ name: '', category: 'Health', color: '#F8C8C8' });
  const [newWeekly, setNewWeekly] = useState('');
  const [newSpecial, setNewSpecial] = useState({ name: '', type: 'daily' as const });

  // Derived Data
  const currentMonthDate = useMemo(() => {
    return setYear(setMonth(new Date(), selectedMonth), selectedYear);
  }, [selectedMonth, selectedYear]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonthDate);
    const end = endOfMonth(currentMonthDate);
    return eachDayOfInterval({ start, end });
  }, [currentMonthDate]);

  // --- Data Mutation Handlers ---

  /**
   * Toggles a habit log for a specific date.
   * If a log exists, it's deleted (un-checked). Otherwise, a new one is created.
   */
  const toggleHabit = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingIndex = logs.findIndex(l => l.habitId === habitId && l.date === dateStr);
    
    if (existingIndex !== -1) {
      setLogs(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      const newLog: HabitLog = {
        id: crypto.randomUUID(),
        habitId,
        date: dateStr,
        completed: true
      };
      setLogs(prev => [...prev, newLog]);
    }
  };

  /**
   * Toggles a weekly ritual completion for a specific week.
   */
  const toggleWeekly = (taskId: string, weekIndex: number) => {
    const weekKey = `${selectedYear}-${selectedMonth}-${weekIndex}`;
    const existingIndex = weeklyLogs.findIndex(l => l.taskId === taskId && l.weekKey === weekKey);
    
    if (existingIndex !== -1) {
      setWeeklyLogs(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      const newLog: WeeklyLog = {
        id: crypto.randomUUID(),
        taskId,
        weekKey,
        completed: true
      };
      setWeeklyLogs(prev => [...prev, newLog]);
    }
  };

  const toggleSpecial = (id: string, completed: boolean) => {
    setSpecialTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !completed } : t
    ));
  };

  /**
   * Adds a new habit to the system.
   */
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;
    
    const habit: Habit = {
      ...newHabit,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    
    setHabits(prev => [...prev, habit]);
    setNewHabit({ name: '', category: 'Health', color: '#F8C8C8' });
    setIsAddHabitOpen(false);
  };

  const handleAddWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeekly) return;
    
    const task: WeeklyTask = {
      id: crypto.randomUUID(),
      name: newWeekly
    };
    
    setWeeklyTasks(prev => [...prev, task]);
    setNewWeekly('');
    setIsAddWeeklyOpen(false);
  };

  const handleAddSpecial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecial.name) return;
    
    const date = newSpecial.type === 'daily' 
      ? format(new Date(), 'yyyy-MM-dd') 
      : `${selectedYear}-${selectedMonth}-${getWeek(new Date())}`;
      
    const task: SpecialTask = {
      ...newSpecial,
      id: crypto.randomUUID(),
      date,
      completed: false
    };
    
    setSpecialTasks(prev => [...prev, task]);
    setNewSpecial({ name: '', type: 'daily' });
    setIsAddSpecialOpen(false);
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setLogs(prev => prev.filter(l => l.habitId !== id));
  };

  const deleteWeeklyTask = (id: string) => {
    setWeeklyTasks(prev => prev.filter(t => t.id !== id));
    setWeeklyLogs(prev => prev.filter(l => l.taskId !== id));
  };

  const deleteSpecialTask = (id: string) => {
    setSpecialTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- Data Derivation & Stats ---

  /**
   * Calculates completion rate and current streak for a habit.
   */
  const getHabitStats = (habitId: string) => {
    const monthLogs = logs.filter(l => l.habitId === habitId && l.date.startsWith(format(currentMonthDate, 'yyyy-MM')));
    const rate = Math.round((monthLogs.length / daysInMonth.length) * 100);
    
    let streak = 0;
    const today = startOfDay(new Date());
    for (let i = 0; i < 365; i++) {
      const d = subDays(today, i);
      const l = logs.find(log => log.habitId === habitId && log.date === format(d, 'yyyy-MM-dd'));
      if (l?.completed) streak++;
      else if (i > 0) break;
    }
    return { rate, streak };
  };

  const dailyCompletionData = useMemo(() => {
    return daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dailyLogs = logs.filter(l => l.date === dateStr && l.completed);
      const percentage = habits.length > 0 ? Math.round((dailyLogs.length / habits.length) * 100) : 0;
      return { name: format(day, 'dd'), percentage };
    });
  }, [daysInMonth, logs, habits]);

  const habitCompletionData = useMemo(() => {
    return habits.map(h => {
      const { rate } = getHabitStats(h.id);
      return { name: h.name, rate, color: h.color };
    });
  }, [habits, logs, currentMonthDate]);

  const categoryData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catHabits = habits.filter(h => h.category === cat);
      const completions = logs.filter(l => {
        const h = habits.find(hab => hab.id === l.habitId);
        return h?.category === cat && l.date.startsWith(format(currentMonthDate, 'yyyy-MM'));
      }).length;
      const totalPossible = catHabits.length * daysInMonth.length;
      const value = totalPossible > 0 ? Math.round((completions / totalPossible) * 100) : 0;
      return { name: cat, value };
    });
  }, [habits, logs, currentMonthDate]);

  // --- Main Render ---

  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-6xl font-mono font-bold text-terminal-green leading-tight tracking-tighter">HABIT_TRACKER</h1>
          <p className="text-sm tracking-widest uppercase opacity-60 mt-1 font-mono">{">"} hello! Developer welcome to isekai journey</p>
        </div>

        {isInitialized ? (
          <div className="flex items-center gap-4 bg-black p-2 rounded-none border border-terminal-green">
            <div className="flex items-center gap-3 px-4">
              <div className="w-8 h-8 rounded-none border border-terminal-green flex items-center justify-center text-terminal-green">
                <UserIcon size={16} />
              </div>
              <span className="text-xs font-medium">OFFLINE_USER</span>
            </div>
            <button onClick={() => setIsInitialized(false)} className="p-2 hover:bg-terminal-green hover:text-black transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button onClick={() => setIsInitialized(true)} className="px-8 py-3 border-2 border-terminal-green text-terminal-green font-bold hover:bg-terminal-green hover:text-black transition-all">
            [ INITIALIZE_JOURNEY ]
          </button>
        )}
      </header>

      {isInitialized && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Dashboard Top Section */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-black p-6 rounded-none border border-terminal-green space-y-4">
                <div className="flex items-center gap-2 text-terminal-green mb-2">
                  <CalendarIcon size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">SYSTEM_CALENDAR</span>
                </div>
                <div className="space-y-1 font-mono">
                  <div className="text-2xl font-bold text-terminal-green">
                    {format(currentTime, 'hh:mm:ss a')}
                  </div>
                  <div className="text-xs opacity-60 uppercase tracking-widest">
                    {format(currentTime, 'EEEE')}
                  </div>
                  <div className="text-xs opacity-60 uppercase tracking-widest">
                    {format(currentTime, 'MMMM do, yyyy')}
                  </div>
                </div>
                <div className="pt-4 border-t border-terminal-green-dim">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-terminal-green">GOAL</span>
                    <span className="text-sm font-mono">{monthlyGoal}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={monthlyGoal} 
                    onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                    className="w-full accent-terminal-green bg-black"
                  />
                </div>
                <div className="pt-4 border-t border-terminal-green-dim">
                  <div className="flex items-center gap-2 text-[10px] opacity-40 uppercase tracking-widest mb-2">
                    <span className="w-1 h-1 bg-terminal-green rounded-full animate-pulse"></span>
                    NAV_CONTROLS
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-black border border-terminal-green text-terminal-green rounded-none p-1 text-[10px] focus:ring-1 focus:ring-terminal-green"
                    >
                      {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-black border border-terminal-green text-terminal-green rounded-none p-1 text-[10px] focus:ring-1 focus:ring-terminal-green"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-black p-6 rounded-none border border-terminal-green">
                <div className="flex items-center gap-2 text-terminal-green mb-4">
                  <PieChartIcon size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">FOCUS_CHART</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="#000"
                        animationDuration={500}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[ '#00FF00', '#00CC00', '#009900', '#006600' ][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #00FF00', color: '#00FF00' }}
                        itemStyle={{ color: '#00FF00' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-black p-6 rounded-none border border-terminal-green">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-terminal-green">
                  <TrendingUp size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">PROGRESS</span>
                </div>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">COMPLETION</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#004400" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#008800' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#008800' }} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #00FF00', color: '#00FF00' }}
                      itemStyle={{ color: '#00FF00' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#00FF00" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#00FF00', strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 pt-6 border-t border-terminal-green-dim space-y-2 font-mono">
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} mariuana is the best medicine for dealing with fools
                </p>
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} you are the honoured one
                </p>
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} stop fucking with people who make you feel average
                </p>
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} embrace the grind, master the game
                </p>
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} your only limit is the one you set yourself
                </p>
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} consistency is the bridge between goals and accomplishment
                </p>
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} code is poetry, logic is the rhythm
                </p>
                <p className="text-xs text-terminal-green opacity-80 uppercase tracking-widest">
                  {">"} build things that matter, or don't build at all
                </p>
                
                <div className="mt-8 font-mono text-[10px] text-terminal-green opacity-40 whitespace-pre leading-none">
{`           
    11111111111111111111111111111111111111111111111111111111111111111111111111111111
    10000000000000000000000000000000000000000000000000000000000000000000000000000001
    11111111111111111111111111111111111111111111111111111111111111111111111111111111`}
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-8">
              {/* Daily Tasks Core */}
              <section className="bg-black rounded-none border border-terminal-green overflow-hidden">
                <div className="p-6 border-b border-terminal-green-dim flex justify-between items-center">
                  <div className="flex items-center gap-2 text-terminal-green">
                    <CheckSquare size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">DAILY_HABIT</span>
                  </div>
                  <button 
                    onClick={() => setIsAddHabitOpen(true)}
                    className="text-xs font-bold text-terminal-green hover:bg-terminal-green hover:text-black px-2 py-1 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> NEW_HABIT
                  </button>
                </div>

                <div className="overflow-x-auto terminal-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black">
                        <th className="p-4 border-r border-terminal-green-dim w-64 sticky left-0 bg-black z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">HABIT / CATEGORY</span>
                        </th>
                        {daysInMonth.map(day => (
                          <th key={day.toISOString()} className="p-2 border-r border-terminal-green-dim text-center min-w-[40px]">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] opacity-40 uppercase mb-1">{format(day, 'EEE')}</span>
                              <span className={cn(
                                "text-xs font-bold",
                                isSameDay(day, new Date()) && "text-terminal-green underline"
                              )}>{format(day, 'd')}</span>
                            </div>
                          </th>
                        ))}
                        <th className="p-4 border-l border-terminal-green-dim text-center w-24">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">STREAK</span>
                        </th>
                        <th className="p-4 border-l border-terminal-green-dim text-center w-24">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">SUCCESS_%</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {habits.map(habit => {
                        const { rate, streak } = getHabitStats(habit.id);
                        return (
                          <tr key={habit.id} className="border-b border-terminal-green-dim group hover:bg-terminal-green hover:bg-opacity-5 transition-colors">
                            <td className="p-4 border-r border-terminal-green-dim sticky left-0 bg-black group-hover:bg-zinc-950 z-10">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{habit.name}</p>
                                  <p className="text-[9px] uppercase tracking-widest opacity-40">{habit.category}</p>
                                </div>
                                <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                            {daysInMonth.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const isDone = logs.some(l => l.habitId === habit.id && l.date === dateStr && l.completed);
                              return (
                                <td key={day.toISOString()} className="p-1 border-r border-terminal-green-dim text-center">
                                  <button 
                                    onClick={() => toggleHabit(habit.id, day)}
                                    className={cn(
                                      "w-7 h-7 rounded-none mx-auto flex items-center justify-center transition-all border",
                                      isDone ? "bg-terminal-green text-black border-terminal-green" : "bg-black border-terminal-green-dim hover:border-terminal-green"
                                    )}
                                  >
                                    {isDone && <Check size={14} strokeWidth={3} />}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="p-4 border-l border-terminal-green-dim text-center">
                              <div className="flex items-center justify-center gap-1 text-terminal-green">
                                <Flame size={14} />
                                <span className="text-xs font-bold">{streak}</span>
                              </div>
                            </td>
                            <td className="p-4 border-l border-terminal-green-dim text-center">
                              <span className={cn(
                                "text-xs font-bold",
                                rate >= monthlyGoal ? "text-terminal-green" : "text-orange-500"
                              )}>{rate}%</span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-black">
                        <td className="p-4 border-r border-terminal-green-dim sticky left-0 bg-black z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">DAY_SUCCESS%</span>
                        </td>
                        {daysInMonth.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const dailyLogs = logs.filter(l => l.date === dateStr && l.completed);
                          const percentage = habits.length > 0 ? Math.round((dailyLogs.length / habits.length) * 100) : 0;
                          return (
                            <td key={day.toISOString()} className="p-2 border-r border-terminal-green-dim text-center">
                              <span className="text-[10px] font-bold opacity-60">{percentage}%</span>
                            </td>
                          );
                        })}
                        <td colSpan={2} className="bg-black"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Weekly Tasks (Bottom Left) */}
              <section className="bg-black rounded-none border border-terminal-green p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2 text-terminal-green">
                    <Zap size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">WEEKLY_RITUALS</span>
                  </div>
                  <button onClick={() => setIsAddWeeklyOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-terminal-green hover:underline">ADD_RITUAL</button>
                </div>
                
                <div className="overflow-x-auto terminal-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-terminal-green-dim">
                        <th className="pb-4 pr-4 text-[10px] font-bold uppercase tracking-widest opacity-40">TASK</th>
                        {[1, 2, 3, 4, 5].map(w => (
                          <th key={w} className="pb-4 px-2 text-center text-[10px] font-bold uppercase tracking-widest opacity-40">W{w}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyTasks.map(task => (
                        <tr key={task.id} className="border-b border-terminal-green-dim last:border-0">
                          <td className="py-4 pr-4">
                            <div className="flex items-center justify-between group">
                              <span className="text-sm">{task.name}</span>
                              <button onClick={() => deleteWeeklyTask(task.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </td>
                          {[1, 2, 3, 4, 5].map(w => {
                            const weekKey = `${selectedYear}-${selectedMonth}-${w}`;
                            const isDone = weeklyLogs.some(l => l.taskId === task.id && l.weekKey === weekKey && l.completed);
                            return (
                              <td key={w} className="py-4 px-2 text-center">
                                <button 
                                  onClick={() => toggleWeekly(task.id, w)}
                                  className={cn(
                                    "w-6 h-6 rounded-none mx-auto flex items-center justify-center transition-all border",
                                    isDone ? "bg-terminal-green text-black border-terminal-green" : "bg-black border-terminal-green-dim hover:border-terminal-green"
                                  )}
                                >
                                  {isDone && <Check size={12} strokeWidth={3} />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Special Tasks (Right Side) */}
            <div className="xl:col-span-1 space-y-8">
              <div className="bg-black rounded-none border border-terminal-green p-6 h-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2 text-terminal-green">
                    <Heart size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">SPECIAL_INTENTIONS</span>
                  </div>
                  <button onClick={() => setIsAddSpecialOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-terminal-green hover:underline">ADD</button>
                </div>

                <div className="space-y-8">
                  {/* Today's Special */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4 flex items-center justify-between">
                      TODAY_FOCUS <span>{format(new Date(), 'MMM d')}</span>
                    </h4>
                    <div className="space-y-3">
                      {specialTasks.filter(t => t.type === 'daily' && t.date === format(new Date(), 'yyyy-MM-dd')).map(task => (
                        <div key={task.id} className="flex items-center gap-3 group">
                          <button onClick={() => toggleSpecial(task.id, task.completed)}>
                            {task.completed ? <CheckSquare size={18} className="text-terminal-green" /> : <Square size={18} className="text-terminal-green-dim" />}
                          </button>
                          <span className={cn("text-sm transition-all", task.completed && "line-through opacity-40 text-terminal-green-dim")}>{task.name}</span>
                          <button onClick={() => deleteSpecialTask(task.id)} className="opacity-0 group-hover:opacity-100 ml-auto text-red-500"><Trash2 size={12} /></button>
                        </div>
                      ))}
                      {specialTasks.filter(t => t.type === 'daily' && t.date === format(new Date(), 'yyyy-MM-dd')).length === 0 && (
                        <p className="text-[10px] italic opacity-30">NO_TASKS_TODAY</p>
                      )}
                    </div>
                  </div>

                  {/* Week's Special */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">WEEKLY_INTENTIONS</h4>
                    <div className="space-y-3">
                      {specialTasks.filter(t => t.type === 'weekly').map(task => (
                        <div key={task.id} className="flex items-center gap-3 group">
                          <button onClick={() => toggleSpecial(task.id, task.completed)}>
                            {task.completed ? <CheckSquare size={18} className="text-terminal-green" /> : <Square size={18} className="text-terminal-green-dim" />}
                          </button>
                          <span className={cn("text-sm transition-all", task.completed && "line-through opacity-40 text-terminal-green-dim")}>{task.name}</span>
                          <button onClick={() => deleteSpecialTask(task.id)} className="opacity-0 group-hover:opacity-100 ml-auto text-red-500"><Trash2 size={12} /></button>
                        </div>
                      ))}
                      {specialTasks.filter(t => t.type === 'weekly').length === 0 && (
                        <p className="text-[10px] italic opacity-30">NO_WEEKLY_INTENTIONS</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-black p-8 rounded-none border border-terminal-green">
            <div className="flex items-center gap-2 text-terminal-green mb-8">
              <TrendingUp size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">HABIT_SUCCESS_RATES</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitCompletionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#004400" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#008800' }} unit="%" />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#00FF00' }} width={120} />
                  <Tooltip cursor={{ fill: '#002200' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #00FF00', color: '#00FF00' }} />
                  <Bar dataKey="rate" radius={[0, 0, 0, 0]} barSize={20} animationDuration={500}>
                    {habitCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#00FF00" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 p-6 bg-zinc-950 rounded-none border border-terminal-green-dim">
              <h4 className="text-sm font-bold text-terminal-green mb-2">{"//"} A message to you, developer</h4>
              <p className="text-xs leading-relaxed opacity-70">
                You are in the top branch, studying what others only dream of. This isn't just luck; it's your destiny to write your own story. Keep building, keep grinding, and never settle for average.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isAddHabitOpen && (
          <Modal title="NEW_HABIT_ENTRY" onClose={() => setIsAddHabitOpen(false)}>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <input 
                type="text" placeholder="HABIT_NAME" value={newHabit.name} 
                onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                className="w-full p-3 bg-black border border-terminal-green text-terminal-green rounded-none focus:ring-1 focus:ring-terminal-green"
              />
              <select 
                value={newHabit.category} 
                onChange={e => setNewHabit({...newHabit, category: e.target.value})}
                className="w-full p-3 bg-black border border-terminal-green text-terminal-green rounded-none focus:ring-1 focus:ring-terminal-green"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                {['#00FF00', '#00CC00', '#009900', '#006600', '#004400'].map(c => (
                  <button key={c} type="button" onClick={() => setNewHabit({...newHabit, color: c})} className={cn("w-8 h-8 rounded-none border", newHabit.color === c ? "border-white" : "border-terminal-green-dim")} style={{ backgroundColor: c }} />
                ))}
              </div>
              <button type="submit" className="w-full py-3 bg-terminal-green text-black font-bold shadow-sm hover:bg-white transition-colors">INITIALIZE_HABIT</button>
            </form>
          </Modal>
        )}

        {isAddWeeklyOpen && (
          <Modal title="NEW_WEEKLY_RITUAL" onClose={() => setIsAddWeeklyOpen(false)}>
            <form onSubmit={handleAddWeekly} className="space-y-4">
              <input 
                type="text" placeholder="RITUAL_NAME" value={newWeekly} 
                onChange={e => setNewWeekly(e.target.value)}
                className="w-full p-3 bg-black border border-terminal-green text-terminal-green rounded-none focus:ring-1 focus:ring-terminal-green"
              />
              <button type="submit" className="w-full py-3 bg-terminal-green text-black font-bold shadow-sm hover:bg-white transition-colors">ADD_RITUAL</button>
            </form>
          </Modal>
        )}

        {isAddSpecialOpen && (
          <Modal title="NEW_INTENTION" onClose={() => setIsAddSpecialOpen(false)}>
            <form onSubmit={handleAddSpecial} className="space-y-4">
              <input 
                type="text" placeholder="INTENTION_NAME" value={newSpecial.name} 
                onChange={e => setNewSpecial({...newSpecial, name: e.target.value})}
                className="w-full p-3 bg-black border border-terminal-green text-terminal-green rounded-none focus:ring-1 focus:ring-terminal-green"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewSpecial({...newSpecial, type: 'daily'})} className={cn("flex-1 py-2 rounded-none text-xs font-bold border", newSpecial.type === 'daily' ? "bg-terminal-green text-black border-terminal-green" : "bg-black text-terminal-green border-terminal-green")}>DAILY</button>
                <button type="button" onClick={() => setNewSpecial({...newSpecial, type: 'weekly'})} className={cn("flex-1 py-2 rounded-none text-xs font-bold border", newSpecial.type === 'weekly' ? "bg-terminal-green text-black border-terminal-green" : "bg-black text-terminal-green border-terminal-green")}>WEEKLY</button>
              </div>
              <button type="submit" className="w-full py-3 bg-terminal-green text-black font-bold shadow-sm hover:bg-white transition-colors">SET_INTENTION</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Creator Section */}
      <section className="max-w-7xl mx-auto mt-12 bg-black p-8 rounded-none border border-terminal-green shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-none border-2 border-terminal-green flex items-center justify-center bg-zinc-950 relative group">
            <Terminal size={48} className="text-terminal-green group-hover:scale-110 transition-transform" />
            <div className="absolute -bottom-2 -right-2 bg-terminal-green text-black text-[8px] font-bold px-1">VERIFIED</div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <h3 className="text-2xl font-mono font-bold text-terminal-green uppercase tracking-tighter">
                CREATOR: NISHANT
              </h3>
              <span className="text-[10px] px-2 py-0.5 border border-terminal-green text-terminal-green opacity-50">v1.0.42</span>
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-xs font-mono text-terminal-green opacity-70 leading-relaxed">
                {">"} feel free to edit and customize however you want from repository
              </p>
              <p className="text-xs font-mono text-terminal-green opacity-70 leading-relaxed">
                {">"} designed just for my personal use you can benefit from it...
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <a 
                href="https://github.com/nishantryokou" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-black bg-terminal-green px-4 py-2 hover:bg-white transition-all active:scale-95"
              >
                <Terminal size={16} />
                GITHUB_PROFILE
              </a>
              <div className="text-[10px] font-mono text-terminal-green opacity-40">
                ID: nishantryokou // ACCESS: GRANTED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer: Tech Stack & Skills */}
      <footer className="max-w-7xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-black rounded-none border border-terminal-green shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-terminal-green mb-4 uppercase tracking-widest">{"<"} FRONTEND_DEVELOPMENT {"/>"}</h4>
          <p className="text-xs leading-relaxed opacity-60">
            Stack: HTML5, CSS3, JavaScript (ES6+), React.js, Angular, Vue.js, Next.js
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-terminal-green mb-4 uppercase tracking-widest">{"["} BACKEND_DEVELOPMENT {"]"}</h4>
          <p className="text-xs leading-relaxed opacity-60">
            Stack: Node.js, Python, Ruby, Java, PHP, Firebase
          </p>
        </div>
      </footer>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-black rounded-none border border-terminal-green p-8">
        <h3 className="text-2xl font-mono font-bold text-terminal-green mb-6">{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}
