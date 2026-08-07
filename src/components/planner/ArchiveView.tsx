import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Sparkles, Activity, Plus } from 'lucide-react';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { isSubjectFullySelected, isSubjectPartiallySelected } from './SubjectSelectionLogic';
import { isDailyTaskFullySelected, isDailyTaskPartiallySelected } from './DailyTaskSelectionLogic';

interface ArchiveViewProps {
  unifiedTasks: Task[];
  expandedTaskId: string | null;
  setExpandedTaskId: (id: string | null) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  saveTaskTitle: (taskId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  handleUpdateTaskPriorityUnified: (taskId: string, priority: 'high' | 'medium' | 'low' | 'on-going') => void;
  handleUpdateTaskTypeUnified: (taskId: string, taskType: 'DAILY' | 'CODE' | 'STUDY') => void;
  toggleTaskSelection: (taskId: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  handleAddSubTask: (taskId: string) => void;
  newSubTaskTitles: Record<string, string>;
  setNewSubTaskTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activePriorityMenu: string | null;
  setActivePriorityMenu: (id: string | null) => void;
  activePawMenu: string | null;
  setActivePawMenu: (id: string | null) => void;
  subjectMastery: any[];
  activeSession: any;
  activeSessionTaskIds: string[];
  selectedTaskIds: string[];
  tasks: Task[];
  onPopulateStarterRoadmap: () => void;
  showAddTaskBar: boolean;
  setShowAddTaskBar: (show: boolean) => void;
  newArchiveTaskTitle: string;
  setNewArchiveTaskTitle: (title: string) => void;
  newArchiveTaskSubject: string;
  setNewArchiveTaskSubject: (subj: string) => void;
  newArchiveTaskType: 'DAILY' | 'CODE' | 'STUDY';
  setNewArchiveTaskType: (t: 'DAILY' | 'CODE' | 'STUDY') => void;
  newArchiveTaskPriority: 'low' | 'medium' | 'high' | 'on-going';
  setNewArchiveTaskPriority: (p: 'low' | 'medium' | 'high' | 'on-going') => void;
  handleAddNewArchiveTask: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  unifiedTasks,
  expandedTaskId,
  setExpandedTaskId,
  editingTaskId,
  setEditingTaskId,
  editTitle,
  setEditTitle,
  saveTaskTitle,
  handleDeleteTask,
  handleUpdateTaskPriorityUnified,
  handleUpdateTaskTypeUnified,
  toggleTaskSelection,
  toggleSubTask,
  handleAddSubTask,
  newSubTaskTitles,
  setNewSubTaskTitles,
  activePriorityMenu,
  setActivePriorityMenu,
  activePawMenu,
  setActivePawMenu,
  subjectMastery,
  activeSession,
  activeSessionTaskIds,
  selectedTaskIds,
  tasks,
  onPopulateStarterRoadmap,
  showAddTaskBar,
  setShowAddTaskBar,
  newArchiveTaskTitle,
  setNewArchiveTaskTitle,
  newArchiveTaskSubject,
  setNewArchiveTaskSubject,
  newArchiveTaskType,
  setNewArchiveTaskType,
  newArchiveTaskPriority,
  setNewArchiveTaskPriority,
  handleAddNewArchiveTask
}) => {
  return (
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
              onClick={onPopulateStarterRoadmap}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-purple-400/30 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              POPULATE STARTER ROADMAP
            </button>
          </div>
        ) : (
          unifiedTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;

            // Distinguish sources
            const isSubject = task.id.startsWith("subject-");

            let isSubjectFullySelectedVal = false;
            let isSubjectPartiallySelectedVal = false;

            if (isSubject) {
              const subId = task.id.replace("subject-", "");
              const subjectObj = subjectMastery?.find(s => s.id === subId);
              if (subjectObj) {
                isSubjectFullySelectedVal = isSubjectFullySelected(subjectObj, activeSession?.items);
                isSubjectPartiallySelectedVal = isSubjectPartiallySelected(subjectObj, activeSession?.items);
              }
            }

            const isSelected = isSubject 
              ? isSubjectFullySelectedVal 
              : isDailyTaskFullySelected(task, selectedTaskIds);

            const isPartiallySelected = isSubject 
              ? (isSubjectPartiallySelectedVal && !isSubjectFullySelectedVal) 
              : isDailyTaskPartiallySelected(task, selectedTaskIds);

            return (
              <TaskCard
                key={task.id}
                task={task}
                isExpanded={isExpanded}
                onToggleExpand={() => setExpandedTaskId(isExpanded ? null : task.id)}
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
                newSubTaskTitle={newSubTaskTitles[task.id] || ""}
                onNewSubTaskTitleChange={(val) => setNewSubTaskTitles(prev => ({ ...prev, [task.id]: val }))}
                activePriorityMenu={activePriorityMenu}
                setActivePriorityMenu={setActivePriorityMenu}
                activePawMenu={activePawMenu}
                setActivePawMenu={setActivePawMenu}
                subjectMastery={subjectMastery || []}
                activeSession={activeSession}
                activeSessionTaskIds={activeSessionTaskIds}
                selectedTaskIds={selectedTaskIds}
                tasks={tasks || []}
                isSelected={isSelected}
                isPartiallySelected={isPartiallySelected}
              />
            );
          })
        )}
      </div>
    </motion.div>
  );
};
