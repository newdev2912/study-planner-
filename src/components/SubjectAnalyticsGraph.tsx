import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart3, Activity, Zap, Clock } from 'lucide-react';
import { DashboardPanel } from './DashboardPanel';
import { SubjectData } from '../types';
import { cn } from '../lib/utils';

interface SubjectAnalyticsGraphProps {
  subjects: SubjectData[];
}

const MOCK_TIME_DATA = [
  { day: 'Mon', hours: 2.5, retention: 65 },
  { day: 'Tue', hours: 3.2, retention: 72 },
  { day: 'Wed', hours: 1.8, retention: 68 },
  { day: 'Thu', hours: 4.5, retention: 85 },
  { day: 'Fri', hours: 2.2, retention: 78 },
  { day: 'Sat', hours: 5.1, retention: 92 },
  { day: 'Sun', hours: 3.8, retention: 88 },
];

export const SubjectAnalyticsGraph = ({ subjects }: SubjectAnalyticsGraphProps) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>('all');

  const activeSubject = useMemo(() => {
    if (activeSubjectId === 'all') return null;
    return subjects.find(s => s.id === activeSubjectId);
  }, [activeSubjectId, subjects]);

  // Calculate mastery for the active view
  const masteryValue = useMemo(() => {
    if (activeSubject) {
      const totalTopics = activeSubject.modules.reduce((acc, mod) => acc + mod.topics.length, 0);
      const completedTopics = activeSubject.modules.reduce((acc, mod) => 
        acc + mod.topics.filter(t => t.completed).length, 0);
      return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    }
    
    // Average mastery for 'all'
    if (subjects.length === 0) return 0;
    const scores = subjects.map(s => {
      const total = s.modules.reduce((acc, mod) => acc + mod.topics.length, 0);
      const completed = s.modules.reduce((acc, mod) => acc + mod.topics.filter(t => t.completed).length, 0);
      return total > 0 ? (completed / total) : 0;
    });
    return Math.round((scores.reduce((a, b) => a + b, 0) / subjects.length) * 100);
  }, [activeSubject, subjects]);

  return (
    <DashboardPanel 
      title="Subject Mastery Analytics" 
      icon={<BarChart3 />} 
      accentColor="emerald"
      headerAction={
        <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em] animate-pulse">
          ANALYTICS ENGINE :: DYNAMIC TRACKING ACTIVE
        </span>
      }
    >
      <div className="flex flex-col h-full gap-4">
        {/* Dynamic Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveSubjectId('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
              activeSubjectId === 'all'
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300"
            )}
          >
            All Subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubjectId(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                activeSubjectId === s.id
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4 flex-1">
          {/* Main Chart Area */}
          <div className="col-span-12 lg:col-span-8 bg-slate-900/40 rounded-2xl border border-slate-800/50 p-4 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TIME_DATA}>
                <defs>
                  <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorEmerald)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Panel */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
            <div className="bg-slate-900/40 rounded-xl border border-slate-800/50 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Current Mastery</p>
                <p className="text-sm font-black text-slate-100">{masteryValue}%</p>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl border border-slate-800/50 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Hours Spent</p>
                <p className="text-sm font-black text-slate-100">14.5h</p>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl border border-slate-800/50 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Retention Index</p>
                <p className="text-sm font-black text-slate-100">High</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
};
