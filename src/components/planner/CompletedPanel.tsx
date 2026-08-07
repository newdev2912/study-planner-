import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Task, DailyFocusSession, SubjectData } from '../../types';
import { cn } from '../../lib/utils';
import { getCompletedGroups } from './CompletedGroupLogic';
import { CompletedCard } from './CompletedCard';
import { CompletedEmptyState } from './CompletedEmptyState';

interface CompletedPanelProps {
  activeSession: DailyFocusSession | null;
  activeSessionTasks: Task[];
  onToggleSubTask: (taskId: string, subTaskId: string, forceState?: boolean) => void;
  subjectMastery?: SubjectData[];
}

export const CompletedPanel = ({
  activeSession,
  activeSessionTasks,
  onToggleSubTask,
  subjectMastery = []
}: CompletedPanelProps) => {
  const [tab, setTab] = useState<'study' | 'daily'>('study');
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const allCompletedGroups = getCompletedGroups(activeSession, activeSessionTasks, subjectMastery);
  const completedStudyGroups = allCompletedGroups.filter(g => g.taskCategory !== 'DAILY');
  const completedDailyGroups = allCompletedGroups.filter(g => g.taskCategory === 'DAILY');

  const activeCompletedList = tab === 'study' ? completedStudyGroups : completedDailyGroups;

  return (
    <div className="flex-1 bg-slate-900/20 border border-slate-800/80 rounded-2xl flex flex-col p-4 overflow-hidden backdrop-blur-md relative min-h-0 hover:z-10 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase font-jakarta">COMPLETED OBJECTIVES</span>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          {tab === 'study' ? completedStudyGroups.length : completedDailyGroups.length} Done
        </span>
      </div>

      {/* Tab Switcher - Pill and Track Design */}
      <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800/60 mb-4 flex-shrink-0">
        <button
          onClick={() => setTab('study')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg cursor-pointer whitespace-nowrap px-2 text-center",
            tab === 'study'
              ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          Study Tasks
        </button>
        <button
          onClick={() => setTab('daily')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg cursor-pointer whitespace-nowrap px-2 text-center",
            tab === 'daily'
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          Daily Tasks
        </button>
      </div>

      {/* Completed list viewport */}
      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2.5 min-h-0">
        {activeCompletedList.length === 0 ? (
          <CompletedEmptyState tab={tab} />
        ) : (
          <div className="space-y-2">
            {activeCompletedList.map((card) => {
              const cardId = `${card.subjectName}_${card.moduleName}`;
              const isExpanded = expandedCards[cardId] !== false; // expanded by default
              
              return (
                <CompletedCard
                  key={cardId}
                  card={card}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleCard(cardId)}
                  onToggleSubTask={onToggleSubTask}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
