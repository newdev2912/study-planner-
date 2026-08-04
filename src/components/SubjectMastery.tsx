import { Activity, Plus, Trash2, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { GlowCard, ProgressBar } from './Shared';
import { SubjectData } from '../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SubjectMasteryProps {
  subjects: SubjectData[];
  setSubjects: (subjects: SubjectData[]) => void;
}

export const SubjectMastery = ({ subjects, setSubjects }: SubjectMasteryProps) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSub: SubjectData = {
      id: `subject-${Date.now()}`,
      name: newSubjectName,
      modules: []
    };
    setSubjects([...subjects, newSub]);
    setNewSubjectName("");
    setIsAddingSubject(false);
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubjectName = (id: string, name: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, name } : s));
  };

  const addModule = (subjectId: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          modules: [...s.modules, { id: `mod-${Date.now()}`, name: 'New Module', topics: [] }]
        };
      }
      return s;
    }));
  };

  const addTopic = (subjectId: string, moduleId: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
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
      }
      return s;
    }));
  };

  const updateTopic = (subjectId: string, moduleId: string, topicId: string, title: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          modules: s.modules.map(m => {
            if (m.id === moduleId) {
              return {
                ...m,
                topics: m.topics.map(t => t.id === topicId ? { ...t, title } : t)
              };
            }
            return m;
          })
        };
      }
      return s;
    }));
  };

  const updateModule = (subjectId: string, moduleId: string, name: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          modules: s.modules.map(m => m.id === moduleId ? { ...m, name } : m)
        };
      }
      return s;
    }));
  };

  const removeModule = (subjectId: string, moduleId: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          modules: s.modules.filter(m => m.id !== moduleId)
        };
      }
      return s;
    }));
  };

  return (
    <GlowCard glowColor="yellow" className="h-full border-yellow-500/20 bg-yellow-500/[0.01]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-yellow-400" />
          Subject Mastery
        </h2>
        <button 
          onClick={() => setIsAddingSubject(true)}
          className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

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
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:ring-1 focus:ring-yellow-500/30"
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <button onClick={addSubject} className="p-1.5 bg-yellow-600 text-white rounded-lg"><Check className="w-4 h-4"/></button>
            <button onClick={() => setIsAddingSubject(false)} className="p-1.5 bg-slate-800 text-slate-400 rounded-lg"><Trash2 className="w-4 h-4"/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 no-scrollbar">
        {subjects.map((subject, i) => (
          <div key={subject.id} className="bg-slate-950/40 border border-slate-800/50 rounded-xl overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-slate-900/30 transition-colors"
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {expandedSubject === subject.id ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  <input 
                    type="text"
                    value={subject.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateSubjectName(subject.id, e.target.value)}
                    className="text-xs font-bold text-slate-200 bg-transparent border-none p-0 focus:ring-0 w-full hover:bg-slate-800/20 rounded px-1 transition-colors"
                  />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSubject(subject.id); }}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <ProgressBar progress={i === 0 ? 45 : 20} color="bg-yellow-500" />
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
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text"
                              value={module.name}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateModule(subject.id, module.id, e.target.value)}
                              placeholder="Module Name..."
                              className="bg-transparent border-none p-0 text-[10px] font-black text-yellow-400 uppercase tracking-widest focus:ring-0 w-full hover:bg-slate-800/20 rounded px-1 transition-colors"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => addTopic(subject.id, module.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-yellow-400 transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => removeModule(subject.id, module.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="pl-2 space-y-1">
                          {module.topics.map(topic => (
                            <div key={topic.id} className="flex items-center gap-2 group">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                              <input 
                                type="text"
                                value={topic.title}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateTopic(subject.id, module.id, topic.id, e.target.value)}
                                className="flex-1 bg-transparent border-none p-0 text-[11px] text-slate-400 focus:ring-0 focus:text-slate-100"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addModule(subject.id)}
                      className="w-full py-2 border border-dashed border-slate-800 rounded-lg text-[10px] font-bold text-slate-500 hover:border-yellow-500/30 hover:text-yellow-400 transition-all"
                    >
                      + Add Module
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </GlowCard>
  );
};
