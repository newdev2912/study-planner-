import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Trash2, Plus, Clock, Repeat, Edit3, Save, X } from 'lucide-react';
import { Task, SubjectData } from '../../types';
import { cn } from '../../lib/utils';

interface DailyRefreshListProps {
  tasks: Task[];
  subjects: SubjectData[];
  handleToggleTask: (taskId: string) => void;
  handleRemoveTask: (taskId: string) => void;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  handleAddTask: (type: 'regular' | 'subject') => void;
}

const priorityThemeMap: Record<string, { card: string; badge: string; text: string; button: string }> = {
  'high': { 
    card: 'border-red-500/30 bg-red-950/10 hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-red-400', 
    badge: 'bg-red-500/10 text-red-400 border-red-500/20', 
    text: 'text-red-400',
    button: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
  },
  'medium': { 
    card: 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] text-amber-400', 
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', 
    text: 'text-amber-400',
    button: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
  },
  'low': { 
    card: 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 text-slate-400', 
    badge: 'bg-slate-800 text-slate-400 border-slate-700', 
    text: 'text-slate-400',
    button: 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'
  },
  'on-going': { 
    card: 'border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-400', 
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', 
    text: 'text-cyan-400',
    button: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
  }
};

const completedTheme = {
  card: 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400',
  badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  text: 'text-emerald-400',
  button: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
};

