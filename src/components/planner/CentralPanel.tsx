import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Circle, ChevronDown, ChevronRight, Edit3, Trash2, 
  Sparkles, Plus, Check, Play, Pause, RotateCcw, Activity, FileText, 
  Brain, CheckSquare, Square, Settings, Award, AlertCircle, Clock, PawPrint
} from 'lucide-react';
import { StudyJourney, Task } from '../../types';
import { cn } from '../../lib/utils';
import { priorityTheme } from './PlannerTheme';
import { ProgressBar } from '../Shared';
import { FocusModePanel, COLOR_THEMES, ColorThemeKey } from './FocusModePanel';

interface CentralPanelProps {
  journey: StudyJourney;
  setJourney: React.Dispatch<React.SetStateAction<StudyJourney>>;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeSessionTaskIds: string[];
  setActiveSessionTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeSessionActive: boolean;
  setActiveSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
  onStartSession: () => void;
  tasks?: Task[];
  subjectMastery?: any[];
  onToggleSubTask?: (taskId: string, subTaskId: string) => void;
  activeSession?: any | null;
  activeSessionTasks?: Task[];
  onToggleSubTaskCompletion?: (taskId: string, subTaskId: string) => void;
}

export const CentralPanel = ({
  journey,
  setJourney,
  selectedTaskIds,
  setSelectedTaskIds,
  activeSessionTaskIds,
  setActiveSessionTaskIds,
  activeSessionActive,
  setActiveSessionActive,
  onStartSession,
  tasks = [],
  subjectMastery = [],
  onToggleSubTask,
  activeSession = null,
  activeSessionTasks = [],
  onToggleSubTaskCompletion
}: CentralPanelProps) => {
  const [viewMode, setViewMode] = useState<'archive' | 'focus'>('archive');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // Custom dropdown or inline priority selection active task ID
  const [activePriorityMenu, setActivePriorityMenu] = useState<string | null>(null);
  const [activePawMenu, setActivePawMenu] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  // Inline task and sub-task creation states
  const [newSubTaskTitles, setNewSubTaskTitles] = useState<Record<string, string>>({});
  const [newArchiveTaskTitle, setNewArchiveTaskTitle] = useState("");
  const [newArchiveTaskSubject, setNewArchiveTaskSubject] = useState("General");
  const [newArchiveTaskType, setNewArchiveTaskType] = useState<'DAILY' | 'CODE' | 'STUDY'>('STUDY');
  const [newArchiveTaskPriority, setNewArchiveTaskPriority] = useState<'low' | 'medium' | 'high' | 'on-going'>('medium');
  const [showAddTaskBar, setShowAddTaskBar] = useState(false);

  // Focus View Countdown States
  const [maxTimeMinutes, setMaxTimeMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [focusThemeKey, setFocusThemeKey] = useState<ColorThemeKey>('cyan');

  // Timer Ticker Loop
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Toggle Mode on completion
            if (timerMode === 'work') {
              setTimerMode('break');
              setTimeLeft(5 * 60);
              setMaxTimeMinutes(5);
            } else {
              setTimerMode('work');
              setTimeLeft(25 * 60);
              setMaxTimeMinutes(25);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerMode]);

  const handleStartTimer = () => setIsRunning(true);
  const handlePauseTimer = () => setIsRunning(false);
  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(maxTimeMinutes * 60);
  };
  const handleUpdateTime = (minutes: number) => {
    setIsRunning(false);
    setMaxTimeMinutes(minutes);
    setTimeLeft(minutes * 60);
  };

  // Parse total and completed staged tasks dynamically for the Focus Panel
  const hasFirestoreSession = activeSession && activeSession.items && activeSession.items.length > 0;

  // Compute activeTasks for Focus Spotlight Queue
  const getFocusActiveTasks = (): Task[] => {
    if (hasFirestoreSession) {
      const items = activeSession.items.filter((i: any) => i.isStaged);
      const groups: { [key: string]: Task } = {};
      items.forEach((item: any) => {
        const key = `${item.subjectId}_${item.moduleId}`;
        if (!groups[key]) {
          groups[key] = {
            id: item.subjectId,
            subject: item.subjectName,
            task_title: item.moduleName,
            completed: false,
            priority: item.priority || 'medium',
            type: 'subject',
            estimated_minutes: 60,
            subTasks: []
          };
        }
        groups[key].subTasks!.push({
          id: item.id, // e.g. "subjectId_moduleId_topicId"
          title: item.topicTitle,
          completed: item.isCompleted,
          selected: true
        });
      });
      return Object.values(groups).map(g => {
        const total = g.subTasks?.length || 0;
        const completed = g.subTasks?.filter(st => st.completed).length || 0;
        return {
          ...g,
          completed: total > 0 && completed === total
        };
      });
    } else {
      return activeSessionTasks.map(t => ({
        ...t,
        subTasks: t.subTasks?.filter(st => st.selected).map(st => ({
          id: st.id,
          title: st.title,
          completed: st.completed,
          selected: true
        })) || []
      }));
    }
  };

  const focusActiveTasks = getFocusActiveTasks();
  let totalStagedTasks = 0;
  let completedStagedTasks = 0;

  if (hasFirestoreSession) {
    totalStagedTasks = activeSession.items.filter((i: any) => i.isStaged).length;
    completedStagedTasks = activeSession.items.filter((i: any) => i.isStaged && i.isCompleted).length;
  } else if (tasks && activeSessionTaskIds.length > 0) {
    const activeTasks = tasks.filter(t => activeSessionTaskIds.includes(t.id));
    const totalSubTasks = activeTasks.reduce((acc, t) => acc + (t.subTasks?.filter(st => st.selected).length || 0), 0);
    const completedSubTasks = activeTasks.reduce((acc, t) => acc + (t.subTasks?.filter(st => st.selected && st.completed).length || 0), 0);
    
    if (totalSubTasks > 0) {
      totalStagedTasks = totalSubTasks;
      completedStagedTasks = completedSubTasks;
    } else {
      totalStagedTasks = activeTasks.length;
      completedStagedTasks = activeTasks.filter(t => t.completed).length;
    }
  }

  // Handle task selection
  const toggleTaskSelection = (taskId: string) => {
    const isCurrentlySelected = selectedTaskIds.includes(taskId);
    if (taskId.startsWith("subject-")) {
      if (onToggleSubTask) {
        onToggleSubTask(taskId, isCurrentlySelected ? "subject-unstage-all" : "subject-stage-all");
      }
    } else {
      setSelectedTaskIds(prev => 
        isCurrentlySelected ? prev.filter(id => id !== taskId) : [...prev, taskId]
      );
    }
  };

  // Toggle individual task completed state in the master archive list
  const toggleTaskCompleted = (taskId: string) => {
    setJourney(prev => {
      const updated = prev.daily_tasks.map(t => {
        if (t.id === taskId) {
          const completed = !t.completed;
          // If a task is marked completed, mark all its sub-tasks completed as well
          const updatedSubTasks = t.subTasks?.map(st => ({ ...st, completed })) || [];
          return { ...t, completed, subTasks: updatedSubTasks };
        }
        return t;
      });
      return { ...prev, daily_tasks: updated };
    });
  };

  // Handle change in task priority (unified across subjects, daily, and roadmap)
  const handleUpdateTaskPriorityUnified = (taskId: string, priority: 'high' | 'medium' | 'low' | 'on-going') => {
    if (taskId.startsWith("subject-")) {
      const subjectId = taskId.replace("subject-", "");
      import('../../lib/firebase/subjects').then(mod => {
        mod.updateSubjectPriority(subjectId, priority);
      }).catch(console.error);
      setActivePriorityMenu(null);
      return;
    }

    const isDaily = tasks.some(t => t.id === taskId);
    if (isDaily) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        import('../../lib/firebase/tasks').then(mod => {
          mod.syncTaskToFirebase({ ...task, priority });
        }).catch(console.error);
      }
      setActivePriorityMenu(null);
      return;
    }

    setJourney(prev => {
      const updated = prev.daily_tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, priority };
        }
        return t;
      });
      return { ...prev, daily_tasks: updated };
    });
    setActivePriorityMenu(null);
  };

  // Handle change in task type (unified across subjects, daily, and roadmap)
  const handleUpdateTaskTypeUnified = (taskId: string, taskType: 'DAILY' | 'CODE' | 'STUDY') => {
    if (taskId.startsWith("subject-")) {
      const subjectId = taskId.replace("subject-", "");
      import('../../lib/firebase/subjects').then(mod => {
        mod.updateSubjectTaskType(subjectId, taskType);
      }).catch(console.error);
      setActivePawMenu(null);
      return;
    }

    const isDaily = tasks.some(t => t.id === taskId);
    if (isDaily) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        import('../../lib/firebase/tasks').then(mod => {
          mod.syncTaskToFirebase({ ...task, taskType });
        }).catch(console.error);
      }
      setActivePawMenu(null);
      return;
    }

    setJourney(prev => {
      const updated = prev.daily_tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, taskType };
        }
        return t;
      });
      return { ...prev, daily_tasks: updated };
    });
    setActivePawMenu(null);
  };

  // Edit inline task title
  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.task_title);
  };

  const saveTaskTitle = (taskId: string) => {
    if (!editTitle.trim()) return;
    setJourney(prev => {
      const updated = prev.daily_tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, task_title: editTitle.trim() };
        }
        return t;
      });
      return { ...prev, daily_tasks: updated };
    });
    setEditingTaskId(null);
  };

  // Delete task from Archive
  const handleDeleteTask = (taskId: string) => {
    setJourney(prev => ({
      ...prev,
      daily_tasks: prev.daily_tasks.filter(t => t.id !== taskId)
    }));
    setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    setActiveSessionTaskIds(prev => prev.filter(id => id !== taskId));
  };

  // Add custom new task to Master Archive
  const handleAddNewArchiveTask = () => {
    if (!newArchiveTaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      subject: newArchiveTaskSubject.trim(),
      task_title: newArchiveTaskTitle.trim(),
      completed: false,
      priority: newArchiveTaskPriority,
      taskType: newArchiveTaskType,
      estimated_minutes: 60,
      xp_reward: 100,
      type: 'subject',
      subTasks: [
        { id: `sub-${Date.now()}-0`, title: "Research & documentation review", completed: false },
        { id: `sub-${Date.now()}-1`, title: "Implementation / synthesis phase", completed: false },
        { id: `sub-${Date.now()}-2`, title: "Testing & optimization checklists", completed: false }
      ]
    };

    setJourney(prev => ({
      ...prev,
      daily_tasks: [newTask, ...prev.daily_tasks]
    }));

    setNewArchiveTaskTitle("");
    setShowAddTaskBar(false);
  };

  // Toggle subtask completion in Master list
  const toggleSubTask = (taskId: string, subTaskId: string) => {
    if (onToggleSubTask) {
      onToggleSubTask(taskId, subTaskId);
      return;
    }

    setJourney(prev => {
      const updated = prev.daily_tasks.map(t => {
        if (t.id !== taskId) return t;
        
        const subTasks = t.subTasks?.map(st => {
          if (st.id === subTaskId) {
            return { ...st, completed: !st.completed };
          }
          return st;
        }) || [];

        // If all subtasks are completed, check the main task!
        const allCompleted = subTasks.length > 0 && subTasks.every(st => st.completed);
        
        return {
          ...t,
          subTasks,
          completed: allCompleted
        };
      });
      return { ...prev, daily_tasks: updated };
    });
  };

  // Add customized subtask inline to a master task
  const handleAddSubTask = (taskId: string) => {
    const title = newSubTaskTitles[taskId]?.trim();
    if (!title) return;

    setJourney(prev => {
      const updated = prev.daily_tasks.map(t => {
        if (t.id !== taskId) return t;
        const currentSubTasks = t.subTasks || [];
        return {
          ...t,
          subTasks: [
            ...currentSubTasks,
            { id: `sub-${Date.now()}`, title, completed: false }
          ],
          completed: false // Since we added a new task, main task goes back to incomplete
        };
      });
      return { ...prev, daily_tasks: updated };
    });

    setNewSubTaskTitles(prev => ({ ...prev, [taskId]: "" }));
  };

  // Trigger Session and change View
  const handleDeploySession = () => {
    onStartSession();
    setViewMode('focus');
    setIsRunning(true);
  };

  // Unified task compile helper
  const getUnifiedTasks = (): Task[] => {
    const list: Task[] = [];

    // Add regular tasks from tasks prop if they don't already exist in list
    if (tasks) {
      tasks.forEach(t => {
        if (!list.some(item => item.id === t.id)) {
          list.push({
            ...t,
            taskType: t.taskType || 'DAILY'
          });
        }
      });
    }

    // Add subjects from subjectMastery prop formatted as tasks
    if (subjectMastery) {
      subjectMastery.forEach(s => {
        const sTaskId = `subject-${s.id}`;
        if (!list.some(item => item.id === sTaskId)) {
          list.push({
            id: sTaskId,
            subject: s.name,
            task_title: s.name,
            completed: false,
            priority: s.priority || 'low',
            taskType: s.taskType || 'STUDY',
            estimated_minutes: 60,
            xp_reward: 100,
            type: 'subject',
            subTasks: (s.modules || []).flatMap((m, mIdx) => 
              (m.topics || []).map((topic, tIdx) => ({
                id: `sub-topic-${s.id}-${mIdx}-${tIdx}`,
                title: `${m.name}: ${topic.title}`,
                completed: topic.completed
              }))
            )
          });
        }
      });
    }

    return list;
  };

  const unifiedTasks = getUnifiedTasks();
  
  // Chart 1 data: Subject distribution
  const chartSubjectData = activeSessionTasks.map(t => {
    const totalSub = t.subTasks?.length || 1;
    const completedSub = t.subTasks?.filter(st => st.completed).length || 0;
    const progress = Math.round((completedSub / totalSub) * 100);

    return {
      subject: t.subject,
      'XP Reward': t.xp_reward || 100,
      'Completion %': progress,
      'Target Min': t.estimated_minutes || 45
    };
  });

  // Chart 2 data: Focus timeline
  const chartSessionData = [
    { name: 'Start', 'Energy level': 100, 'Cognitive Index': 90 },
    { name: '25m', 'Energy level': 85, 'Cognitive Index': 95 },
    { name: '50m', 'Energy level': 70, 'Cognitive Index': 80 },
    { name: '75m', 'Energy level': 80, 'Cognitive Index': 88 },
    { name: '100m', 'Energy level': 65, 'Cognitive Index': 75 },
    { name: 'End', 'Energy level': 75, 'Cognitive Index': 85 },
  ];

  return (
    <div className="w-full h-full bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col p-6 overflow-hidden backdrop-blur-md relative hover:z-10 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300">
      {/* Decorative Top active glow */}
      <div className={cn(
        "absolute top-0 left-1/4 right-1/4 h-[1px] blur-[1px] transition-all duration-700",
        viewMode === 'focus' ? COLOR_THEMES[focusThemeKey].glowLine : "bg-amber-500/80"
      )} />

      {/* Centered 2-Way Toggle Switch Header */}
      <div className="flex justify-center items-center pb-1 mb-2.5 flex-shrink-0 relative w-full">
        <div className="flex items-center bg-slate-900/40 p-1 rounded-xl border border-slate-800/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
          <button
            onClick={() => setViewMode('archive')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all duration-300",
              viewMode === 'archive'
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            ARCHIVE
          </button>
          <button
            onClick={() => setViewMode('focus')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all duration-300",
              viewMode === 'focus'
                ? `${COLOR_THEMES[focusThemeKey].tabBg} text-slate-950 shadow-lg ${COLOR_THEMES[focusThemeKey].tabShadow}`
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            FOCUS
          </button>
        </div>

        {/* Add archive task button (visible in archive mode only, on the right side) */}
        {viewMode === 'archive' && (
          <button 
            onClick={() => setShowAddTaskBar(!showAddTaskBar)}
            className="absolute right-0 p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all hover:scale-105 active:scale-95"
            title="New Archive Task"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Container Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          {viewMode === 'archive' ? (
            <motion.div 
              key="archive"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col overflow-hidden min-h-0"
            >

              {/* Inline task creation bar */}
              <AnimatePresence>
                {showAddTaskBar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-5">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">TASK NAME</label>
                        <input
                          type="text"
                          value={newArchiveTaskTitle}
                          onChange={(e) => setNewArchiveTaskTitle(e.target.value)}
                          placeholder="e.g., EVS - Module 1 Review"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">SUBJECT NAME</label>
                        <input
                          type="text"
                          value={newArchiveTaskSubject}
                          onChange={(e) => setNewArchiveTaskSubject(e.target.value)}
                          placeholder="Calculus, EVS..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">TYPE</label>
                        <select
                          value={newArchiveTaskType}
                          onChange={(e) => setNewArchiveTaskType(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-purple-500/50"
                        >
                          <option value="STUDY">STUDY</option>
                          <option value="CODE">CODE</option>
                          <option value="DAILY">DAILY</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">PRIORITY</label>
                        <select
                          value={newArchiveTaskPriority}
                          onChange={(e) => setNewArchiveTaskPriority(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-purple-500/50"
                        >
                          <option value="low">LOW</option>
                          <option value="medium">MEDIUM</option>
                          <option value="high">HIGH</option>
                          <option value="on-going">ON-GOING</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowAddTaskBar(false)}
                        className="px-3 py-1.5 bg-slate-900 text-slate-400 text-[9px] font-black uppercase rounded-lg border border-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddNewArchiveTask}
                        className="px-4 py-1.5 bg-purple-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md hover:bg-purple-500"
                      >
                        Add to Archive
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Master Archive Task list */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar min-h-0 pb-12">
                {unifiedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <AlertCircle className="w-12 h-12 text-purple-400/80 mb-3 animate-pulse" />
                    <span className="text-xs font-black tracking-widest uppercase text-slate-300">NO COURSEWORK IN ARCHIVE</span>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5 leading-relaxed">
                      Your master archive is currently empty. Click below to populate a full starter study roadmap with Computer Science, Calculus, and Biology, or add custom tasks manually.
                    </p>
                    <button
                      onClick={handleDeploySession}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-purple-400/30 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      POPULATE STARTER ROADMAP
                    </button>
                  </div>
                ) : (
                  unifiedTasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    const isExpanded = expandedTaskId === task.id;
                    const isCompleted = task.completed;
                    const priorityKey = task.priority || 'low';
                    const theme = priorityTheme[priorityKey];

                    // Identify Task Type Tag
                    const taskTypeVal = task.taskType || 'STUDY';

                    // Distinguish sources
                    const isSubject = task.id.startsWith("subject-");
                    const isDailyRefresh = tasks.some(t => t.id === task.id);
                    const isRoadmapTask = !isSubject && !isDailyRefresh;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "rounded-xl overflow-hidden transition-all duration-300 border flex flex-col relative",
                          theme.cardGlow,
                          isCompleted && "opacity-75"
                        )}
                      >
                        {/* Header card body & click area to expand */}
                        <div 
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="p-4 cursor-pointer hover:bg-slate-800/30 transition-colors select-none"
                        >
                          <div className="flex justify-between items-start mb-2">
                            {/* Left Side: Expand, Title, Badges */}
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 hover:text-slate-300 shrink-0">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-purple-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                  )}
                                </span>

                                {editingTaskId === task.id ? (
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={() => saveTaskTitle(task.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveTaskTitle(task.id);
                                      if (e.key === 'Escape') setEditingTaskId(null);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-purple-500 w-full"
                                  />
                                ) : (
                                  <h4 className={cn(
                                    "text-xs font-bold text-slate-200 truncate hover:text-white transition-colors",
                                    isCompleted && "line-through text-slate-650"
                                  )}>
                                    {task.task_title}
                                  </h4>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1.5 pl-6">
                                {/* Restricted Task Type Badge */}
                                <span className={cn(
                                  "text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded",
                                  taskTypeVal === 'CODE' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                  taskTypeVal === 'DAILY' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                                  taskTypeVal === 'STUDY' && "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                )}>
                                  {taskTypeVal}
                                </span>
                              </div>
                            </div>

                            {/* Right Side Controls */}
                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Paw action button right on the left of clock */}
                              <div className="relative group/paw">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePawMenu(activePawMenu === task.id ? null : task.id);
                                  }}
                                  className={cn(
                                    "p-1 transition-all hover:scale-110 active:scale-90 cursor-pointer flex items-center justify-center",
                                    taskTypeVal === 'STUDY' ? 'text-emerald-400 hover:text-emerald-300' :
                                    taskTypeVal === 'CODE' ? 'text-blue-400 hover:text-blue-300' :
                                    taskTypeVal === 'DAILY' ? 'text-amber-400 hover:text-amber-300' :
                                    'text-slate-500 hover:text-slate-300'
                                  )}
                                  title="Change Task Type"
                                >
                                  <PawPrint className="w-3.5 h-3.5" />
                                </button>

                                <AnimatePresence>
                                  {activePawMenu === task.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, x: 10, y: "-50%" }}
                                      animate={{ opacity: 1, scale: 1, x: 0, y: "-50%" }}
                                      exit={{ opacity: 0, scale: 0.95, x: 10, y: "-50%" }}
                                      className="absolute right-full mr-2.5 top-1/2 flex items-center gap-2 px-2.5 py-1.5 bg-slate-950/95 border border-slate-800 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.85)] z-50 backdrop-blur-md"
                                      style={{ minWidth: '85px' }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Green (Study) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateTaskTypeUnified(task.id, 'STUDY');
                                          setActivePawMenu(null);
                                        }}
                                        className={cn(
                                          "w-3 h-3 rounded-full bg-emerald-500 transition-transform hover:scale-130 cursor-pointer relative",
                                          taskTypeVal === 'STUDY' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                                        )}
                                        title="Study"
                                      />

                                      {/* Blue/Violet (Code) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateTaskTypeUnified(task.id, 'CODE');
                                          setActivePawMenu(null);
                                        }}
                                        className={cn(
                                          "w-3 h-3 rounded-full bg-blue-500 transition-transform hover:scale-130 cursor-pointer relative",
                                          taskTypeVal === 'CODE' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                                        )}
                                        title="Code"
                                      />

                                      {/* Yellow (Daily) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateTaskTypeUnified(task.id, 'DAILY');
                                          setActivePawMenu(null);
                                        }}
                                        className={cn(
                                          "w-3 h-3 rounded-full bg-amber-500 transition-transform hover:scale-130 cursor-pointer relative",
                                          taskTypeVal === 'DAILY' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                                        )}
                                        title="Daily"
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Priority Selection Dropdown (Clock Icon trigger) */}
                              <div className="relative group/priority">
                                <Clock 
                                  className={cn(
                                    "w-3.5 h-3.5 transition-colors cursor-pointer",
                                    activePriorityMenu === task.id 
                                      ? "text-purple-400" 
                                      : priorityKey === 'high' ? 'text-red-400 hover:text-red-300'
                                      : priorityKey === 'medium' ? 'text-amber-400 hover:text-amber-300'
                                      : priorityKey === 'on-going' ? 'text-cyan-400 hover:text-cyan-300'
                                      : 'text-slate-500 hover:text-slate-300'
                                  )} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePriorityMenu(activePriorityMenu === task.id ? null : task.id);
                                  }}
                                />

                                <AnimatePresence>
                                  {activePriorityMenu === task.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, x: 10, y: "-50%" }}
                                      animate={{ opacity: 1, scale: 1, x: 0, y: "-50%" }}
                                      exit={{ opacity: 0, scale: 0.95, x: 10, y: "-50%" }}
                                      className="absolute right-full mr-2.5 top-1/2 flex items-center gap-2 px-2.5 py-1.5 bg-slate-950/95 border border-slate-800 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.85)] z-50 backdrop-blur-md"
                                      style={{ minWidth: '95px' }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* Red (High) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateTaskPriorityUnified(task.id, 'high');
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateTaskPriorityUnified(task.id, 'medium');
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateTaskPriorityUnified(task.id, 'low');
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateTaskPriorityUnified(task.id, 'on-going');
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

                              {/* Edit title Button (Roadmap tasks only) */}
                              {isRoadmapTask && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); startEditingTask(task); }}
                                  className="p-1 text-slate-500 hover:text-slate-350 transition-all hover:scale-110 active:scale-90"
                                  title="Edit Title"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Button (Roadmap tasks only) */}
                              {isRoadmapTask && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                  className="p-1 text-slate-600 hover:text-red-400 transition-all hover:scale-110 active:scale-90"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Checked checkbox selection for Today's session */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleTaskSelection(task.id); }}
                                className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                                  isSelected
                                    ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_8px_rgba(157,78,221,0.4)]"
                                    : "border-slate-800 hover:border-slate-600 bg-slate-950/40"
                                )}
                                title="Select for Today's Session"
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-white font-black" />}
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar under the main details (just like subject cards!) */}
                          <ProgressBar 
                            progress={
                              task.subTasks && task.subTasks.length > 0 
                                ? (task.subTasks.filter(st => st.completed).length / task.subTasks.length) * 100 
                                : 0
                            } 
                            color={theme.progressClass} 
                          />
                        </div>

                        {/* Expandable Detail Deck (Sub-tasks or checklists) */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.18 }}
                              className="bg-slate-950/40 overflow-hidden"
                            >
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                                  <span className="text-[8px] font-black text-purple-400 tracking-wider uppercase">
                                    {isSubject ? "SUBJECT ROADMAP HIERARCHY" : "SUB-TASKS / METHOD CHECKLIST"}
                                  </span>
                                  {isSubject ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => toggleSubTask(task.id, "subject-stage-all")}
                                        className="text-[8px] font-black tracking-widest text-yellow-500 hover:text-yellow-400 uppercase cursor-pointer"
                                      >
                                        STAGE ALL
                                      </button>
                                      <span className="text-slate-800">|</span>
                                      <button
                                        onClick={() => toggleSubTask(task.id, "subject-unstage-all")}
                                        className="text-[8px] font-black tracking-widest text-slate-500 hover:text-slate-400 uppercase cursor-pointer"
                                      >
                                        CLEAR ALL
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[8px] font-bold text-slate-500">
                                      {task.subTasks?.filter(s => s.completed).length || 0} of {task.subTasks?.length || 0} Complete
                                    </span>
                                  )}
                                </div>

                                {/* Subject Staged / Module Rendering */}
                                {isSubject ? (
                                  <div className="space-y-4 pt-1">
                                    {(() => {
                                      const subId = task.id.replace("subject-", "");
                                      const subjectObj = subjectMastery?.find(s => s.id === subId);
                                      if (!subjectObj || !subjectObj.modules || subjectObj.modules.length === 0) {
                                        return (
                                          <div className="text-[10px] text-slate-500 italic py-2">
                                            No modules defined for this subject.
                                          </div>
                                        );
                                      }
                                      return subjectObj.modules.map((m: any) => {
                                        const allTopicsSelected = m.topics && m.topics.length > 0 && m.topics.every((t: any) => t.selected);
                                        const anyTopicSelected = m.topics && m.topics.some((t: any) => t.selected);
                                        return (
                                          <div key={m.id} className="space-y-2 border-l border-slate-850 pl-3 ml-1">
                                            {/* Module Header with Staging Checkbox */}
                                            <div className="flex items-center justify-between py-1">
                                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{m.name}</span>
                                              <button
                                                onClick={() => toggleSubTask(task.id, allTopicsSelected ? `module-unstage:${m.id}` : `module-stage:${m.id}`)}
                                                className={cn(
                                                  "text-[8px] font-black tracking-wider px-2 py-0.5 rounded border transition-all flex items-center gap-1 cursor-pointer",
                                                  allTopicsSelected
                                                    ? "bg-yellow-400/10 border-yellow-400/50 text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.15)]"
                                                    : anyTopicSelected
                                                    ? "bg-slate-900/40 border-slate-700 text-yellow-300 border-dashed"
                                                    : "bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                                                )}
                                              >
                                                {allTopicsSelected ? (
                                                  <>
                                                    <Check className="w-2.5 h-2.5 text-yellow-400 stroke-[3]" />
                                                    STAGED
                                                  </>
                                                ) : (
                                                  <>
                                                    <Square className="w-2.5 h-2.5" />
                                                    STAGE MODULE
                                                  </>
                                                )}
                                              </button>
                                            </div>

                                            {/* Topics List */}
                                            <div className="space-y-1.5 pl-1">
                                              {m.topics?.map((topic: any) => {
                                                const isTopicSelected = topic.selected || false;
                                                const isTopicCompleted = topic.completed || false;
                                                return (
                                                  <div
                                                    key={topic.id}
                                                    onClick={() => toggleSubTask(task.id, topic.id)}
                                                    className={cn(
                                                      "flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border select-none group",
                                                      isTopicCompleted
                                                        ? "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/15"
                                                        : isTopicSelected
                                                        ? "bg-yellow-400/5 border-yellow-400/20 hover:bg-yellow-400/10"
                                                        : "bg-slate-950/20 border-slate-900/60 hover:bg-slate-950/40"
                                                    )}
                                                  >
                                                    <div className={cn(
                                                      "w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0",
                                                      isTopicCompleted
                                                        ? "bg-emerald-500/10 border-emerald-500"
                                                        : isTopicSelected
                                                        ? "bg-yellow-400/10 border-yellow-400"
                                                        : "bg-slate-900/40 border-slate-700"
                                                    )}>
                                                      {isTopicCompleted ? (
                                                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                                                      ) : isTopicSelected ? (
                                                        <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                                                      ) : null}
                                                    </div>
                                                    <span className={cn(
                                                      "text-[10px] tracking-wide transition-colors",
                                                      isTopicCompleted
                                                        ? "line-through text-slate-500"
                                                        : isTopicSelected
                                                        ? "text-slate-200 font-semibold"
                                                        : "text-slate-400 group-hover:text-slate-300"
                                                    )}>
                                                      {topic.title}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                ) : (
                                  /* Standard Checklist Items */
                                  <div className="space-y-1.5">
                                    {task.subTasks?.map((sub) => (
                                      <div
                                        key={sub.id}
                                        onClick={() => toggleSubTask(task.id, sub.id)}
                                        className={cn(
                                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border select-none group",
                                          sub.completed
                                            ? "bg-emerald-500/5 border-emerald-500/10"
                                            : sub.selected
                                            ? "bg-yellow-400/5 border-yellow-400/20"
                                            : "bg-slate-950/30 border-slate-900"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0",
                                          sub.completed
                                            ? "bg-emerald-500/10 border-emerald-500"
                                            : sub.selected
                                            ? "bg-yellow-400/10 border-yellow-400"
                                            : "bg-slate-900/40 border-slate-700"
                                        )}>
                                          {sub.completed ? (
                                            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                                          ) : sub.selected ? (
                                            <Check className="w-3 h-3 text-yellow-400 stroke-[3]" />
                                          ) : null}
                                        </div>
                                        <span className={cn(
                                          "text-[10px] tracking-wide leading-none transition-colors",
                                          sub.completed ? "line-through text-slate-500" : "text-slate-350",
                                          sub.selected && !sub.completed && "text-yellow-300 font-medium"
                                        )}>
                                          {sub.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Inline subtask add block (only for non-subjects) */}
                                {!isSubject && (
                                  <div className="flex gap-2 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Add sub-task checklist item..."
                                      value={newSubTaskTitles[task.id] || ""}
                                      onChange={(e) => setNewSubTaskTitles(prev => ({ ...prev, [task.id]: e.target.value }))}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask(task.id)}
                                      className="flex-1 bg-slate-950 border border-slate-900 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-purple-650"
                                    />
                                    <button
                                      onClick={() => handleAddSubTask(task.id)}
                                      className="px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[8px] font-black uppercase tracking-wider"
                                    >
                                      Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Action Bar */}
              <div className="flex justify-end pt-3 mt-1 flex-shrink-0">
                <button
                  onClick={handleDeploySession}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2 border border-cyan-400/40 hover:scale-[1.03] active:scale-95 font-jakarta cursor-pointer"
                >
                  <Activity className="w-4 h-4 animate-pulse text-cyan-200" />
                  POPULATE & START SESSION
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="focus"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-hidden"
            >
              <FocusModePanel 
                maxTimeMinutes={maxTimeMinutes}
                timeLeft={timeLeft}
                isRunning={isRunning}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResetTimer={handleResetTimer}
                activeSessionActive={activeSessionActive}
                onUpdateTime={handleUpdateTime}
                currentThemeKey={focusThemeKey}
                onThemeChange={setFocusThemeKey}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
