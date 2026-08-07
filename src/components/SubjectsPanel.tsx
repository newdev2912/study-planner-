import { Activity, Plus, Trash2, ChevronRight, ChevronDown, Check, Calendar, Clock } from 'lucide-react';
import { ProgressBar } from './Shared';
import { SubjectData, ModuleData, TopicData, PriorityLevel } from '../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardPanel } from './DashboardPanel';
import { syncSubjectToFirebase, deleteSubjectFromFirebase } from '../lib/firebase/subjects';
import { toggleCompletedStagedItem } from '../lib/firebase/session';
import { recordDailyTaskCompletion } from '../lib/firebase/progressTracker';
import { cn } from '../lib/utils';

interface SubjectsPanelProps {
  subjects: SubjectData[];
  setSubjects: (subjects: SubjectData[]) => void;
}

export const SubjectsPanel = ({ subjects, setSubjects }: SubjectsPanelProps) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [activePriorityMenu, setActivePriorityMenu] = useState<string | null>(null);

  const handleSync = (updatedSubjects: SubjectData[]) => {
    setSubjects(updatedSubjects);
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    const newSub: SubjectData = {
      id: `subject-${Date.now()}`,
      name: newSubjectName,
      modules: [],
      priority: 'on-going',
      createdAt: new Date().toISOString()
    };
    const next = [...subjects, newSub];
    handleSync(next);
    await syncSubjectToFirebase(newSub);
    setNewSubjectName("");
    setIsAddingSubject(false);
  };

  const removeSubject = async (id: string) => {
    handleSync(subjects.filter(s => s.id !== id));
    await deleteSubjectFromFirebase(id);
  };

  const updateSubject = async (id: string, updates: Partial<SubjectData>) => {
    const updated = subjects.map(s => {
      if (s.id === id) {
        const nextSub = { ...s, ...updates };
        syncSubjectToFirebase(nextSub);
        return nextSub;
      }
      return s;
    });
    handleSync(updated);
  };

  const addModule = (subjectId: string) => {
    const updated = subjects.map(s => {
      if (s.id === subjectId) {
        const nextSub = {
          ...s,
          modules: [...s.modules, { id: `mod-${Date.now()}`, name: 'New Module', topics: [] }]
        };
        syncSubjectToFirebase(nextSub);
        return nextSub;
      }
      return s;
    });
    handleSync(updated);
  };

  const addTopic = (subjectId: string, moduleId: string) => {
    const updated = subjects.map(s => {
      if (s.id === subjectId) {
        const nextSub = {
          ...s,
          modules: s.modules.map(m => {
            if (m.id === moduleId) {
              return {
                ...m,
                topics: [...m.topics, { id: `top-${Date.now()}`, title: 'New Topic', completed: false }]
              };
            }
            return m;
          })
        };
        syncSubjectToFirebase(nextSub);
        return nextSub;
      }
      return s;
    });
    handleSync(updated);
  };

  const updateModule = (subjectId: string, moduleId: string, updates: Partial<ModuleData>) => {
    const updated = subjects.map(s => {
      if (s.id === subjectId) {
        const nextSub = {
          ...s,
          modules: s.modules.map(m => m.id === moduleId ? { ...m, ...updates } : m)
        };
        syncSubjectToFirebase(nextSub);
        return nextSub;
      }
      return s;
    });
    handleSync(updated);
  };

  const updateTopic = (subjectId: string, moduleId: string, topicId: string, updates: Partial<TopicData>) => {
    const updated = subjects.map(s => {
      if (s.id === subjectId) {
        const nextSub = {
          ...s,
          modules: s.modules.map(m => {
            if (m.id === moduleId) {
              return {
                ...m,
                topics: m.topics.map(t => t.id === topicId ? { ...t, ...updates } : t)
              };
            }
            return m;
          })
        };
        syncSubjectToFirebase(nextSub).catch(console.error);
        return nextSub;
      }
      return s;
    });
    handleSync(updated);

    if (updates.completed !== undefined) {
      const todayStr = new Date().toISOString().split('T')[0];
      const itemId = `${subjectId}_${moduleId}_${topicId}`;
      toggleCompletedStagedItem(todayStr, itemId, updates.completed!).catch(console.error);
      if (updates.completed) {
        recordDailyTaskCompletion(50, 'FOCUS').catch(console.error);
      }
    }
  };

  const removeModule = (subjectId: string, moduleId: string) => {
    const updated = subjects.map(s => {
      if (s.id === subjectId) {
        const nextSub = {
          ...s,
          modules: s.modules.filter(m => m.id !== moduleId)
        };
        syncSubjectToFirebase(nextSub);
        return nextSub;
      }
      return s;
    });
    handleSync(updated);
  };

  const calculateProgress = (subject: SubjectData) => {
    const totalTopics = subject.modules.reduce((acc, mod) => acc + mod.topics.length, 0);
    const completedTopics = subject.modules.reduce((acc, mod) => 
      acc + mod.topics.filter(t => t.completed).length, 0);
    return totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  };

  const priorityConfig: Record<PriorityLevel, { 
    label: string, 
    badge: string, 
    cardGlow: string, 
    progressClass: string, 
    textClass: string 
  }> = {
    'high': { 
      label: 'High', 
      badge: 'bg-red-500/10 text-red-400 border border-red-500/30',
      cardGlow: 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
      progressClass: 'bg-red-500',
      textClass: 'text-red-400'
    },
    'medium': { 
      label: 'Medium', 
      badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      cardGlow: 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]',
      progressClass: 'bg-amber-500',
      textClass: 'text-amber-400'
    },
    'low': { 
      label: 'Low', 
      badge: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
      cardGlow: 'bg-slate-900/40 border-slate-800/50',
      progressClass: 'bg-slate-500',
      textClass: 'text-slate-400'
    },
    'on-going': { 
      label: 'On-Going', 
      badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse',
      cardGlow: 'bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]',
      progressClass: 'bg-cyan-500',
      textClass: 'text-cyan-400'
    }
  };

  return (
    <DashboardPanel 
      title="Subjects" 
      icon={<Activity />} 
      accentColor="cyan"
      headerAction={
        <button 
          onClick={() => setIsAddingSubject(true)}
          className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      }
    >
      <AnimatePresence>
        {isAddingSubject && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex gap-2"
          >
            <input 
              autoFocus
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Subject Name..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-slate-700 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <button onClick={addSubject} className="p-1.5 bg-cyan-600 text-white rounded-lg transition-all hover:scale-105 active:scale-95"><Check className="w-4 h-4"/></button>
            <button onClick={() => setIsAddingSubject(false)} className="p-1.5 bg-slate-800 text-slate-400 rounded-lg transition-all hover:scale-105 active:scale-95"><Trash2 className="w-4 h-4"/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 no-scrollbar">
        {subjects.map((subject) => {
          const currentPriority = subject.priority || 'low';
          return (
            <div key={subject.id} className={cn("rounded-xl overflow-hidden transition-all duration-300 border", priorityConfig[currentPriority].cardGlow)}>
            <div 
              className="p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {expandedSubject === subject.id ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <input 
                      type="text"
                      value={subject.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSubject(subject.id, { name: e.target.value })}
                      className="text-xs font-bold text-slate-200 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none p-0 hover:bg-slate-800/30 rounded px-1.5 transition-colors w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {subject.priority && (
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                        priorityConfig[currentPriority].badge
                      )}>
                        {priorityConfig[currentPriority].label}
                      </span>
                    )}
                    {subject.deadline && (
                      <span className="text-[8px] font-black text-cyan-400/80 uppercase tracking-tighter bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                        Due: {subject.deadline}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative group/priority">
                    <Clock 
                      className={cn(
                        "w-3.5 h-3.5 transition-colors cursor-pointer",
                        activePriorityMenu === subject.id 
                          ? "text-purple-400" 
                          : currentPriority === 'high' ? 'text-red-400 hover:text-red-300'
                          : currentPriority === 'medium' ? 'text-amber-400 hover:text-amber-300'
                          : currentPriority === 'on-going' ? 'text-cyan-400 hover:text-cyan-300'
                          : 'text-slate-500 hover:text-slate-300'
                      )} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePriorityMenu(activePriorityMenu === subject.id ? null : subject.id);
                      }}
                    />
                    <AnimatePresence>
                      {activePriorityMenu === subject.id && (
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
                              updateSubject(subject.id, { priority: 'high' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-red-500 transition-transform hover:scale-130 cursor-pointer relative",
                              currentPriority === 'high' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="High Priority"
                          />

                          {/* Yellow (Medium) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSubject(subject.id, { priority: 'medium' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-amber-500 transition-transform hover:scale-130 cursor-pointer relative",
                              currentPriority === 'medium' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="Medium Priority"
                          />

                          {/* Grey (Low) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSubject(subject.id, { priority: 'low' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-slate-500 transition-transform hover:scale-130 cursor-pointer relative",
                              currentPriority === 'low' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="Low Priority"
                          />

                          {/* Blue (On-going) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSubject(subject.id, { priority: 'on-going' });
                              setActivePriorityMenu(null);
                            }}
                            className={cn(
                              "w-3 h-3 rounded-full bg-cyan-500 transition-transform hover:scale-130 cursor-pointer relative",
                              currentPriority === 'on-going' && "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                            )}
                            title="On-Going"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative group/cal">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 cursor-pointer" />
                    <input 
                      type="date"
                      value={subject.deadline || ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSubject(subject.id, { deadline: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeSubject(subject.id); }}
                    className="p-1 text-slate-600 hover:text-red-400 transition-all hover:scale-110 active:scale-90"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <ProgressBar progress={calculateProgress(subject)} color={priorityConfig[currentPriority].progressClass} />
            </div>

            <AnimatePresence>
              {expandedSubject === subject.id && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-slate-800/50 bg-slate-900/10"
                >
                  <div className="p-4 space-y-4">
                    {subject.modules.map(module => (
                      <div key={module.id} className="space-y-2">
                        <div className="flex items-center justify-between group">
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <input 
                              type="text"
                              value={module.name}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateModule(subject.id, module.id, { name: e.target.value })}
                              placeholder="Module Name..."
                              className={cn("bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none p-0 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800/30 rounded px-1.5 transition-colors w-full", priorityConfig[currentPriority].textClass)}
                            />
                            {module.deadline && (
                              <span className="text-[8px] font-bold text-slate-500 uppercase ml-1.5">
                                Deadline: {module.deadline}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 items-center">
                            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                              <Calendar className="w-3 h-3 text-slate-500 hover:text-cyan-400 cursor-pointer" />
                              <input 
                                type="date"
                                value={module.deadline || ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateModule(subject.id, module.id, { deadline: e.target.value })}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </div>
                            <button 
                              onClick={() => addTopic(subject.id, module.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-cyan-400 transition-all hover:scale-110 active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => removeModule(subject.id, module.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all hover:scale-110 active:scale-90"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="pl-2 space-y-1">
                          {module.topics.map(topic => (
                            <div key={topic.id} className="flex items-center gap-2 group">
                              <button
                                onClick={() => updateTopic(subject.id, module.id, topic.id, { completed: !topic.completed })}
                                className={cn(
                                  "w-3 h-3 rounded-sm border flex items-center justify-center transition-all",
                                  topic.completed ? "bg-cyan-500 border-cyan-500" : "border-slate-700 hover:border-cyan-500/50"
                                )}
                              >
                                {topic.completed && <Check className="w-2 h-2 text-white" />}
                              </button>
                              <input 
                                type="text"
                                value={topic.title}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateTopic(subject.id, module.id, topic.id, { title: e.target.value })}
                                className={cn(
                                  "flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none p-0 text-[11px] transition-colors hover:bg-slate-800/30 rounded px-1.5",
                                  topic.completed ? "text-slate-600 line-through" : "text-slate-400 focus:text-slate-100"
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addModule(subject.id)}
                      className="w-full py-2 border border-dashed border-slate-800 rounded-lg text-[10px] font-bold text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
                    >
                      + Add Module
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );})}
      </div>
    </DashboardPanel>
  );
};
