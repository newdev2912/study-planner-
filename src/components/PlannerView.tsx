import React from 'react';
import { ListTodo, CheckCircle2, Calendar as CalendarIcon, Trophy, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { GlowCard, ProgressBar } from './Shared';
import { StudyJourney, Task, UserStats } from '../types';
import { cn } from '../lib/utils';

interface PlannerViewProps {
  journey: StudyJourney;
  stats: UserStats;
  completionPercentage: number;
  level: number;
  levelProgress: number;
  nextLevelXP: number;
  setView: (view: 'home' | 'planner') => void;
  handleToggleTask: (taskId: string) => void;
}

export const PlannerView = ({ journey, stats, completionPercentage, level, levelProgress, nextLevelXP, setView, handleToggleTask }: PlannerViewProps) => {
  const COLORS = ['#6366f1', '#a855f7', '#f59e0b', '#ef4444'];
  const categoryData = [
    { name: 'Theory', value: journey.daily_tasks.filter(t => t.category === 'Theory').length },
    { name: 'Practical', value: journey.daily_tasks.filter(t => t.category === 'Practical Application').length },
    { name: 'Review', value: journey.daily_tasks.filter(t => t.category === 'Review Day').length },
    { name: 'Project', value: journey.daily_tasks.filter(t => t.category === 'Boss Battle Project').length },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-12 gap-8 max-w-[1600px] mx-auto px-6 py-8">
      {/* Left Panel: Tasks */}
      <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto max-h-[85vh] no-scrollbar pr-2">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-400" />
            Objectives
          </h2>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
            {journey.daily_tasks.filter(t => t.completed).length} / {journey.daily_tasks.length}
          </span>
        </div>

        <div className="space-y-4">
          {journey.daily_tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleToggleTask(task.id)}
              className={cn(
                "group bg-slate-900/50 border border-slate-800 rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden",
                task.completed ? "border-green-500/20 bg-green-500/[0.02]" : "hover:border-indigo-500/50"
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                  task.completed ? "bg-green-500 border-green-500" : "border-slate-700 group-hover:border-indigo-500"
                )}>
                  {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{task.subject}</span>
                    <span className="text-[10px] font-bold text-slate-500 italic">{task.estimated_minutes}m</span>
                  </div>
                  <h4 className={cn("text-sm font-bold leading-tight", task.completed ? "text-slate-500 line-through" : "text-slate-200")}>
                    {task.task_title}
                  </h4>
                </div>
              </div>
              {task.completed && <div className="absolute inset-y-0 right-0 w-1 bg-green-500" />}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Center Panel: Calendar & Analytics */}
      <div className="col-span-12 lg:col-span-6 space-y-6">
        <GlowCard className="p-8">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-indigo-500" />
                Mission Continuity
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full border border-green-500/20 uppercase tracking-widest">Streak: {stats.streak}d</span>
              </div>
           </div>

           {/* Reduced height calendar grid */}
           <div className="grid grid-cols-7 gap-1.5 mb-8">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={`${d}-${i}`} className="text-center text-[10px] font-black text-slate-600 uppercase mb-1">{d}</div>
              ))}
              {eachDayOfInterval({
                start: startOfMonth(new Date()),
                end: endOfMonth(new Date())
              }).map((date, idx) => {
                const isDone = isToday(date) ? completionPercentage === 100 : false;
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "h-8 flex items-center justify-center text-xs font-black transition-all rounded-lg",
                      isToday(date) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500",
                      isDone && !isToday(date) && "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                    )}
                  >
                    {format(date, 'd')}
                  </div>
                );
              })}
           </div>

           <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { day: 'Mon', xp: 400 },
                  { day: 'Tue', xp: 750 },
                  { day: 'Wed', xp: 600 },
                  { day: 'Thu', xp: 1200 },
                  { day: 'Fri', xp: 1100 },
                  { day: 'Sat', xp: 1800 },
                  { day: 'Sun', xp: stats.totalXP }
                ]}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="day" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="xp" stroke="#6366f1" fillOpacity={1} fill="url(#colorXp)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </GlowCard>
      </div>

      {/* Right Panel: Gamified Stats */}
      <div className="col-span-12 lg:col-span-3 space-y-6">
        <GlowCard className="bg-gradient-to-br from-indigo-900/40 to-slate-900/50 border-indigo-500/20">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-4xl mb-4 relative shadow-2xl shadow-indigo-500/20">
               👑
               <div className="absolute -bottom-2 bg-slate-900 px-4 py-1 rounded-full border border-slate-800 text-xs font-black uppercase tracking-widest text-indigo-400">
                 Level {level}
               </div>
            </div>
            <h3 className="text-xl font-black mb-1">Academic Paladin</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Current Rank</p>
            
            <div className="w-full space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                  <span>Level Progress</span>
                  <span>{Math.round(levelProgress)}%</span>
               </div>
               <ProgressBar progress={levelProgress} />
               <div className="flex justify-between text-[10px] font-bold text-indigo-400/60 uppercase pt-1">
                  <span>{stats.totalXP} XP</span>
                  <span>{nextLevelXP} XP</span>
               </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard>
           <h3 className="font-bold text-sm mb-6 flex items-center gap-2">
             <Trophy className="w-4 h-4 text-amber-500" />
             Achievements
           </h3>
           <div className="space-y-4">
              {[
                { label: 'Deep Work King', icon: '🧠', val: '12h Focus' },
                { label: 'Consistent Monk', icon: '🧘', val: '7d Streak' },
                { label: 'Subject Master', icon: '📚', val: 'Calc III' }
              ].map(ach => (
                <div key={ach.label} className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <span className="text-xl">{ach.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{ach.label}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">{ach.val}</p>
                  </div>
                </div>
              ))}
           </div>
        </GlowCard>

        <button 
          onClick={() => setView('home')}
          className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Base
        </button>
      </div>
    </div>
  );
};
