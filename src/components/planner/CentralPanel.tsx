import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { StudyJourney, Task } from '../../types';
import { cn } from '../../lib/utils';
import { COLOR_THEMES, ColorThemeKey } from './FocusModePanel';
import { updateSubjectPriority, updateSubjectTaskType } from '../../lib/firebase/subjects';
import { syncTaskToFirebase } from '../../lib/firebase/tasks';
import { ArchiveView } from './ArchiveView';
import { FocusView } from './FocusView';
import { getUnifiedTasksList, getFocusActiveTasksList } from './UniformityLogic';
import { isSubjectFullySelected, isSubjectPartiallySelected } from './SubjectSelectionLogic';
import { isDailyTaskFullySelected } from './DailyTaskSelectionLogic';
import { toggleModuleSelection } from './ModuleSelectionLogic';
import { toggleIndividualSubtask, deleteIndividualSubtask, addIndividualSubtask } from './SubtopicSelectionLogic';

interface CentralPanelProps {
  journey: StudyJourney;
  setJourney: React.Dispatch<React.SetStateAction<StudyJourney>>;
  selectedTaskIds: string[];
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeSessionTaskIds: string[];
  setActiveSessionTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  activeSessionActive: boolean;
  setActiveSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
  onPopulateStarterRoadmap: () => void;
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
  onPopulateStarterRoadmap,
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

  const unifiedTasks = getUnifiedTasksList(
    tasks,
    subjectMastery,
    selectedTaskIds,
    activeSessionTaskIds,
    activeSession
  );

  // Handle task selection
  const toggleTaskSelection = (taskId: string) => {
    let isCurrentlySelected = selectedTaskIds.includes(taskId);
    if (taskId.startsWith("subject-")) {
      const subId = taskId.replace("subject-", "");
      const subjectObj = subjectMastery?.find(s => s.id === subId);
      if (subjectObj) {
        isCurrentlySelected = isSubjectFullySelected(subjectObj, activeSession?.items);
      }
      if (onToggleSubTask) {
        onToggleSubTask(taskId, isCurrentlySelected ? "subject-unstage-all" : "subject-stage-all");
      }
    } else {
      const normalTask = unifiedTasks.find(t => t.id === taskId);
      if (normalTask) {
        const isFullySel = isDailyTaskFullySelected(normalTask, selectedTaskIds);
        if (normalTask.subTasks && normalTask.subTasks.length > 0) {
          const nonCompletedSubTasks = normalTask.subTasks.filter(st => !st.completed);
          if (nonCompletedSubTasks.length > 0) {
            const nextState = !isFullySel;
            nonCompletedSubTasks.forEach(st => {
              if (st.selected !== nextState) {
                if (onToggleSubTask) {
                  onToggleSubTask(taskId, st.id);
                }
              }
            });
          }
        } else {
          setSelectedTaskIds(prev => 
            isFullySel ? prev.filter(id => id !== taskId) : [...prev, taskId]
          );
        }
      }
    }
  };

  // Handle change in task priority (unified across subjects, daily, and roadmap)
  const handleUpdateTaskPriorityUnified = (taskId: string, priority: 'high' | 'medium' | 'low' | 'on-going') => {
    if (taskId.startsWith("subject-")) {
      const subjectId = taskId.replace("subject-", "");
      updateSubjectPriority(subjectId, priority).catch(console.error);
      setActivePriorityMenu(null);
      return;
    }

    const isDaily = tasks.some(t => t.id === taskId);
    if (isDaily) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        syncTaskToFirebase({ ...task, priority }).catch(console.error);
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
      updateSubjectTaskType(subjectId, taskType).catch(console.error);
      setActivePawMenu(null);
      return;
    }

