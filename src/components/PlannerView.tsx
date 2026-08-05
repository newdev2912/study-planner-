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
        setActiveSession(session);
        if (session && session.isActive) {
          setActiveSessionActive(true);
        } else {
          setActiveSessionActive(false);
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
      const updated = subjectMastery.map(s => {
        if (s.id === subjectId) {
          let nextSub = { ...s };

          if (subTaskId === "subject-stage-all") {
            nextSub.modules = s.modules.map(m => ({
              ...m,
              topics: m.topics.map(t => ({ ...t, selected: true }))
            }));
          } else if (subTaskId === "subject-unstage-all") {
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

      // Automatically add to selectedTaskIds if any subtopic is selected
      const hasAnySelected = updated.find(s => s.id === subjectId)?.modules.some(m => m.topics.some(t => t.selected)) || false;
      if (hasAnySelected) {
        setSelectedTaskIds(prev => prev.includes(taskId) ? prev : [...prev, taskId]);
      } else {
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
  const handleToggleSubTaskCompletion = async (taskId: string, subTaskId: string) => {
    // If it's a composite staged item ID or normal
    const itemId = taskId.includes('_') ? taskId : `${taskId}_${subTaskId}`;
    
    // First update firestore and local sync
    const todayStr = new Date().toISOString().split('T')[0];
    const currentItem = activeSession?.items?.find((i: any) => i.id === itemId);
    const nextCompletedState = currentItem ? !currentItem.isCompleted : true;

    const { toggleCompletedStagedItem } = await import('../lib/firebase/session');
    await toggleCompletedStagedItem(todayStr, itemId, nextCompletedState);

    // Sync back to subjectMastery local state & Firebase
    if (taskId.startsWith("subject-") || itemId.split('_').length === 3) {
      const parts = itemId.split('_');
      const subId = parts[0] || taskId.replace("subject-", "");
      const modId = parts[1] || "";
      const topId = parts[2] || subTaskId;

      const updated = subjectMastery.map(s => {
        if (s.id === subId) {
          return {
            ...s,
            modules: s.modules.map(m => {
              if (m.id === modId || modId === "") {
                return {
                  ...m,
                  topics: m.topics.map(topic => {
                    if (topic.id === topId || topic.title === subTaskId) {
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
      const updatedSub = updated.find(s => s.id === subId);
      if (updatedSub) {
        const mod = await import('../lib/firebase/subjects');
        await mod.syncSubjectToFirebase(updatedSub);
      }
      return;
    }

    // Sync back to regular tasks
    const realTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
    const realSubTaskId = taskId.includes('_') ? taskId.split('_')[1] : subTaskId;

    if (realTaskId.startsWith("task-")) {
      if (tasks) {
        const task = tasks.find(t => t.id === realTaskId);
        if (task) {
          const updatedSubTasks = task.subTasks?.map(st => {
            if (st.id === realSubTaskId) {
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
          // Sync to Firebase
          import('../lib/firebase/tasks').then(mod => {
            mod.syncTaskToFirebase(updatedTask);
          }).catch(console.error);
        }
      }
    }

    setJourney(prev => {
      const updatedTasks = prev.daily_tasks.map(t => {
        if (t.id !== realTaskId) return t;

        const subTasks = t.subTasks?.map(st => {
          if (st.id === realSubTaskId) {
            return { ...st, completed: nextCompletedState };
          }
          return st;
        }) || [];

        const allCompleted = subTasks.length > 0 && subTasks.every(st => st.completed);
        const wasCompleted = t.completed;

        // Dynamic XP Allocation upon full Task checklist completion
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
    const stagedItems: StagedFocusItem[] = [];

    // Compile from subjectMastery
    subjectMastery.forEach(s => {
      s.modules.forEach(m => {
        m.topics.forEach((topic) => {
          if (topic.selected) {
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
          }
        });
      });
    });

    // Compile from regular tasks
    const combinedTasks = [...(tasks || []), ...journey.daily_tasks];
    const processedTaskIds = new Set<string>();
    combinedTasks.forEach(t => {
      if (processedTaskIds.has(t.id)) return;
      processedTaskIds.add(t.id);

      t.subTasks?.forEach(st => {
        if (st.selected) {
          stagedItems.push({
            id: `${t.id}_${st.id}`,
            subjectId: t.id,
            subjectName: t.subject,
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
        }
      });
    });

    // Commit to Firestore
    const { commitDailySession } = await import('../lib/firebase/session');
    await commitDailySession(todayStr, stagedItems);
    setActiveSessionActive(true);
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
          />
        </div>
      </div>
    </div>
  );
};
