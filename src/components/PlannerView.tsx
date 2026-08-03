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
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  
  const allTags = Array.from(new Set(journey.daily_tasks.flatMap(t => t.tags || [])));

  const filteredTasks = selectedTag 
    ? journey.daily_tasks.filter(t => t.tags?.includes(selectedTag))
    : journey.daily_tasks;

  const categoryData = [
    { name: 'Theory', value: journey.daily_tasks.filter(t => t.category === 'Theory').length },
    { name: 'Practical', value: journey.daily_tasks.filter(t => t.category === 'Practical Application').length },
    { name: 'Review', value: journey.daily_tasks.filter(t => t.category === 'Review Day').length },
    { name: 'Project', value: journey.daily_tasks.filter(t => t.category === 'Boss Battle Project').length },
  ].filter(d => d.value > 0);

  return (
    <div className="h-full max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-12 gap-6 overflow-hidden">
      {/* Left Panel: Tasks */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden min-h-0">
        <GlowCard glowColor="blue" className="flex-1 flex flex-col overflow-hidden min-h-0 p-6 border-blue-500/10">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-400" />
              Objectives
            </h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {filteredTasks.filter(t => t.completed).length} / {filteredTasks.length}
            </span>
          </div>

          {/* Tag Cloud */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                  selectedTag === null 
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                )}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                    selectedTag === tag 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
            {filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleToggleTask(task.id)}
                className={cn(
                  "group bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden",
                  task.completed ? "border-green-500/20 bg-green-500/[0.02]" : "hover:border-blue-500/40 hover:bg-slate-900/40"
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                    task.completed ? "bg-green-500 border-green-500" : "border-slate-700 group-hover:border-blue-500"
                  )}>
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">{task.subject}</span>
                      <span className="text-[10px] font-bold text-slate-600 italic">{task.estimated_minutes}m</span>
                    </div>
                    <h4 className={cn("text-sm font-bold leading-tight mb-2", task.completed ? "text-slate-600 line-through" : "text-slate-200")}>
                      {task.task_title}
                    </h4>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map(tag => (
                          <span key={tag} className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-slate-900/50 text-slate-500 rounded border border-slate-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {task.completed && <div className="absolute inset-y-0 right-0 w-1 bg-green-500" />}
              </motion.div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Center Panel: Calendar & Analytics */}
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 overflow-hidden min-h-0">
        <GlowCard glowColor="orange" className="flex-1 p-8 border-orange-500/20 flex flex-col overflow-hidden min-h-0">
           <div className="flex items-center justify-between mb-8 flex-shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-orange-500" />
                Mission Continuity
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full border border-green-500/20 uppercase tracking-widest">Streak: {stats.streak}d</span>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
             {/* Reduced height calendar grid */}
             <div className="grid grid-cols-7 gap-2 mb-10">
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
                        "aspect-square flex items-center justify-center text-xs font-black transition-all rounded-xl border border-transparent",
                        isToday(date) ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30" : "text-slate-500 bg-slate-950/40 hover:border-slate-700",
                        isDone && !isToday(date) && "bg-orange-500/20 text-orange-300 border-orange-500/20"
                      )}
                    >
                      {format(date, 'd')}
                    </div>
                  );
                })}
             </div>

             <div className="h-56 w-full mt-auto">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">XP ACCRETION RATE</p>
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
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="day" hide />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="xp" stroke="#f59e0b" fillOpacity={1} fill="url(#colorXp)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
           </div>
        </GlowCard>
      </div>

      {/* Right Panel: Gamified Stats */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden min-h-0">
        <GlowCard glowColor="purple" className="flex-shrink-0 bg-gradient-to-br from-purple-900/40 to-slate-900/50 border-purple-500/20 hover:border-purple-500/50">
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-3xl mb-4 relative shadow-2xl shadow-purple-500/20 flex-shrink-0">
               👑
               <div className="absolute -bottom-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-[10px] font-black uppercase tracking-widest text-purple-400 shadow-xl">
                 Level {level}
               </div>
            </div>
            <h3 className="text-lg font-black mb-1">Academic Paladin</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-6">Current Rank</p>
            
            <div className="w-full space-y-2">
               <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                  <span>Progress</span>
                  <span>{Math.round(levelProgress)}%</span>
               </div>
               <ProgressBar progress={levelProgress} color="bg-purple-500" />
               <div className="flex justify-between text-[10px] font-bold text-purple-400/60 uppercase pt-1">
                  <span>{stats.totalXP} XP</span>
                  <span>{nextLevelXP} XP</span>
               </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard glowColor="yellow" className="flex-1 flex flex-col border-yellow-500/20 overflow-hidden min-h-0">
           <h3 className="font-bold text-sm mb-6 flex items-center gap-2 flex-shrink-0">
             <Trophy className="w-4 h-4 text-yellow-500" />
             Achievements
           </h3>
           <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
              {[
                { label: 'Deep Work King', icon: '🧠', val: '12h Focus' },
                { label: 'Consistent Monk', icon: '🧘', val: '7d Streak' },
                { label: 'Subject Master', icon: '📚', val: 'Calc III' },
                { label: 'Night Owl', icon: '🦉', val: 'Late session' },
                { label: 'Early Bird', icon: '🌅', val: '6AM start' }
              ].map(ach => (
                <div key={ach.label} className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/40">
                  <span className="text-xl">{ach.icon}</span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-200">{ach.label}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-black">{ach.val}</p>
                  </div>
                </div>
              ))}
           </div>
        </GlowCard>

        <button 
          onClick={() => setView('home')}
          className="w-full py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          Base Command
        </button>
      </div>
    </div>
  );
};
