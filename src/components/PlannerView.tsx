import React, { useState, useEffect } from 'react';
import { StudyJourney, UserStats, SubjectData, Task, StagedFocusItem } from '../types';
import { TopPanel } from './planner/TopPanel';
import { LeftPanel } from './planner/LeftPanel';
import { CentralPanel } from './planner/CentralPanel';
import { RightPanel } from './planner/RightPanel';
import { DEFAULT_STARTER_SUBJECTS, DEFAULT_STARTER_TASKS } from '../mockData';
import { listenToDailySession, commitDailySession, toggleCompletedStagedItem } from '../lib/firebase/session';
import { recordDailyTaskCompletion } from '../lib/firebase/progressTracker';
import { syncSubjectToFirebase } from '../lib/firebase/subjects';
import { syncTaskToFirebase } from '../lib/firebase/tasks';

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
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
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
  tasks = [],
  setTasks
}: PlannerViewProps) => {
  // Task Selection & Active Session States
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [activeSessionTaskIds, setActiveSessionTaskIds] = useState<string[]>([]);
  const [activeSessionActive, setActiveSessionActive] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<any | null>(null);

  // Refs for keeping state synced inside async callbacks/effects without resubscribing
  const latestSubjectsRef = React.useRef(subjectMastery);
  const latestDailyTasksRef = React.useRef(journey.daily_tasks);

  React.useEffect(() => {
    latestSubjectsRef.current = subjectMastery;
  }, [subjectMastery]);

  React.useEffect(() => {
    latestDailyTasksRef.current = journey.daily_tasks;
  }, [journey.daily_tasks]);

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

  const syncActiveSessionWithSelections = (
    latestSubjects: SubjectData[],
    latestDailyTasks: Task[],
    latestSelectedTaskIds: string[] = selectedTaskIds,
    latestTasks: Task[] = tasks,
    forceCommit: boolean = true
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const stagedItems: StagedFocusItem[] = [];
    const newActiveTaskIds: string[] = [];

    // Compile from latestSubjects
    if (latestSubjects) {
      latestSubjects.forEach(s => {
        s.modules.forEach(m => {
          m.topics.forEach((topic) => {
            let shouldStage = false;
            if (!topic.completed) {
              if (topic.selected === true) {
                shouldStage = true;
              }
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
    }

    // Compile from latestDailyTasks and latestTasks
    const combinedTasks = [...(latestTasks || []), ...(latestDailyTasks || [])];
    const processedTaskIds = new Set<string>();

    combinedTasks.forEach(t => {
      if (processedTaskIds.has(t.id)) return;
      processedTaskIds.add(t.id);

      const isTaskSelectedInIds = latestSelectedTaskIds.includes(t.id);

      if (t.subTasks && t.subTasks.length > 0) {
        let addedAny = false;
        t.subTasks.forEach(st => {
          let shouldStage = false;
          if (!st.completed) {
            if (st.selected === true) {
              shouldStage = true;
            }
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
        if (!t.completed) {
          if (isTaskSelectedInIds) {
            shouldStage = true;
          }
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

    setActiveSessionTaskIds(newActiveTaskIds);
    const totalTasks = stagedItems.length;
    const completedTasks = stagedItems.filter(i => i.isCompleted).length;

    setActiveSession((prev: any) => {
      return {
        ...(prev || {}),
        date: todayStr,
        items: stagedItems,
        isActive: totalTasks > 0,
        totalTasks,
        completedTasks
      };
    });
    setActiveSessionActive(totalTasks > 0);

    if (forceCommit || stagedItems.length > 0) {
      commitDailySession(todayStr, stagedItems).catch(console.error);
    }
  };

  // Real-time Firestore session sync subscription
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const unsubscribe = listenToDailySession(todayStr, (session) => {
      if (session) {
        setActiveSession(session);
        setActiveSessionActive(session.isActive);
      } else {
        // Automatically compile and sync today's session if it doesn't exist yet!
        syncActiveSessionWithSelections(
          latestSubjectsRef.current,
          latestDailyTasksRef.current,
          selectedTaskIds,
          tasks,
          false
        );
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Sync activeSessionTaskIds on load or activeSession update
  useEffect(() => {
    if (activeSession && activeSession.items) {
      const taskIds = new Set<string>();
      activeSession.items.forEach((item: any) => {
        if (item.isStaged) {
          if (item.id.includes('_')) {
            const parts = item.id.split('_');
            const taskId = parts[0];
            if (taskId.startsWith('task-')) {
              taskIds.add(taskId);
            } else {
              taskIds.add(`subject-${item.subjectId}`);
            }
          }
        }
      });
      setActiveSessionTaskIds(Array.from(taskIds));
    }
  }, [activeSession]);

  const handleSetSelectedTaskIds = (newIdsOrFn: string[] | ((prev: string[]) => string[])) => {
    setSelectedTaskIds(prev => {
      const next = typeof newIdsOrFn === 'function' ? newIdsOrFn(prev) : newIdsOrFn;
      setTimeout(() => {
        syncActiveSessionWithSelections(subjectMastery, journey.daily_tasks, next);
      }, 0);
      return next;
    });
  };

  // Handle toggling subtasks selection from Central Panel (staged for today)
  const handleToggleSubTaskSelection = (taskId: string, subTaskId: string) => {
    if (taskId.startsWith("subject-")) {
      const subjectId = taskId.replace("subject-", "");
      let isStagedAction = false;
      let isUnstagedAction = false;

      let nextSelectedTaskIds = selectedTaskIds;
      const updated = subjectMastery.map(s => {
        if (s.id === subjectId) {
          let nextSub = { ...s };

          if (subTaskId === "subject-stage-all") {
            isStagedAction = true;
            nextSub.modules = (s.modules || []).map(m => ({
              ...m,
              topics: (m.topics || []).map(t => ({
                ...t,
                selected: t.completed ? false : true
              }))
            }));
          } else if (subTaskId === "subject-unstage-all") {
            isUnstagedAction = true;
            nextSub.modules = (s.modules || []).map(m => ({
              ...m,
              topics: (m.topics || []).map(t => ({ ...t, selected: false }))
            }));
          } else if (subTaskId.startsWith("module-stage:")) {
            const modId = subTaskId.replace("module-stage:", "");
            nextSub.modules = (s.modules || []).map(m => {
              if (m.id === modId) {
                return {
                  ...m,
                  topics: (m.topics || []).map(t => ({
                    ...t,
                    selected: t.completed ? false : true
                  }))
                };
              }
              return m;
            });
          } else if (subTaskId.startsWith("module-unstage:")) {
            const modId = subTaskId.replace("module-unstage:", "");
            nextSub.modules = (s.modules || []).map(m => {
              if (m.id === modId) {
                return {
                  ...m,
                  topics: (m.topics || []).map(t => ({ ...t, selected: false }))
                };
              }
              return m;
            });
          } else {
            nextSub.modules = (s.modules || []).map(m => {
              const updatedTopics = (m.topics || []).map(topic => {
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
          syncSubjectToFirebase(nextSub).catch(console.error);
          return nextSub;
        }
        return s;
      });
      setSubjectMastery(updated);

      // Automatically add or remove subject from selectedTaskIds ONLY for explicit stage/unstage all actions
      if (isStagedAction) {
        setSelectedTaskIds(prev => {
          const next = prev.includes(taskId) ? prev : [...prev, taskId];
          nextSelectedTaskIds = next;
          return next;
        });
      } else if (isUnstagedAction) {
        setSelectedTaskIds(prev => {
          const next = prev.filter(id => id !== taskId);
          nextSelectedTaskIds = next;
          return next;
        });
      }

      setTimeout(() => {
        syncActiveSessionWithSelections(updated, journey.daily_tasks, nextSelectedTaskIds);
      }, 0);
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
          syncTaskToFirebase(updatedTask).catch(console.error);

          const updatedTasksList = tasks.map(t => t.id === realTaskId ? updatedTask : t);
          setTimeout(() => {
            syncActiveSessionWithSelections(subjectMastery, journey.daily_tasks, selectedTaskIds, updatedTasksList);
          }, 0);
        }
      }
    }

    const updatedTasks = journey.daily_tasks.map(t => {
      if (t.id !== taskId) return t;

      const subTasks = t.subTasks?.map(st => {
        if (st.id === subTaskId) {
          return { ...st, selected: !st.selected };
        }
        return st;
      }) || [];

      return {
        ...t,
        subTasks
      };
    });

    setJourney(prev => ({
      ...prev,
      daily_tasks: updatedTasks
    }));

    setTimeout(() => {
      syncActiveSessionWithSelections(subjectMastery, updatedTasks);
    }, 0);
  };

  // Handle toggling subtasks completion from Left Panel (active checklist checkoff)
  const handleToggleSubTaskCompletion = (taskId: string, subTaskId: string, forceState?: boolean) => {
    const itemId = taskId.includes('_') ? taskId : `${taskId}_${subTaskId}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Find current item in activeSession if exists
    const currentItem = activeSession?.items?.find((i: any) => i.id === itemId);
    
    let nextCompletedState = true;
    if (forceState !== undefined) {
      nextCompletedState = forceState;
    } else if (currentItem) {
      nextCompletedState = !currentItem.isCompleted;
    } else {
      // Find fallback default state from existing models
      const parts = itemId.split('_');
      const rootId = parts[0] || taskId;
      const subId = rootId.startsWith("subject-") ? rootId.replace("subject-", "") : rootId;
      const modId = parts[1] || "";
      const topId = parts[2] || subTaskId;
      const isSubjectItem = rootId.startsWith("subject-") || parts.length >= 3;
      
      if (isSubjectItem && subId) {
        const subject = subjectMastery.find(s => s.id === subId);
        const module = subject?.modules?.find(m => m.id === modId);
        const topic = module?.topics?.find(t => t.id === topId);
        if (topic) {
          nextCompletedState = !topic.completed;
        }
      } else {
        const realTaskId = rootId;
        const realSubTaskId = parts[1] || subTaskId;
        if (realTaskId.startsWith("task-") && tasks) {
          const task = tasks.find(t => t.id === realTaskId);
          const subTask = task?.subTasks?.find(st => st.id === realSubTaskId);
          if (subTask) {
            nextCompletedState = !subTask.completed;
          } else if (task) {
            nextCompletedState = !task.completed;
          }
        } else {
          const dailyTask = journey.daily_tasks.find(t => t.id === realTaskId);
          const subTask = dailyTask?.subTasks?.find(st => st.id === realSubTaskId);
          if (subTask) {
            nextCompletedState = !subTask.completed;
          } else if (dailyTask) {
            nextCompletedState = !dailyTask.completed;
          }
        }
      }
    }

    // Build fallback item if not currently in activeSession
    const parts = itemId.split('_');
    const rootId = parts[0] || taskId;
    const isSubjectItem = parts.length >= 3 || rootId.startsWith("subject-") || currentItem?.subjectId;
    let fallbackItem: any = undefined;

    if (!currentItem) {
      const subId = rootId.startsWith("subject-") ? rootId.replace("subject-", "") : rootId;
      const modId = parts[1] || "";
      const topId = parts[2] || subTaskId;
      
      if (isSubjectItem && subId) {
        const subject = subjectMastery.find(s => s.id === subId);
        const module = subject?.modules?.find(m => m.id === modId);
        const topic = module?.topics?.find(t => t.id === topId);
        if (subject && module && topic) {
          fallbackItem = {
            id: itemId,
            subjectId: subject.id,
            subjectName: subject.name,
            taskCategory: subject.taskType || 'STUDY',
            priority: subject.priority || 'low',
            moduleId: module.id,
            moduleName: module.name,
            topicId: topic.id,
            topicTitle: topic.title,
            isStaged: true,
            isCompleted: nextCompletedState,
            stagedAt: new Date().toISOString()
          };
        }
      } else {
        const realTaskId = rootId;
        const realSubTaskId = parts[1] || subTaskId;
        const combinedTasks = [...(tasks || []), ...(journey.daily_tasks || [])];
        const task = combinedTasks.find(t => t.id === realTaskId);

        if (task) {
          if (realSubTaskId && realSubTaskId !== 'default') {
            const subTask = task.subTasks?.find(st => st.id === realSubTaskId);
            if (subTask) {
              fallbackItem = {
                id: itemId,
                subjectId: task.id,
                subjectName: task.subject || 'General',
                taskCategory: task.taskType || 'DAILY',
                priority: task.priority || 'low',
                moduleId: task.id,
                moduleName: task.task_title,
                topicId: subTask.id,
                topicTitle: subTask.title,
                isStaged: true,
                isCompleted: nextCompletedState,
                stagedAt: new Date().toISOString()
              };
            }
          } else {
            fallbackItem = {
              id: itemId,
              subjectId: task.id,
              subjectName: task.subject || 'General',
              taskCategory: task.taskType || 'DAILY',
              priority: task.priority || 'low',
              moduleId: task.id,
              moduleName: task.task_title,
              topicId: 'default',
              topicTitle: task.task_title,
              isStaged: true,
              isCompleted: nextCompletedState,
              stagedAt: new Date().toISOString()
            };
          }
        }
      }
    }

    // 1. OPTIMISTIC UPDATE: Update activeSession state instantly!
    setActiveSession((prevSession: any) => {
      const currentItems = prevSession?.items || [];
      let found = false;
      const updatedItems = currentItems.map((item: any) => {
        if (item.id === itemId) {
          found = true;
          return { ...item, isCompleted: nextCompletedState, isStaged: true };
        }
        return item;
      });

      if (!found && fallbackItem) {
        updatedItems.push({ ...fallbackItem, isCompleted: nextCompletedState, isStaged: true });
      }

      const completedTasks = updatedItems.filter((i: any) => i.isCompleted).length;
      const totalTasks = updatedItems.length;
      return {
        ...(prevSession || {}),
        date: todayStr,
        items: updatedItems,
        isActive: totalTasks > 0,
        totalTasks,
        completedTasks
      };
    });
    setActiveSessionActive(true);

    // If undoing, ensure the master task is added to selectedTaskIds
    if (!nextCompletedState) {
      const realTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      setSelectedTaskIds(prev => prev.includes(realTaskId) ? prev : [...prev, realTaskId]);
    }

    // 2. BACKGROUND FIREBASE SESSION UPDATE
    toggleCompletedStagedItem(todayStr, itemId, nextCompletedState, fallbackItem).catch(console.error);

    // Record XP and streak progress when checking off a focus task
    const xpDelta = nextCompletedState ? 50 : -50;
    recordDailyTaskCompletion(xpDelta, 'FOCUS').then(updatedStats => {
      if (updatedStats && setStats) {
        setStats(updatedStats);
      }
    }).catch(console.error);

    // 3. OPTIMISTIC UPDATE & BACKGROUND SYNC FOR SUBJECT MASTERY
    const partsForSync = itemId.split('_');
    const rootIdForSync = partsForSync[0] || taskId;
    const subId = currentItem?.subjectId || (rootIdForSync.startsWith("subject-") ? rootIdForSync.replace("subject-", "") : rootIdForSync);
    const modId = currentItem?.moduleId || partsForSync[1] || "";
    const topId = currentItem?.topicId || partsForSync[2] || subTaskId;

    const isSubjectItemForSync = rootIdForSync.startsWith("subject-") || partsForSync.length >= 3 || currentItem?.subjectId;

    if (isSubjectItemForSync && subId) {
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
                      return { 
                        ...topic, 
                        completed: nextCompletedState,
                        selected: !nextCompletedState ? true : topic.selected
                      };
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
        syncSubjectToFirebase(updatedSub).catch(console.error);
      }
    }

    // 4. OPTIMISTIC UPDATE & BACKGROUND SYNC FOR REGULAR TASKS & JOURNEY
    const realTaskId = rootIdForSync;
    const realSubTaskId = partsForSync[1] || subTaskId;

    if (realTaskId.startsWith("task-")) {
      if (tasks) {
        const task = tasks.find(t => t.id === realTaskId);
        if (task) {
          const updatedSubTasks = task.subTasks?.map(st => {
            if (st.id === realSubTaskId || st.id === subTaskId) {
              return { 
                ...st, 
                completed: nextCompletedState,
                selected: !nextCompletedState ? true : st.selected
              };
            }
            return st;
          }) || [];
          const allCompleted = updatedSubTasks.length > 0 
            ? updatedSubTasks.every(st => st.completed) 
            : nextCompletedState;
          const limitVal = task.targetCount !== undefined ? task.targetCount : (task.limit || 1);
          const wasCompleted = task.completed;
          
          const updatedTask = {
            ...task,
            subTasks: updatedSubTasks,
            completed: allCompleted,
            isCompleted: allCompleted,
            completedAt: allCompleted ? new Date().toISOString() : undefined,
            count: allCompleted ? limitVal : 0,
            currentCount: allCompleted ? limitVal : 0
          };
          if (setTasks) {
            setTasks(prev => prev.map(t => t.id === realTaskId ? updatedTask : t));
          }
          syncTaskToFirebase(updatedTask).catch(console.error);

          if (allCompleted && !wasCompleted) {
            if (setStats) {
              setStats(s => ({
                ...s,
                totalXP: s.totalXP + (task.xp_reward || 50),
                tasksCompleted: s.tasksCompleted + 1,
                lastActiveDate: new Date().toISOString()
              }));
            }
          } else if (!allCompleted && wasCompleted) {
            if (setStats) {
              setStats(s => ({
                ...s,
                totalXP: Math.max(0, s.totalXP - (task.xp_reward || 50)),
                tasksCompleted: Math.max(0, s.tasksCompleted - 1)
              }));
            }
          }
        }
      }
    }

    setJourney(prev => {
      const updatedTasks = prev.daily_tasks.map(t => {
        if (t.id !== realTaskId) return t;

        const subTasks = t.subTasks?.map(st => {
          if (st.id === realSubTaskId || st.id === subTaskId) {
            return { 
              ...st, 
              completed: nextCompletedState,
              selected: !nextCompletedState ? true : st.selected
            };
          }
          return st;
        }) || [];

        const allCompleted = subTasks.length > 0 
          ? subTasks.every(st => st.completed) 
          : nextCompletedState;
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

  const handlePopulateStarterRoadmap = () => {
    setSubjectMastery(DEFAULT_STARTER_SUBJECTS);
    setJourney(prev => ({
      ...prev,
      journey_title: "Fall Semester Mastery: Engineering & CS",
      daily_tasks: DEFAULT_STARTER_TASKS
    }));

    // Sync starter data to Firebase asynchronously
    DEFAULT_STARTER_SUBJECTS.forEach(s => syncSubjectToFirebase(s).catch(console.error));
    DEFAULT_STARTER_TASKS.forEach(t => syncTaskToFirebase(t).catch(console.error));
  };

  // Unified task compile helper
  const getUnifiedTasks = (): Task[] => {
    const list: Task[] = [];

    // Add regular tasks from tasks prop if they don't already exist in list
    if (tasks) {
      tasks.forEach(t => {
        if (!list.some(item => item.id === t.id)) {
          const isTaskStaged = activeSessionTaskIds.includes(t.id) || selectedTaskIds.includes(t.id);
          const derivedSubTasks = t.subTasks && t.subTasks.length > 0
            ? t.subTasks.map(st => ({
                ...st,
                selected: st.selected || (activeSession?.items?.some(i => i.id === `${t.id}_${st.id}` && i.isStaged) ?? false)
              }))
            : [{
                id: 'default',
                title: t.task_title,
                completed: t.completed,
                selected: isTaskStaged || (activeSession?.items?.some(i => i.id === `${t.id}_default` && i.isStaged) ?? false)
              }];

          list.push({
            ...t,
            taskType: t.taskType || 'DAILY',
            subTasks: derivedSubTasks
          });
        }
      });
    }

    // Add subjects from subjectMastery prop formatted as tasks
    if (subjectMastery) {
      subjectMastery.forEach(s => {
        const sTaskId = `subject-${s.id}`;
        if (!list.some(item => item.id === sTaskId)) {
          const isSubjectStagedInSession = 
            selectedTaskIds.includes(sTaskId) || 
            selectedTaskIds.includes(s.id) ||
            activeSessionTaskIds.includes(sTaskId);

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
              (m.topics || []).map((topic, tIdx) => {
                const isTopicStagedInSession = 
                  topic.selected || 
                  isSubjectStagedInSession ||
                  (activeSession?.items?.some((item: any) => 
                    item.subjectId === s.id && 
                    item.moduleId === m.id && 
                    item.topicId === topic.id && 
                    item.isStaged
                  )) || false;

                return {
                  id: `sub-topic-${s.id}-${mIdx}-${tIdx}`,
                  title: `${m.name}: ${topic.title}`,
                  completed: topic.completed,
                  selected: isTopicStagedInSession
                };
              })
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
            setSelectedTaskIds={handleSetSelectedTaskIds}
            activeSessionTaskIds={activeSessionTaskIds}
            setActiveSessionTaskIds={setActiveSessionTaskIds}
            activeSessionActive={activeSessionActive}
            setActiveSessionActive={setActiveSessionActive}
            onPopulateStarterRoadmap={handlePopulateStarterRoadmap}
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
