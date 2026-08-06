import React, { useState, useEffect } from 'react';
import { StudyJourney, UserStats, SubjectData, Task, StagedFocusItem } from '../types';
import { TopPanel } from './planner/TopPanel';
import { LeftPanel } from './planner/LeftPanel';
import { CentralPanel } from './planner/CentralPanel';
import { RightPanel } from './planner/RightPanel';

interface PlannerViewProps {
  journey: StudyJourney;
  setJourney: React.Dispatch<React.SetStateAction<StudyJourney>>;
  stats: UserStats;
  setStats?: React.Dispatch<React.SetStateAction<UserStats>>;
  completionPercentage: number;
  level: number;
  levelProgress: number;
  nextLevelXP: number;
  setView: (view: 'home' | 'planner') => void;
  handleToggleTask: (taskId: string) => void;
  subjectMastery: SubjectData[];
  setSubjectMastery: (subjects: SubjectData[]) => void;
  tasks?: Task[];
}

export const PlannerView = ({
  journey,
  setJourney,
  stats,
  setStats,
  setView,
  handleToggleTask,
  subjectMastery,
  setSubjectMastery,
  tasks = []
}: PlannerViewProps) => {
  // Task Selection & Active Session States
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [activeSessionTaskIds, setActiveSessionTaskIds] = useState<string[]>([]);
  const [activeSessionActive, setActiveSessionActive] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<any | null>(null);

  // Real-time Firestore session sync subscription
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let unsubscribe = () => {};
    
    import('../lib/firebase/session').then(mod => {
      unsubscribe = mod.listenToDailySession(todayStr, (session) => {
        if (session) {
          setActiveSession(session);
          setActiveSessionActive(session.isActive);
        }
      });
    }).catch(console.error);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Auto-enrich journey daily_tasks with taskType & subTasks if missing
  useEffect(() => {
    let needsUpdate = false;
    const enrichedTasks = journey.daily_tasks.map(t => {
      let updated = { ...t };
      let changed = false;

      // Ensure taskType
      if (!t.taskType) {
        let type: 'DAILY' | 'CODE' | 'STUDY' = 'STUDY';
        const titleLower = t.task_title.toLowerCase();
        if (t.tags?.includes('Coding') || titleLower.includes('code') || titleLower.includes('implement') || titleLower.includes('python') || titleLower.includes('fastapi') || titleLower.includes('avl')) {
          type = 'CODE';
        } else if (t.tags?.includes('Daily') || titleLower.includes('daily') || titleLower.includes('routine')) {
          type = 'DAILY';
        }
        updated.taskType = type;
        changed = true;
      }

      // Ensure subTasks
      if (!t.subTasks || t.subTasks.length === 0) {
        let subTasks = [];
        if (t.description) {
          const sentences = t.description.split('.').map(s => s.trim()).filter(Boolean);
          subTasks = sentences.map((sentence, idx) => ({
            id: `${t.id}-sub-${idx}`,
            title: sentence,
            completed: false
          }));
        } else {
          subTasks = [
            { id: `${t.id}-sub-0`, title: "Research standard textbook definitions", completed: false },
            { id: `${t.id}-sub-1`, title: "Resolve practical chapter questions", completed: false },
            { id: `${t.id}-sub-2`, title: "Verify output correctness", completed: false }
          ];
        }
        updated.subTasks = subTasks;
        changed = true;
      }

      if (changed) {
        needsUpdate = true;
      }
      return updated;
    });

    if (needsUpdate) {
      setJourney(prev => ({
        ...prev,
        daily_tasks: enrichedTasks
      }));
    }
  }, [journey.daily_tasks, setJourney]);

  // Handle toggling subtasks selection from Central Panel (staged for today)
  const handleToggleSubTaskSelection = (taskId: string, subTaskId: string) => {
    if (taskId.startsWith("subject-")) {
      const subjectId = taskId.replace("subject-", "");
      let isStagedAction = false;
      let isUnstagedAction = false;

      const updated = subjectMastery.map(s => {
        if (s.id === subjectId) {
          let nextSub = { ...s };

          if (subTaskId === "subject-stage-all") {
            isStagedAction = true;
            nextSub.modules = s.modules.map(m => ({
              ...m,
              topics: m.topics.map(t => ({ ...t, selected: true }))
            }));
          } else if (subTaskId === "subject-unstage-all") {
            isUnstagedAction = true;
            nextSub.modules = s.modules.map(m => ({
              ...m,
              topics: m.topics.map(t => ({ ...t, selected: false }))
            }));
          } else if (subTaskId.startsWith("module-stage:")) {
            const modId = subTaskId.replace("module-stage:", "");
            nextSub.modules = s.modules.map(m => {
              if (m.id === modId) {
                return {
                  ...m,
                  topics: m.topics.map(t => ({ ...t, selected: true }))
                };
              }
              return m;
            });
          } else if (subTaskId.startsWith("module-unstage:")) {
            const modId = subTaskId.replace("module-unstage:", "");
            nextSub.modules = s.modules.map(m => {
              if (m.id === modId) {
                return {
                  ...m,
                  topics: m.topics.map(t => ({ ...t, selected: false }))
                };
              }
              return m;
            });
          } else {
            nextSub.modules = s.modules.map(m => {
              const updatedTopics = m.topics.map(topic => {
                const matches = subTaskId.includes(topic.id) || subTaskId.endsWith(topic.title.replace(/\s+/g, '-'));
                if (matches || topic.id === subTaskId) {
                  return { ...topic, selected: !topic.selected };
                }
                return topic;
              });
              return { ...m, topics: updatedTopics };
            });
          }

          // Sync to Firebase!
          import('../lib/firebase/subjects').then(mod => {
            mod.syncSubjectToFirebase(nextSub);
          }).catch(console.error);
          return nextSub;
        }
        return s;
      });
      setSubjectMastery(updated);

      // Automatically add or remove subject from selectedTaskIds
      const targetSubject = updated.find(s => s.id === subjectId);
      const hasAnySelected = targetSubject?.modules.some(m => m.topics.some(t => t.selected)) || false;

      if (isStagedAction || hasAnySelected) {
        setSelectedTaskIds(prev => prev.includes(taskId) ? prev : [...prev, taskId]);
      } else if (isUnstagedAction || !hasAnySelected) {
        setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
      }
      return;
    }

    if (taskId.startsWith("task-")) {
      const realTaskId = taskId;
      if (tasks) {
        const task = tasks.find(t => t.id === realTaskId);
        if (task) {
          const updatedSubTasks = task.subTasks?.map(st => {
            if (st.id === subTaskId) {
              return { ...st, selected: !st.selected };
            }
            return st;
          }) || [];
          const updatedTask = {
            ...task,
            subTasks: updatedSubTasks
          };
          // Sync to Firebase
          import('../lib/firebase/tasks').then(mod => {
            mod.syncTaskToFirebase(updatedTask);
          }).catch(console.error);

          const hasAnySelected = updatedSubTasks.some(st => st.selected);
          if (hasAnySelected) {
            setSelectedTaskIds(prev => prev.includes(taskId) ? prev : [...prev, taskId]);
          } else {
            setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
          }
        }
      }
    }

    setJourney(prev => {
      const updatedTasks = prev.daily_tasks.map(t => {
        if (t.id !== taskId) return t;

        const subTasks = t.subTasks?.map(st => {
          if (st.id === subTaskId) {
            return { ...st, selected: !st.selected };
          }
          return st;
        }) || [];

        const hasAnySelected = subTasks.some(st => st.selected);
        if (hasAnySelected) {
          setSelectedTaskIds(prev => prev.includes(taskId) ? prev : [...prev, taskId]);
        } else {
          setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
        }

        return {
          ...t,
          subTasks
        };
      });

      return {
        ...prev,
        daily_tasks: updatedTasks
      };
    });
  };

  // Handle toggling subtasks completion from Left Panel (active checklist checkoff)
  const handleToggleSubTaskCompletion = (taskId: string, subTaskId: string) => {
    const itemId = taskId.includes('_') ? taskId : `${taskId}_${subTaskId}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Find current item in activeSession if exists
    const currentItem = activeSession?.items?.find((i: any) => i.id === itemId);
    const nextCompletedState = currentItem ? !currentItem.isCompleted : true;

    // 1. OPTIMISTIC UPDATE: Update activeSession state instantly!
    if (activeSession && activeSession.items) {
      setActiveSession((prevSession: any) => {
        if (!prevSession || !prevSession.items) return prevSession;
        const updatedItems = prevSession.items.map((item: any) => {
          if (item.id === itemId) {
            return { ...item, isCompleted: nextCompletedState };
          }
          return item;
        });
        const completedTasks = updatedItems.filter((i: any) => i.isCompleted).length;
        return {
          ...prevSession,
          items: updatedItems,
          completedTasks
        };
      });
    }

    // 2. BACKGROUND FIREBASE SESSION UPDATE
    import('../lib/firebase/session').then(mod => {
      mod.toggleCompletedStagedItem(todayStr, itemId, nextCompletedState).catch(console.error);
    });

    // Record XP and streak progress when checking off a focus task
    if (nextCompletedState) {
      import('../lib/firebase/progressTracker').then(mod => {
        mod.recordDailyTaskCompletion(50, 'FOCUS').then(updatedStats => {
          if (updatedStats && setStats) {
            setStats(updatedStats);
          }
        }).catch(console.error);
      });
    }

    // 3. OPTIMISTIC UPDATE & BACKGROUND SYNC FOR SUBJECT MASTERY
    const parts = itemId.split('_');
    const subId = currentItem?.subjectId || (taskId.startsWith("subject-") ? taskId.replace("subject-", "") : parts[0]);
    const modId = currentItem?.moduleId || parts[1] || "";
    const topId = currentItem?.topicId || parts[2] || subTaskId;

    const isSubjectItem = taskId.startsWith("subject-") || parts.length >= 3 || currentItem?.subjectId;

    if (isSubjectItem && subId) {
      const updated = subjectMastery.map(s => {
        if (s.id === subId || subId.includes(s.id) || s.id.includes(subId)) {
          return {
            ...s,
            modules: s.modules.map(m => {
              if (m.id === modId || modId === "" || m.topics.some(t => t.id === topId)) {
                return {
                  ...m,
                  topics: m.topics.map(topic => {
                    if (topic.id === topId || topic.title === subTaskId || topic.id === subTaskId) {
                      return { ...topic, completed: nextCompletedState };
                    }
                    return topic;
                  })
                };
              }
              return m;
            })
          };
        }
        return s;
      });

      setSubjectMastery(updated);
      const updatedSub = updated.find(s => s.id === subId || subId.includes(s.id) || s.id.includes(subId));
      if (updatedSub) {
        import('../lib/firebase/subjects').then(mod => {
          mod.syncSubjectToFirebase(updatedSub).catch(console.error);
        });
      }
    }

    // 4. OPTIMISTIC UPDATE & BACKGROUND SYNC FOR REGULAR TASKS & JOURNEY
    const realTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
    const realSubTaskId = taskId.includes('_') ? taskId.split('_')[1] : subTaskId;

    if (realTaskId.startsWith("task-")) {
      if (tasks) {
        const task = tasks.find(t => t.id === realTaskId);
        if (task) {
          const updatedSubTasks = task.subTasks?.map(st => {
            if (st.id === realSubTaskId || st.id === subTaskId) {
              return { ...st, completed: nextCompletedState };
            }
            return st;
          }) || [];
          const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
          const updatedTask = {
            ...task,
            subTasks: updatedSubTasks,
            completed: allCompleted
          };
          import('../lib/firebase/tasks').then(mod => {
            mod.syncTaskToFirebase(updatedTask).catch(console.error);
          });
        }
      }
    }

    setJourney(prev => {
      const updatedTasks = prev.daily_tasks.map(t => {
        if (t.id !== realTaskId) return t;

        const subTasks = t.subTasks?.map(st => {
          if (st.id === realSubTaskId || st.id === subTaskId) {
            return { ...st, completed: nextCompletedState };
          }
          return st;
        }) || [];

        const allCompleted = subTasks.length > 0 && subTasks.every(st => st.completed);
        const wasCompleted = t.completed;

        if (allCompleted && !wasCompleted) {
          if (setStats) {
            setStats(s => ({
              ...s,
              totalXP: s.totalXP + (t.xp_reward || 100),
              tasksCompleted: s.tasksCompleted + 1,
              lastActiveDate: new Date().toISOString()
            }));
          }
        } else if (!allCompleted && wasCompleted) {
          if (setStats) {
            setStats(s => ({
              ...s,
              totalXP: Math.max(0, s.totalXP - (t.xp_reward || 100)),
              tasksCompleted: Math.max(0, s.tasksCompleted - 1)
            }));
          }
        }

        return {
          ...t,
          subTasks,
          completed: allCompleted
        };
      });

      return {
        ...prev,
        daily_tasks: updatedTasks
      };
    });
  };

  const handleStartSession = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let currentSubjects = [...subjectMastery];
    let currentJourneyTasks = [...journey.daily_tasks];
    let currentRegularTasks = [...(tasks || [])];

    // Auto-populate starter coursework if user dashboard/archive is empty
    const { DEFAULT_STARTER_SUBJECTS, DEFAULT_STARTER_TASKS } = await import('../mockData');
    if (currentSubjects.length === 0 && currentJourneyTasks.length === 0 && currentRegularTasks.length === 0) {
      currentSubjects = DEFAULT_STARTER_SUBJECTS;
      currentJourneyTasks = DEFAULT_STARTER_TASKS;
      setSubjectMastery(currentSubjects);
      setJourney(prev => ({
        ...prev,
        journey_title: "Fall Semester Mastery: Engineering & CS",
        daily_tasks: currentJourneyTasks
      }));

      // Sync starter data to Firebase asynchronously
      import('../lib/firebase/subjects').then(mod => {
        currentSubjects.forEach(s => mod.syncSubjectToFirebase(s));
      }).catch(console.error);

      import('../lib/firebase/tasks').then(mod => {
        currentJourneyTasks.forEach(t => mod.syncTaskToFirebase(t));
      }).catch(console.error);
    }

    const stagedItems: StagedFocusItem[] = [];
    const newActiveTaskIds: string[] = [];

    // Check if any specific topics or subtasks are marked selected
    const hasSpecificTopicSelected = currentSubjects.some(s => 
      s.modules.some(m => m.topics.some(t => t.selected === true))
    );
    const hasSpecificSubTaskSelected = currentRegularTasks.some(t => 
      t.subTasks?.some(st => st.selected === true)
    ) || currentJourneyTasks.some(t => 
      t.subTasks?.some(st => st.selected === true)
    );
    const hasAnySpecificSelection = hasSpecificTopicSelected || hasSpecificSubTaskSelected;
    const hasAnySelection = selectedTaskIds.length > 0 || hasAnySpecificSelection;

    // Compile from subjectMastery
    currentSubjects.forEach(s => {
      const isSubjectSelectedInIds = selectedTaskIds.includes(`subject-${s.id}`) || selectedTaskIds.includes(s.id);
      
      s.modules.forEach(m => {
        m.topics.forEach((topic) => {
          let shouldStage = false;

          if (topic.selected === true || isSubjectSelectedInIds) {
            shouldStage = true;
          } else if (!hasAnySelection) {
            // Nothing selected at all - default populate all
            shouldStage = true;
          }

          if (shouldStage) {
            stagedItems.push({
              id: `${s.id}_${m.id}_${topic.id}`,
              subjectId: s.id,
              subjectName: s.name,
              taskCategory: s.taskType || 'STUDY',
              priority: s.priority || 'low',
              moduleId: m.id,
              moduleName: m.name,
              topicId: topic.id,
              topicTitle: topic.title,
              isStaged: true,
              isCompleted: topic.completed,
              stagedAt: new Date().toISOString()
            });
            if (!newActiveTaskIds.includes(`subject-${s.id}`)) {
              newActiveTaskIds.push(`subject-${s.id}`);
            }
          }
        });
      });
    });

    // Compile from regular tasks and journey daily_tasks
    const combinedTasks = [...currentRegularTasks, ...currentJourneyTasks];
    const processedTaskIds = new Set<string>();

    combinedTasks.forEach(t => {
      if (processedTaskIds.has(t.id)) return;
      processedTaskIds.add(t.id);

      const isTaskSelectedInIds = selectedTaskIds.includes(t.id);

      if (t.subTasks && t.subTasks.length > 0) {
        let addedAny = false;
        t.subTasks.forEach(st => {
          let shouldStage = false;
          if (st.selected === true || isTaskSelectedInIds) {
            shouldStage = true;
          } else if (!hasAnySelection) {
            shouldStage = true;
          }

          if (shouldStage) {
            stagedItems.push({
              id: `${t.id}_${st.id}`,
              subjectId: t.id,
              subjectName: t.subject || 'General',
              taskCategory: t.taskType || 'DAILY',
              priority: t.priority || 'low',
              moduleId: t.id,
              moduleName: t.task_title,
              topicId: st.id,
              topicTitle: st.title,
              isStaged: true,
              isCompleted: st.completed,
              stagedAt: new Date().toISOString()
            });
            addedAny = true;
          }
        });
        if (addedAny && !newActiveTaskIds.includes(t.id)) {
          newActiveTaskIds.push(t.id);
        }
      } else {
        let shouldStage = false;
        if (isTaskSelectedInIds || !hasAnySelection) {
          shouldStage = true;
        }

        if (shouldStage) {
          stagedItems.push({
            id: `${t.id}_default`,
            subjectId: t.id,
            subjectName: t.subject || 'General',
            taskCategory: t.taskType || 'DAILY',
            priority: t.priority || 'low',
            moduleId: t.id,
            moduleName: t.task_title,
            topicId: 'default',
            topicTitle: t.task_title,
            isStaged: true,
            isCompleted: t.completed,
            stagedAt: new Date().toISOString()
          });
          if (!newActiveTaskIds.includes(t.id)) {
            newActiveTaskIds.push(t.id);
          }
        }
      }
    });

    // If stagedItems is still empty (e.g., stale selected IDs or no active selection matched),
    // force populate ALL subjects and tasks so clicking POPULATE & START SESSION never leaves session empty!
    if (stagedItems.length === 0) {
      currentSubjects.forEach(s => {
        s.modules.forEach(m => {
          m.topics.forEach((topic) => {
            stagedItems.push({
              id: `${s.id}_${m.id}_${topic.id}`,
              subjectId: s.id,
              subjectName: s.name,
              taskCategory: s.taskType || 'STUDY',
              priority: s.priority || 'low',
              moduleId: m.id,
              moduleName: m.name,
              topicId: topic.id,
              topicTitle: topic.title,
              isStaged: true,
              isCompleted: topic.completed,
              stagedAt: new Date().toISOString()
            });
            if (!newActiveTaskIds.includes(`subject-${s.id}`)) {
              newActiveTaskIds.push(`subject-${s.id}`);
            }
          });
        });
      });

      combinedTasks.forEach(t => {
        if (t.subTasks && t.subTasks.length > 0) {
          t.subTasks.forEach(st => {
            stagedItems.push({
              id: `${t.id}_${st.id}`,
              subjectId: t.id,
              subjectName: t.subject || 'General',
              taskCategory: t.taskType || 'DAILY',
              priority: t.priority || 'low',
              moduleId: t.id,
              moduleName: t.task_title,
              topicId: st.id,
              topicTitle: st.title,
              isStaged: true,
              isCompleted: st.completed,
              stagedAt: new Date().toISOString()
            });
          });
        } else {
          stagedItems.push({
            id: `${t.id}_default`,
            subjectId: t.id,
            subjectName: t.subject || 'General',
            taskCategory: t.taskType || 'DAILY',
            priority: t.priority || 'low',
            moduleId: t.id,
            moduleName: t.task_title,
            topicId: 'default',
            topicTitle: t.task_title,
            isStaged: true,
            isCompleted: t.completed,
            stagedAt: new Date().toISOString()
          });
        }
        if (!newActiveTaskIds.includes(t.id)) {
          newActiveTaskIds.push(t.id);
        }
      });
    }

    setActiveSessionTaskIds(newActiveTaskIds);

    // Optimistic local state update so UI updates immediately even before network roundtrip
    const totalTasks = stagedItems.length;
    const completedTasks = stagedItems.filter(i => i.isCompleted).length;
    setActiveSession({
      date: todayStr,
      items: stagedItems,
      isActive: totalTasks > 0,
      totalTasks,
      completedTasks
    });
    setActiveSessionActive(totalTasks > 0);

    // Commit to Firestore asynchronously
    import('../lib/firebase/session').then(({ commitDailySession }) => {
      commitDailySession(todayStr, stagedItems).catch(console.error);
    }).catch(console.error);
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
            taskType: t.taskType || 'DAILY',
            subTasks: t.subTasks?.map(st => ({
              ...st,
              selected: st.selected || false
            }))
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
                completed: topic.completed,
                selected: topic.selected || false
              }))
            )
          });
        }
      });
    }

    return list;
  };

  const unifiedTasks = getUnifiedTasks();
  // Filter active session tasks to only include those in activeSessionTaskIds AND which have selected subtasks
  const activeSessionTasks = unifiedTasks.filter(t => 
    activeSessionTaskIds.includes(t.id) && 
    t.subTasks && t.subTasks.some(st => st.selected)
  );
  
  const totalSubTasks = activeSessionTasks.reduce((acc, t) => acc + (t.subTasks?.filter(st => st.selected).length || 0), 0);
  const completedSubTasks = activeSessionTasks.reduce((acc, t) => acc + (t.subTasks?.filter(st => st.selected && st.completed).length || 0), 0);
  const activeSessionProgress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden max-w-[1600px] mx-auto w-full select-none">
      {/* Top Panel (Task Selection Strip & Neon Progress Bar) */}
      <TopPanel
        journeyTitle={journey.journey_title}
        activeSessionTasks={activeSessionTasks}
        completionPercentage={activeSession ? (activeSession.totalTasks > 0 ? (activeSession.completedTasks / activeSession.totalTasks) * 100 : 0) : activeSessionProgress}
        setView={setView}
        activeSession={activeSession}
        onTitleChange={(newTitle) => setJourney(prev => ({ ...prev, journey_title: newTitle }))}
      />

      {/* Main workspace layout grid: Left, Central, and Right Panels */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column: Active Session Checklist (3/12 width) */}
        <div className="col-span-12 md:col-span-3 h-full min-h-0">
          <LeftPanel
            activeSessionTasks={activeSessionTasks}
            activeSessionActive={activeSessionActive}
            onToggleSubTask={handleToggleSubTaskCompletion}
            activeSession={activeSession}
          />
        </div>

        {/* Central Column: Master Archive Hub & Focus Graph (6/12 width) */}
        <div className="col-span-12 md:col-span-6 h-full min-h-0">
          <CentralPanel
            journey={journey}
            setJourney={setJourney}
            selectedTaskIds={selectedTaskIds}
            setSelectedTaskIds={setSelectedTaskIds}
            activeSessionTaskIds={activeSessionTaskIds}
            setActiveSessionTaskIds={setActiveSessionTaskIds}
            activeSessionActive={activeSessionActive}
            setActiveSessionActive={setActiveSessionActive}
            onStartSession={handleStartSession}
            tasks={tasks}
            subjectMastery={subjectMastery}
            onToggleSubTask={handleToggleSubTaskSelection}
            activeSession={activeSession}
            activeSessionTasks={activeSessionTasks}
            onToggleSubTaskCompletion={handleToggleSubTaskCompletion}
          />
        </div>

        {/* Right Column: Reserved Utility Bay (3/12 width) */}
        <div className="col-span-12 md:col-span-3 h-full min-h-0">
          <RightPanel 
            activeSession={activeSession}
            activeSessionTasks={activeSessionTasks}
            onToggleSubTask={handleToggleSubTaskCompletion}
            stats={stats}
            subjectMastery={subjectMastery}
          />
        </div>
      </div>
    </div>
  );
};
