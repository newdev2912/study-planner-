import React, { useState, useEffect } from 'react';
import { StudyJourney, UserStats, SubjectData, Task } from '../types';
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

  // Handle toggling subtasks from Left Panel or Central Panel Detail Deck (unified)
  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    if (taskId.startsWith("subject-")) {
      const subjectId = taskId.replace("subject-", "");
      const updated = subjectMastery.map(s => {
        if (s.id === subjectId) {
          const nextSub = {
            ...s,
            modules: s.modules.map(m => {
              const updatedTopics = m.topics.map(topic => {
                const matches = subTaskId.includes(topic.id) || subTaskId.endsWith(topic.title.replace(/\s+/g, '-'));
                if (matches || topic.id === subTaskId) {
                  return { ...topic, completed: !topic.completed };
                }
                return topic;
              });
              return { ...m, topics: updatedTopics };
            })
          };
          // Sync to Firebase!
          import('../lib/firebase/subjects').then(mod => {
            mod.syncSubjectToFirebase(nextSub);
          }).catch(console.error);
          return nextSub;
        }
        return s;
      });
      setSubjectMastery(updated);
      return;
    }

    if (taskId.startsWith("task-")) {
      const realTaskId = taskId;
      if (tasks) {
        const task = tasks.find(t => t.id === realTaskId);
        if (task) {
          const updatedSubTasks = task.subTasks?.map(st => {
            if (st.id === subTaskId) {
              return { ...st, completed: !st.completed };
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
        if (t.id !== taskId) return t;

        const subTasks = t.subTasks?.map(st => {
          if (st.id === subTaskId) {
            const nextCompleted = !st.completed;
            return { ...st, completed: nextCompleted };
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

  const handleStartSession = () => {
    setActiveSessionTaskIds(selectedTaskIds);
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
  const activeSessionTasks = unifiedTasks.filter(t => activeSessionTaskIds.includes(t.id));
  
  const totalSubTasks = activeSessionTasks.reduce((acc, t) => acc + (t.subTasks?.length || 0), 0);
  const completedSubTasks = activeSessionTasks.reduce((acc, t) => acc + (t.subTasks?.filter(st => st.completed).length || 0), 0);
  const activeSessionProgress = totalSubTasks > 0 ? (completedSubTasks / totalSubTasks) * 100 : 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-hidden max-w-[1600px] mx-auto w-full select-none">
      {/* Top Panel (Task Selection Strip & Neon Progress Bar) */}
      <TopPanel
        journeyTitle={journey.journey_title}
        activeSessionTasks={activeSessionTasks}
        completionPercentage={activeSessionProgress}
        setView={setView}
      />

      {/* Main workspace layout grid: Left, Central, and Right Panels */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column: Active Session Checklist (3/12 width) */}
        <div className="col-span-12 md:col-span-3 h-full min-h-0">
          <LeftPanel
            activeSessionTasks={activeSessionTasks}
            activeSessionActive={activeSessionActive}
            onToggleSubTask={handleToggleSubTask}
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
            onToggleSubTask={handleToggleSubTask}
          />
        </div>

        {/* Right Column: Reserved Utility Bay (3/12 width) */}
        <div className="col-span-12 md:col-span-3 h-full min-h-0">
          <RightPanel />
        </div>
      </div>
    </div>
  );
};
