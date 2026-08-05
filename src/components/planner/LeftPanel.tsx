import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, CheckSquare, Square, ShieldAlert, Sparkles, Circle, CheckCircle2 
} from 'lucide-react';
import { Task } from '../../types';
import { cn } from '../../lib/utils';
import { priorityTheme } from './PlannerTheme';

interface LeftPanelProps {
  activeSessionTasks: Task[];
  activeSessionActive: boolean;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
}

export const LeftPanel = ({
  activeSessionTasks,
  activeSessionActive,
  onToggleSubTask
}: LeftPanelProps) => {
  return (
    <div className="w-full h-full bg-black/30 border border-white/10 rounded-2xl flex flex-col p-4 overflow-hidden backdrop-blur-md">
      {/* Header section */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/5 flex-shrink-0">
        <BookOpen className="w-4 h-4 text-cyan-400" />
        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">ACTIVE SESSION CHECKLISTS</span>
      </div>

      {/* Hierarchical Checklist Container */}
      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3 min-h-0">
        {!activeSessionActive || activeSessionTasks.length === 0 ? (
          /* Unpopulated Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-dashed border-slate-800">
              <ShieldAlert className="w-6 h-6 text-slate-650 animate-pulse mx-auto" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">NO ACTIVE SESSION</span>
              <p className="text-[10px] text-slate-600 leading-relaxed max-w-[200px] mx-auto">
                Mark tasks inside the Master Archive and click the <strong className="text-purple-400">POPULATE & START SESSION</strong> button to deploy active checklist tracks.
              </p>
            </div>
          </div>
        ) : (
          /* Populated Active Session state */
          <div className="space-y-4">
            {activeSessionTasks.map((task) => {
              const priorityKey = task.priority || 'low';
              const theme = priorityTheme[priorityKey];
              const isTaskCompleted = task.completed;

              const totalSub = task.subTasks?.length || 0;
              const completedSub = task.subTasks?.filter(st => st.completed).length || 0;
              const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

              return (
                <div 
                  key={task.id}
                  className={cn(
                    "rounded-xl overflow-hidden border transition-all duration-300",
                    isTaskCompleted ? "bg-slate-950/20 border-slate-900/40 opacity-70" : theme.cardGlow
                  )}
                >
                  {/* Task Header info */}
                  <div className="p-3 bg-slate-950/20 border-b border-slate-900/40 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block">{task.subject}</span>
                      <h5 className={cn(
                        "text-[11px] font-bold text-slate-200 truncate mt-0.5",
                        isTaskCompleted && "line-through text-slate-650"
                      )}>
                        {task.task_title}
                      </h5>
                    </div>
                    
                    {/* Progress Badge */}
                    <div className="shrink-0 flex items-center gap-1.5 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-900">
                      <span className="text-[8px] font-black text-cyan-400 font-mono">{progressPct}%</span>
                    </div>
                  </div>

                  {/* Nested Sub-tasks Checklists */}
                  <div className="p-2.5 space-y-1.5 bg-slate-950/40">
                    {!task.subTasks || task.subTasks.length === 0 ? (
                      <div className="text-[9px] text-slate-600 italic px-1 py-0.5">No subtask checklists.</div>
                    ) : (
                      task.subTasks.map((sub) => {
                        return (
                          <div 
                            key={sub.id}
                            onClick={() => onToggleSubTask(task.id, sub.id)}
                            className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-900/30 transition-all cursor-pointer group"
                          >
                            <button className="shrink-0 mt-0.5 text-slate-500 group-hover:text-cyan-400 transition-colors">
                              {sub.completed ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span 
                              className={cn(
                                "text-[10px] leading-snug select-none",
                                sub.completed 
                                  ? "text-slate-600 line-through" 
                                  : "text-slate-300 group-hover:text-slate-100"
                              )}
                            >
                              {sub.title}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
