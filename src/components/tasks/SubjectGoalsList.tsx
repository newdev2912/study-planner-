import React from 'react';
import { SubjectData } from '../../types';
import { cn } from '../../lib/utils';

const priorityStyles: Record<string, { card: string, text: string, badge: string }> = {
  'high': { card: 'border-red-500/30 bg-red-950/10', text: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'medium': { card: 'border-amber-500/30 bg-amber-950/10', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'low': { card: 'border-slate-700/50 bg-slate-900/20', text: 'text-slate-400', badge: 'bg-slate-800 text-slate-400 border-slate-700' },
  'on-going': { card: 'border-cyan-500/30 bg-cyan-950/10', text: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' }
};

export const SubjectGoalsList = ({ subjects }: { subjects: SubjectData[] }) => {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
          <span className="text-xl">?</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">No subjects found.</p>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">Create one in the Subjects panel.</p>
      </div>
    );
  }

  const calculateProgress = (subject: SubjectData) => {
    const totalTopics = subject.modules?.reduce((acc, mod) => acc + (mod.topics?.length || 0), 0) || 0;
    const completedTopics = subject.modules?.reduce((acc, mod) => 
      acc + (mod.topics?.filter(t => t.completed).length || 0), 0) || 0;
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  };

  return (
    <div className="flex flex-col gap-3 mt-2 overflow-y-auto max-h-[420px] pb-3 pr-1.5 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {subjects.map(subject => {
        const theme = priorityStyles[subject.priority || 'low'];
        const progress = calculateProgress(subject);
        return (
          <div 
            key={subject.id} 
            className={cn(
              "flex flex-col gap-2 rounded-xl p-4 border backdrop-blur-sm transition-all hover:bg-slate-800/30 group", 
              theme.card
            )}
          >
            <div className="flex justify-between items-start w-full gap-2">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-sm font-black tracking-wider text-slate-100 uppercase group-hover:text-white transition-colors truncate">
                  {subject.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {subject.modules?.length || 0} Modules
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {subject.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0)} Topics
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/20">
                  {progress}%
                </span>
                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", theme.badge)}>
                  {subject.priority || 'Low'}
                </span>
              </div>
            </div>
            {/* Slide-out progress tracker */}
            <div className="w-full h-1 bg-slate-950/80 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  subject.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                  subject.priority === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                  subject.priority === 'on-going' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 
                  'bg-slate-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
