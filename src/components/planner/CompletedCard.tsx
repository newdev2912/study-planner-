import React from 'react';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import { CompletedGroup } from './CompletedGroupLogic';
import { cn } from '../../lib/utils';

interface CompletedCardProps {
  card: CompletedGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSubTask: (taskId: string, subTaskId: string, forceState?: boolean) => void;
}

const priorityTheme: { [key: string]: { border: string; text: string; badge: string; bullet: string } } = {
  high: {
    border: 'border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.02)]',
    text: 'text-rose-400',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    bullet: 'bg-rose-500'
  },
  medium: {
    border: 'border-amber-500/20 bg-amber-950/10 hover:border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.02)]',
    text: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bullet: 'bg-amber-400'
  },
  low: {
    border: 'border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.02)]',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    bullet: 'bg-cyan-400'
  },
  'on-going': {
    border: 'border-purple-500/20 bg-purple-950/10 hover:border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.02)]',
    text: 'text-purple-400',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    bullet: 'bg-purple-500'
  }
};

export const CompletedCard = ({
  card,
  isExpanded,
  onToggleExpand,
  onToggleSubTask
}: CompletedCardProps) => {
  const priorityKey = card.priority || 'low';
  const theme = priorityTheme[priorityKey] || priorityTheme['low'];
  const cardId = `${card.subjectName}_${card.moduleName}`;
  
  const completedCount = card.items.length;
  const totalCount = card.totalCount;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  return (
    <div className={cn("rounded-xl overflow-hidden border transition-all duration-300", theme.border)}>
      {/* Collapsible Header */}
      <div 
        onClick={onToggleExpand}
        className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-950/20"
      >
        <div className="min-w-0 flex-1">
          <span className={cn("text-[7px] font-black tracking-widest uppercase block", theme.text)}>
            {card.subjectName}
          </span>
          <h6 className="text-[10.5px] font-bold text-slate-300 truncate mt-0.5 leading-snug">
            {card.moduleName}
          </h6>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <span className={cn("px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase border", theme.badge)}>
            {pct}%
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>
      </div>

      {/* Collapsed list of completed topics */}
      {isExpanded && (
        <div className="p-2.5 bg-slate-950/40 border-t border-slate-900/40 space-y-1.5">
          {card.items.map((sub: any) => {
            return (
              <div 
                key={sub.id}
                onClick={() => {
                  onToggleSubTask(sub.id, "", false);
                }}
                className="flex items-start gap-2 p-1.5 rounded-md hover:bg-slate-900/30 transition-all cursor-pointer group"
              >
                <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-rose-500/50 group-hover:bg-rose-500/10">
                  <Check className="w-2.5 h-2.5 text-emerald-400 group-hover:hidden" />
                  <span className="text-[7px] font-black text-rose-400 hidden group-hover:inline">UNDO</span>
                </div>
                <span className="text-[9.5px] text-slate-400 line-through group-hover:text-slate-200 select-none">
                  {sub.topicTitle}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
