import React, { useState } from 'react';
import { CheckCircle2, ClipboardCheck, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { Task, DailyFocusSession } from '../../types';
import { cn } from '../../lib/utils';

interface CompletedPanelProps {
  activeSession: DailyFocusSession | null;
  activeSessionTasks: Task[];
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
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

export const CompletedPanel = ({
  activeSession,
  activeSessionTasks,
  onToggleSubTask
}: CompletedPanelProps) => {
  const [tab, setTab] = useState<'study' | 'daily'>('study');
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const hasFirestoreSession = activeSession && activeSession.items && activeSession.items.length > 0;

  const getCompletedFirestoreGroups = () => {
    if (!hasFirestoreSession) return [];
    
    const items = activeSession.items.filter((i: any) => i.isStaged);
    const groups: { [key: string]: { moduleId: string; moduleName: string; subjectName: string; priority: string; taskCategory: string; items: any[] } } = {};
    
    items.forEach((item: any) => {
      const key = `${item.subjectId}_${item.moduleId}`;
      if (!groups[key]) {
        groups[key] = {
          moduleId: item.moduleId,
          moduleName: item.moduleName,
          subjectName: item.subjectName,
          priority: item.priority || 'low',
          taskCategory: item.taskCategory || 'STUDY',
          items: []
        };
      }
      groups[key].items.push(item);
    });
    
    return Object.values(groups).filter(group => {
      return group.items.length > 0 && group.items.every(i => i.isCompleted);
    });
  };

  const getCompletedFallbackTasks = () => {
    return activeSessionTasks.filter(task => {
      const selectedSubTasks = task.subTasks?.filter(st => st.selected) || [];
      const isCompleted = selectedSubTasks.length > 0 
        ? selectedSubTasks.every(st => st.completed) 
        : task.completed;
      return isCompleted;
    });
  };

  const completedFirestoreGroups = getCompletedFirestoreGroups();
  const completedFallbackTasks = getCompletedFallbackTasks();

  const completedStudyGroups = hasFirestoreSession
    ? completedFirestoreGroups.filter(g => g.taskCategory !== 'DAILY')
    : completedFallbackTasks.filter(t => t.taskType !== 'DAILY');

  const completedDailyGroups = hasFirestoreSession
    ? completedFirestoreGroups.filter(g => g.taskCategory === 'DAILY')
    : completedFallbackTasks.filter(t => t.taskType === 'DAILY');

  const activeCompletedList = tab === 'study' ? completedStudyGroups : completedDailyGroups;

  return (
    <div className="flex-1 bg-slate-900/20 border border-slate-800/80 rounded-2xl flex flex-col p-4 overflow-hidden backdrop-blur-md relative min-h-0">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 flex-shrink-0">
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
            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
            tab === 'study'
              ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          Study Tracks
        </button>
        <button
          onClick={() => setTab('daily')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
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
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 bg-slate-950/40 rounded-full border border-slate-900 border-dashed mb-2 text-slate-700">
              <ClipboardCheck className="w-5 h-5 mx-auto opacity-40" />
            </div>
            <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase block">
              {tab === 'study' ? "NO COMPLETED ACADEMICS" : "NO COMPLETED DAILIES"}
            </span>
            <p className="text-[9px] text-slate-600 mt-0.5 max-w-[170px] leading-relaxed">
              {tab === 'study' 
                ? "Completed Study Modules will automatically migrate here from active workspaces." 
                : "Complete all of today's staged daily task checkpoints to register entries."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeCompletedList.map((card: any) => {
              const priorityKey = card.priority || 'low';
              const theme = priorityTheme[priorityKey] || priorityTheme['low'];
              
              const cardId = hasFirestoreSession 
                ? `${card.subjectName}_${card.moduleId}`
                : card.id;

              const isExpanded = !!expandedCards[cardId];
              
              const subItems = hasFirestoreSession 
                ? card.items 
                : (card.subTasks?.filter((st: any) => st.selected) || []);

              return (
                <div 
                  key={cardId}
                  className={cn(
                    "rounded-xl overflow-hidden border transition-all duration-300",
                    theme.border
                  )}
                >
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => toggleCard(cardId)}
                    className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-950/20"
                  >
                    <div className="min-w-0 flex-1">
                      <span className={cn(
                        "text-[7px] font-black tracking-widest uppercase block",
                        theme.text
                      )}>
                        {hasFirestoreSession ? card.subjectName : card.subject}
                      </span>
                      <h6 className="text-[10.5px] font-bold text-slate-300 truncate mt-0.5 leading-snug">
                        {hasFirestoreSession ? card.moduleName : card.task_title}
                      </h6>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase border",
                        theme.badge
                      )}>
                        100%
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
                      {subItems.map((sub: any) => {
                        const subId = hasFirestoreSession ? sub.id : sub.id;
                        return (
                          <div 
                            key={subId}
                            onClick={() => {
                              if (hasFirestoreSession) {
                                onToggleSubTask(subId, "");
                              } else {
                                onToggleSubTask(card.id, sub.id);
                              }
                            }}
                            className="flex items-start gap-2 p-1 rounded-md hover:bg-slate-900/30 transition-all cursor-pointer group"
                          >
                            <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-rose-500/50 group-hover:bg-rose-500/10">
                              <Check className="w-2.5 h-2.5 text-emerald-400 group-hover:hidden" />
                              <span className="text-[7px] font-black text-rose-400 hidden group-hover:inline">UNDO</span>
                            </div>
                            <span className="text-[9px] text-slate-500 line-through group-hover:text-slate-300 select-none">
                              {hasFirestoreSession ? sub.topicTitle : sub.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
