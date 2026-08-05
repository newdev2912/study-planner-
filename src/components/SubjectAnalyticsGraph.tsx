import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList, Calendar, Layers, Flag } from 'lucide-react';
import { DashboardPanel } from './DashboardPanel';
import { SubjectData } from '../types';
import { cn } from '../lib/utils';

const priorityChartThemeMap: Record<string, { stroke: string; stopColor: string; shadow: string; id: string }> = {
  'high': {
    stroke: '#ef4444',
    stopColor: '#ef4444',
    shadow: 'rgba(239, 68, 68, 0.2)',
    id: 'colorHigh'
  },
  'medium': {
    stroke: '#f59e0b',
    stopColor: '#f59e0b',
    shadow: 'rgba(245, 158, 11, 0.2)',
    id: 'colorMedium'
  },
  'on-going': {
    stroke: '#06b6d4',
    stopColor: '#06b6d4',
    shadow: 'rgba(6, 182, 212, 0.2)',
    id: 'colorOngoing'
  },
  'low': {
    stroke: '#10b981',
    stopColor: '#10b981',
    shadow: 'rgba(16, 185, 129, 0.2)',
    id: 'colorLow'
  }
};

interface SubjectAnalyticsGraphProps {
  subjects: SubjectData[];
}

export const SubjectAnalyticsGraph = ({ subjects }: SubjectAnalyticsGraphProps) => {
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');

  const selectedSubject = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;
    const found = subjects.find(s => s.id === activeSubjectId);
    return found || subjects[0];
  }, [activeSubjectId, subjects]);

  // Last 10 days of topic activity timeline
  const subjectActivityData = useMemo(() => {
    if (!selectedSubject) return [];

    if (selectedSubject.activityHistory && selectedSubject.activityHistory.length >= 10) {
      return selectedSubject.activityHistory.slice(-10);
    }

    // Generate/fallback 10-day array
    const today = new Date();
    const totalCompleted = selectedSubject.modules.reduce((acc, mod) => 
      acc + (mod.topics?.filter(t => t.completed).length || 0), 0);

    const historyMap = new Map<string, number>();
    if (selectedSubject.activityHistory) {
      selectedSubject.activityHistory.forEach(item => {
        historyMap.set(item.date, item.topicsCovered);
      });
    }

    const result = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      const isoStr = d.toISOString().split('T')[0];

      let topicsCovered = historyMap.get(isoStr) ?? historyMap.get(dateStr);
      if (topicsCovered === undefined) {
        // Step progression simulation leading up to current completed count
        topicsCovered = Math.max(0, Math.round(totalCompleted * ((10 - i) / 10)));
      }

      result.push({
        date: dateStr,
        topicsCovered
      });
    }
    return result;
  }, [selectedSubject]);

  // Metric 1: Deadline Countdown
  const deadlineInfo = useMemo(() => {
    if (!selectedSubject?.deadline) return { text: "No Deadline Set", color: "text-slate-400" };
    
    const targetDate = new Date(selectedSubject.deadline);
    if (isNaN(targetDate.getTime())) return { text: selectedSubject.deadline, color: "text-slate-300" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return { text: `${diffDays} Days Left`, color: "text-emerald-400" };
    if (diffDays === 1) return { text: "1 Day Left", color: "text-amber-400" };
    if (diffDays === 0) return { text: "Due Today", color: "text-red-400 font-black animate-pulse" };
    return { text: `${Math.abs(diffDays)} Days Overdue`, color: "text-red-500 font-black" };
  }, [selectedSubject]);

  // Metric 2: Incomplete Modules Count
  const incompleteModulesCount = useMemo(() => {
    if (!selectedSubject?.modules) return 0;
    return selectedSubject.modules.filter(m => {
      if (!m.topics || m.topics.length === 0) return true;
      return m.topics.some(t => !t.completed);
    }).length;
  }, [selectedSubject]);

  // Metric 3: Priority Weight
  const priorityDisplay = useMemo(() => {
    const p = selectedSubject?.priority || 'medium';
    const label = p.toUpperCase();
    let color = "text-amber-400";
    if (p === 'high') color = "text-red-400";
    if (p === 'low') color = "text-slate-300";
    if (p === 'on-going') color = "text-cyan-400";
    return { label, color };
  }, [selectedSubject]);

  const activePriority = selectedSubject?.priority || 'medium';

  const currentAccentColor = useMemo(() => {
    if (!selectedSubject) return 'emerald';
    const p = selectedSubject.priority || 'medium';
    if (p === 'high') return 'red';
    if (p === 'medium') return 'amber';
    if (p === 'on-going') return 'cyan';
    return 'emerald'; // low
  }, [selectedSubject]);

  return (
    <DashboardPanel 
      title={<span className="font-display tracking-wide text-xl text-slate-100">Neural Progress Engine</span>} 
      icon={<ClipboardList />} 
      accentColor={currentAccentColor}
      headerAction={
        <span className={cn(
          "text-[9px] font-black uppercase tracking-[0.2em] animate-pulse",
          activePriority === 'high' ? "text-red-500" :
          activePriority === 'medium' ? "text-amber-500" :
          activePriority === 'on-going' ? "text-cyan-500" : "text-emerald-500"
        )}>
          REAL-TIME DATA SYNC ACTIVE
        </span>
      }
    >
      <div className="flex flex-col h-full gap-2.5">
        {/* Subject Filter Bar (No Universal View) - Fix Layout Overlap */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          {subjects.map((s) => {
            const isSelected = selectedSubject?.id === s.id;
            const subPriority = s.priority || 'medium';
            const borderColors = {
              high: 'border-red-500/30 text-red-400 hover:text-red-300',
              medium: 'border-amber-500/30 text-amber-400 hover:text-amber-300',
              'on-going': 'border-cyan-500/30 text-cyan-400 hover:text-cyan-300',
              low: 'border-emerald-500/30 text-emerald-400 hover:text-emerald-300',
            };
            const activeBorders = {
              high: 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
              medium: 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
              'on-going': 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
              low: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
            };
            return (
              <button
                key={s.id}
                onClick={() => setActiveSubjectId(s.id)}
                className={cn(
                  "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                  isSelected
                    ? activeBorders[subPriority]
                    : cn("bg-slate-900/50 border-slate-850", borderColors[subPriority])
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        {selectedSubject ? (
          <div className="flex flex-col gap-2.5 flex-1">
            {/* Main Chart Area - Restored Smooth Flow Glowing AreaChart with Linear Connecting Line */}
            {(() => {
              const chartTheme = priorityChartThemeMap[activePriority] || priorityChartThemeMap.medium;
              return (
                <div className="w-full bg-slate-900/40 rounded-2xl border border-slate-800/50 p-3 h-[145px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={subjectActivityData}>
                      <defs>
                        <linearGradient id={chartTheme.id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartTheme.stopColor} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={chartTheme.stopColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={9} 
                        stroke="#64748b" 
                      />
                      <YAxis 
                        allowDecimals={false} 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={9} 
                        stroke="#64748b" 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '9px' }}
                        itemStyle={{ color: chartTheme.stroke }}
                        formatter={(value) => [`${value} Topics`, 'Topics Covered']}
                      />
                      <Area 
                        type="linear" 
                        dataKey="topicsCovered" 
                        stroke={chartTheme.stroke} 
                        fillOpacity={1}
                        fill={`url(#${chartTheme.id})`}
                        strokeWidth={2} 
                        dot={{ fill: chartTheme.stroke, r: 3 }} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}

            {/* Bottom Sleek Metrics Row - Perfect symmetrical grid, enclosed in a sleek horizontal button/pill dock */}
            <div className="grid grid-cols-3 gap-1.5 mt-1 bg-slate-950/30 p-1 rounded-xl border border-slate-900/50">
              <div className="flex items-center justify-center gap-1.5 px-1.5 py-1.5 bg-slate-900/40 rounded-lg text-[9px] font-bold text-slate-400 border border-slate-800/10 text-center truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">Deadline: <strong className="text-slate-200">{deadlineInfo.text}</strong></span>
              </div>

              <div className="flex items-center justify-center gap-1.5 px-1.5 py-1.5 bg-slate-900/40 rounded-lg text-[9px] font-bold text-slate-400 border border-slate-800/10 text-center truncate">
                <Layers className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">Remaining: <strong className="text-cyan-400">{incompleteModulesCount} {incompleteModulesCount === 1 ? 'Module' : 'Modules'}</strong></span>
              </div>

              {(() => {
                const p = selectedSubject?.priority || 'medium';
                const badgeStyleMap: Record<string, string> = {
                  high: 'bg-red-500/10 text-red-400 border-red-500/20',
                  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  'on-going': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                };
                const badgeStyle = badgeStyleMap[p] || badgeStyleMap.medium;
                return (
                  <div className={cn("flex items-center justify-center gap-1.5 px-1.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border text-center truncate", badgeStyle)}>
                    <Flag className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{p === 'on-going' ? 'ON-GOING' : p.toUpperCase()}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 font-bold border border-dashed border-slate-800 rounded-xl">
            No active subjects found. Create a subject in the planner to view analytics.
          </div>
        )}
      </div>
    </DashboardPanel>
  );
};