    const isDaily = tasks.some(t => t.id === taskId);
    if (isDaily) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        syncTaskToFirebase({ ...task, taskType }).catch(console.error);
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
        { id: `sub-${Date.now()}-0`, title: "Research & documentation review", completed: false, selected: true },
        { id: `sub-${Date.now()}-1`, title: "Implementation / synthesis phase", completed: false, selected: true },
        { id: `sub-${Date.now()}-2`, title: "Testing & optimization checklists", completed: false, selected: true }
      ]
    };

    setJourney(prev => ({
      ...prev,
      daily_tasks: [newTask, ...prev.daily_tasks]
    }));

    setNewArchiveTaskTitle("");
    setShowAddTaskBar(false);
  };

  // Toggle subtask completion/selection in Master list
  const toggleSubTask = (taskId: string, subTaskId: string) => {
    if (onToggleSubTask) {
      onToggleSubTask(taskId, subTaskId);
      return;
    }

    setJourney(prev => {
      const updated = prev.daily_tasks.map(t => {
        if (t.id !== taskId) return t;
        
        let subTasks = t.subTasks || [];
        subTasks = toggleIndividualSubtask(subTasks, subTaskId);

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
          subTasks: addIndividualSubtask(currentSubTasks, title),
          completed: false // Since we added a new task, main task goes back to incomplete
        };
      });
      return { ...prev, daily_tasks: updated };
    });

    setNewSubTaskTitles(prev => ({ ...prev, [taskId]: "" }));
  };

  // Helper to populate starter data
  const handlePopulateStarter = () => {
    onPopulateStarterRoadmap();
  };

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
        {viewMode === 'archive' ? (
          <ArchiveView 
            unifiedTasks={unifiedTasks}
            expandedTaskId={expandedTaskId}
            setExpandedTaskId={setExpandedTaskId}
            editingTaskId={editingTaskId}
            setEditingTaskId={setEditingTaskId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            saveTaskTitle={saveTaskTitle}
            handleDeleteTask={handleDeleteTask}
            handleUpdateTaskPriorityUnified={handleUpdateTaskPriorityUnified}
            handleUpdateTaskTypeUnified={handleUpdateTaskTypeUnified}
            toggleTaskSelection={toggleTaskSelection}
            toggleSubTask={toggleSubTask}
            handleAddSubTask={handleAddSubTask}
            newSubTaskTitles={newSubTaskTitles}
            setNewSubTaskTitles={setNewSubTaskTitles}
            activePriorityMenu={activePriorityMenu}
            setActivePriorityMenu={setActivePriorityMenu}
            activePawMenu={activePawMenu}
            setActivePawMenu={setActivePawMenu}
            subjectMastery={subjectMastery}
            activeSession={activeSession}
            activeSessionTaskIds={activeSessionTaskIds}
            selectedTaskIds={selectedTaskIds}
            tasks={tasks}
            onPopulateStarterRoadmap={handlePopulateStarter}
            showAddTaskBar={showAddTaskBar}
            setShowAddTaskBar={setShowAddTaskBar}
            newArchiveTaskTitle={newArchiveTaskTitle}
            setNewArchiveTaskTitle={setNewArchiveTaskTitle}
            newArchiveTaskSubject={newArchiveTaskSubject}
            setNewArchiveTaskSubject={setNewArchiveTaskSubject}
            newArchiveTaskType={newArchiveTaskType}
            setNewArchiveTaskType={setNewArchiveTaskType}
            newArchiveTaskPriority={newArchiveTaskPriority}
            setNewArchiveTaskPriority={setNewArchiveTaskPriority}
            handleAddNewArchiveTask={handleAddNewArchiveTask}
          />
        ) : (
          <FocusView 
            maxTimeMinutes={maxTimeMinutes}
            timeLeft={timeLeft}
            isRunning={isRunning}
            onStartTimer={handleStartTimer}
            onPauseTimer={handlePauseTimer}
            onResetTimer={handleResetTimer}
            activeSessionActive={activeSessionActive}
            onUpdateTime={handleUpdateTime}
            focusThemeKey={focusThemeKey}
            setFocusThemeKey={setFocusThemeKey}
          />
        )}
      </div>
    </div>
  );
};
