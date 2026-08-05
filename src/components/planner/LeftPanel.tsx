import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, CheckSquare, Square, ShieldAlert, Sparkles, Circle, CheckCircle2, Check
} from 'lucide-react';
import { Task } from '../../types';
import { cn } from '../../lib/utils';
import { priorityTheme } from './PlannerTheme';

interface LeftPanelProps {
  activeSessionTasks: Task[];
  activeSessionActive: boolean;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  activeSession?: any | null;
}

export const LeftPanel = ({
  activeSessionTasks,
  activeSessionActive,
  onToggleSubTask,
  activeSession = null
}: LeftPanelProps) => {
  // Use real-time activeSession items if present
  const hasFirestoreSession = activeSession && activeSession.items && activeSession.items.length > 0;
  
  // Grouping logic for firestore session
  const getGroupedModules = () => {
    if (!hasFirestoreSession) return [];
    
    const items = activeSession.items.filter((i: any) => i.isStaged);
    const groups: { [key: string]: { moduleId: string; moduleName: string; subjectName: string; priority: string; items: any[] } } = {};
    
    items.forEach((item: any) => {
      const key = `${item.subjectId}_${item.moduleId}`;
      if (!groups[key]) {
        groups[key] = {
          moduleId: item.moduleId,
          moduleName: item.moduleName,
          subjectName: item.subjectName,
          priority: item.priority || 'low',
          items: []
        };
      }
      groups[key].items.push(item);
    });
    
    return Object.values(groups);
  };

  // Only display modules that are NOT 100% complete in the active Left Panel
  const groupedModules = getGroupedModules().filter(group => {
    const completedCount = group.items.filter(i => i.isCompleted).length;
    const totalCount = group.items.length;
    return completedCount < totalCount;
  });

  const isActive = hasFirestoreSession ? activeSession.isActive : activeSessionActive;

  // Filter out fallback tasks that are 100% complete
  const visibleActiveTasks = activeSessionTasks.filter((task) => {
    const selectedSubTasks = task.subTasks?.filter(st => st.selected) || [];
    const completedSubTasks = selectedSubTasks.filter(st => st.completed).length;
    const isTaskCompleted = selectedSubTasks.length > 0 
      ? completedSubTasks === selectedSubTasks.length 
      : task.completed;
    return !isTaskCompleted;
  });

  return (
    <div className="w-full h-full bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col p-4 overflow-hidden backdrop-blur-md relative hover:z-10 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300">
      {/* Header section */}
      <div className="flex items-center gap-2 pb-1.5 mb-2 flex-shrink-0">
        <BookOpen className="w-4 h-4 text-cyan-400" />
        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">ACTIVE SESSION CHECKLISTS</span>
      </div>

      {/* Hierarchical Checklist Container */}
      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3 min-h-0">
        {!isActive || (hasFirestoreSession ? groupedModules.length === 0 : visibleActiveTasks.length === 0) ? (
          /* Unpopulated Empty State or All Completed Victory State */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-dashed border-slate-800">
              {isActive ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto animate-bounce" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-slate-650 animate-pulse mx-auto" />
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                {isActive ? "ALL OBJECTIVES ACHIEVED!" : "NO ACTIVE SESSION"}
              </span>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                {isActive 
                  ? "Outstanding job! All of your staged topics have been completed and moved to the Completed panel."
                  : "Mark tasks inside the Master Archive and click the POPULATE & START SESSION button to deploy active checklist tracks."}
              </p>
            </div>
          </div>
        ) : hasFirestoreSession ? (
          /* Real-time Grouped Firestore checklist */
          <div className="space-y-4">
            {groupedModules.map((group) => {
              const theme = priorityTheme[group.priority || 'low'];
              const completedCount = group.items.filter(i => i.isCompleted).length;
              const totalCount = group.items.length;
              const progressPct = Math.round((completedCount / totalCount) * 100);
              const isGroupCompleted = completedCount === totalCount;

              return (
                <div 
                  key={`${group.subjectName}_${group.moduleId}`}
                  className={cn(
                    "rounded-xl overflow-hidden border transition-all duration-300",
                    isGroupCompleted ? "bg-slate-950/20 border-slate-900/40 opacity-70" : theme.cardGlow
                  )}
                >
                  {/* Group Header */}
                  <div className="p-3 bg-slate-950/20 border-b border-slate-900/40 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block">{group.subjectName}</span>
                      <h5 className={cn(
                        "text-[11px] font-bold text-slate-200 truncate mt-0.5",
                        isGroupCompleted && "line-through text-slate-650"
                      )}>
                        {group.moduleName}
                      </h5>
                    </div>
                    
                    {/* Progress Badge */}
                    <div className="shrink-0 flex items-center gap-1.5 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-900">
                      <span className="text-[8px] font-black text-cyan-400 font-mono">{progressPct}%</span>
                    </div>
                  </div>

                  {/* Group Items */}
                  <div className="p-2.5 space-y-1.5 bg-slate-950/40">
                    {group.items.map((item) => {
                      return (
                        <div 
                          key={item.id}
                          onClick={() => onToggleSubTask(item.id, "")}
                          className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-900/30 transition-all cursor-pointer group"
                        >
                          <div className={cn(
                            "w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 mt-0.5",
                            item.isCompleted
                              ? "bg-emerald-500/10 border-emerald-500"
                              : "bg-slate-900/40 border-slate-700 group-hover:border-cyan-400"
                          )}>
                            {item.isCompleted && (
                              <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                            )}
                          </div>
                          <span 
                            className={cn(
                              "text-[10px] leading-snug select-none transition-colors",
                              item.isCompleted 
                                ? "text-slate-600 line-through" 
                                : "text-slate-350 group-hover:text-slate-100"
                            )}
                          >
                            {item.topicTitle}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Populated Active Session Backup state */
          <div className="space-y-4">
            {visibleActiveTasks.map((task) => {
              const priorityKey = task.priority || 'low';
              const theme = priorityTheme[priorityKey];

              const selectedSubTasks = task.subTasks?.filter(st => st.selected) || [];
              const totalSub = selectedSubTasks.length;
              const completedSub = selectedSubTasks.filter(st => st.completed).length;
              const progressPct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
              const isTaskCompleted = totalSub > 0 ? selectedSubTasks.every(st => st.completed) : task.completed;

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
                      <span className="text-[8px] font-black tracking-widest text-slate-550 uppercase block">{task.subject}</span>
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
                    {selectedSubTasks.length === 0 ? (
                      <div className="text-[9px] text-slate-600 italic px-1 py-0.5">No selected subtask checklists.</div>
                    ) : (
                      selectedSubTasks.map((sub) => {
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
                                  : "text-slate-350 group-hover:text-slate-100"
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
