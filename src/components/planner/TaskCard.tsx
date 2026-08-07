import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, ChevronRight, Clock, Edit3, Trash2, Check, Square, PawPrint
} from 'lucide-react';
import { Task } from '../../types';
import { cn } from '../../lib/utils';
import { priorityTheme } from './PlannerTheme';
import { ProgressBar } from '../Shared';
import { isModuleFullySelected, isModulePartiallySelected } from './ModuleSelectionLogic';

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
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
  newSubTaskTitle: string;
  onNewSubTaskTitleChange: (val: string) => void;
  activePriorityMenu: string | null;
  setActivePriorityMenu: (id: string | null) => void;
  activePawMenu: string | null;
  setActivePawMenu: (id: string | null) => void;
  subjectMastery: any[];
  activeSession: any;
  activeSessionTaskIds: string[];
  selectedTaskIds: string[];
  tasks: Task[];
  isSelected: boolean;
  isPartiallySelected: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpand,
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
  newSubTaskTitle,
  onNewSubTaskTitleChange,
  activePriorityMenu,
  setActivePriorityMenu,
  activePawMenu,
  setActivePawMenu,
  subjectMastery,
  activeSession,
  activeSessionTaskIds,
  selectedTaskIds,
  tasks,
  isSelected,
  isPartiallySelected
}) => {
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
      className={cn(
        "rounded-xl overflow-hidden transition-all duration-300 border flex flex-col relative",
        theme.cardGlow,
        isCompleted && "opacity-75"
      )}
    >
      {/* Header card body & click area to expand */}
      <div 
        onClick={onToggleExpand}
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
                onClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); setEditTitle(task.task_title); }}
                className="p-1 text-slate-500 hover:text-slate-350 transition-all hover:scale-110 active:scale-90 cursor-pointer"
                title="Edit Title"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete Button (Roadmap tasks only) */}
            {isRoadmapTask && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                className="p-1 text-slate-600 hover:text-red-400 transition-all hover:scale-110 active:scale-90 cursor-pointer"
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
                  : isPartiallySelected
                  ? "bg-purple-950/40 border-purple-500/50 text-purple-400"
                  : "border-slate-800 hover:border-slate-600 bg-slate-950/40"
              )}
              title={isSubject ? (isSelected ? "Deselect Subject" : "Select Subject") : "Select for Today's Session"}
            >
              {isSelected ? (
                <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
              ) : isPartiallySelected ? (
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-sm" />
              ) : null}
            </button>
          </div>
        </div>

        {/* Progress Bar under the main details */}
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
                      const allTopicsSelected = isModuleFullySelected(m, subId, activeSession?.items || []);
                      const anyTopicSelected = isModulePartiallySelected(m, subId, activeSession?.items || []);

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
                              const isTopicSelected = 
                                topic.selected || 
                                (activeSession?.items?.some((item: any) => 
                                  item.subjectId === subId && 
                                  item.moduleId === m.id && 
                                  item.topicId === topic.id && 
                                  item.isStaged
                                )) || false;
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
                    value={newSubTaskTitle}
                    onChange={(e) => onNewSubTaskTitleChange(e.target.value)}
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
};