export const DailyRefreshList = ({ 
  tasks, 
  subjects, 
  handleToggleTask, 
  handleRemoveTask, 
  handleUpdateTask,
  handleAddTask
}: DailyRefreshListProps) => {
  // Inline edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activePriorityMenu, setActivePriorityMenu] = useState<string | null>(null);

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.task_title);
  };

  const saveEdit = (taskId: string) => {
    if (editTitle.trim()) {
      handleUpdateTask(taskId, {
        task_title: editTitle.trim(),
      });
    }
    setEditingTaskId(null);
  };

  const priorityConfig: Record<string, { 
    label: string, 
    badge: string, 
    cardGlow: string, 
    textClass: string 
  }> = {
    'high': { 
      label: 'HARD', 
      badge: 'bg-red-500/10 text-red-400 border border-red-500/30',
      cardGlow: 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)] hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      textClass: 'text-red-400'
    },
    'medium': { 
      label: 'MEDIUM', 
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      cardGlow: 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      textClass: 'text-amber-400'
    },
    'low': { 
      label: 'LOW', 
      badge: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
      cardGlow: 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700',
      textClass: 'text-slate-400'
    },
    'on-going': { 
      label: 'ON-GOING', 
      badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse',
      cardGlow: 'bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)] hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      textClass: 'text-cyan-400'
    }
  };

  const completedTheme = {
    card: 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    text: 'text-emerald-400'
  };

  return (
    <div className="max-h-[350px] overflow-y-auto no-scrollbar flex flex-col gap-3 pr-2 mt-4">
      <AnimatePresence mode="popLayout">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const taskSubject = subjects.find(s => s.name === task.subject);
            const priorityKey = (task.type === 'subject' ? taskSubject?.priority : task.priority) || 'medium';
            const isCompleted = task.completed || task.isCompleted;

            return (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 backdrop-blur-md relative",
                  isCompleted ? completedTheme.card : (priorityConfig[priorityKey]?.cardGlow || priorityConfig.low.cardGlow)
                )}
              >
                {/* Left Side: A Single Completion Checkbox */}
                <button 
                  onClick={() => handleToggleTask(task.id)}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer",
                    isCompleted 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                      : "border-slate-700 hover:border-slate-500"
                  )}
                  title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
                >
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>

                {/* Clean Content Area (Center): Task Title with elegant spacing */}
                <div className="flex-1 min-w-0 mx-2">
                  {editingTaskId === task.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(task.id);
                        if (e.key === 'Escape') setEditingTaskId(null);
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-purple-500/50"
                    />
                  ) : (
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-xs font-bold truncate transition-all duration-300",
                        isCompleted 
                          ? "line-through text-slate-500" 
                          : priorityKey === 'high' ? 'text-red-200'
                          : priorityKey === 'medium' ? 'text-amber-200'
                          : priorityKey === 'on-going' ? 'text-cyan-200'
                          : 'text-slate-200'
                      )}>
                        {task.task_title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Side: Three Functional Icons sitting directly on the card without boxes */}
                <div className="flex items-center gap-3.5 flex-shrink-0">
                  {/* 1. Clock Priority Selector Pop-up */}
                  <div className="relative">
                    <button
                      onClick={() => setActivePriorityMenu(activePriorityMenu === task.id ? null : task.id)}
                      className={cn(
                        "transition-all cursor-pointer p-1 text-slate-500 hover:text-slate-300",
                        isCompleted 
                          ? "text-slate-700 cursor-not-allowed opacity-50" 
                          : activePriorityMenu === task.id
                            ? "text-purple-400"
                            : priorityKey === 'high' ? 'text-red-400 hover:text-red-300'
                            : priorityKey === 'medium' ? 'text-amber-400 hover:text-amber-300'
                            : priorityKey === 'on-going' ? 'text-cyan-400 hover:text-cyan-300'
                            : 'text-slate-500 hover:text-slate-300'
                      )}
                      disabled={isCompleted}
                      title="Select Task Priority"
                    >
                      <Clock className="w-4 h-4" />
                    </button>

                    {/* Pop-up options (horizontal pill with 4 color circles directly to the left of the clock) */}
                    <AnimatePresence>
                      {activePriorityMenu === task.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, x: 10, y: "-50%" }}
                          animate={{ opacity: 1, scale: 1, x: 0, y: "-50%" }}
                          exit={{ opacity: 0, scale: 0.95, x: 10, y: "-50%" }}
                          className="absolute right-full mr-2.5 top-1/2 flex items-center gap-2 px-2.5 py-1.5 bg-slate-950/95 border border-slate-800 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.85)] z-50 backdrop-blur-md"
                          style={{ minWidth: '95px' }}
                        >
                          {/* Red (High) */}
                          <button
                            onClick={() => {
                              handleUpdateTask(task.id, { priority: 'high' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-red-500 transition-transform hover:scale-130 cursor-pointer relative",
                              priorityKey === 'high' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="High Priority"
                          />

                          {/* Yellow (Medium) */}
                          <button
                            onClick={() => {
                              handleUpdateTask(task.id, { priority: 'medium' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-amber-500 transition-transform hover:scale-130 cursor-pointer relative",
                              priorityKey === 'medium' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="Medium Priority"
                          />

                          {/* Grey (Low) */}
                          <button
                            onClick={() => {
                              handleUpdateTask(task.id, { priority: 'low' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-slate-500 transition-transform hover:scale-130 cursor-pointer relative",
                              priorityKey === 'low' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="Low Priority"
                          />

                          {/* Blue (On-going) */}
                          <button
                            onClick={() => {
                              handleUpdateTask(task.id, { priority: 'on-going' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-cyan-500 transition-transform hover:scale-130 cursor-pointer relative",
                              priorityKey === 'on-going' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="On-Going"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 2. Edit Icon */}
                  <button
                    onClick={() => {
                      if (editingTaskId === task.id) {
                        saveEdit(task.id);
                      } else {
                        startEditing(task);
                      }
                    }}
                    className={cn(
                      "transition-colors cursor-pointer p-1 text-slate-500 hover:text-slate-300",
                      isCompleted
                        ? "text-slate-700 cursor-not-allowed opacity-50"
                        : editingTaskId === task.id
                          ? "text-emerald-400"
                          : "text-slate-500 hover:text-slate-300"
                    )}
                    disabled={isCompleted}
                    title="Edit Task Name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* 3. Delete Icon */}
                  <button
                    onClick={() => handleRemoveTask(task.id)}
                    className="transition-colors cursor-pointer p-1 text-slate-500 hover:text-red-400"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 border border-dashed border-slate-800 rounded-xl"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No tasks active for today</p>
            <button 
              onClick={() => handleAddTask('regular')}
              className="mt-2 text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline"
            >
              + Create One
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
