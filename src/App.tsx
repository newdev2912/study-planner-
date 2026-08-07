import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { StudyJourney, UserStats, SubjectData, Task } from './types';
import { MOCK_JOURNEY } from './mockData';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { PlannerView } from './components/PlannerView';
import { AuthPage } from './components/AuthPage';
import { db, auth } from './lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToSubjects, syncSubjectToFirebase } from './lib/firebase/subjects';
import { subscribeToTasks, syncTaskToFirebase, removeTaskFromFirebase, resetDailyRegularTasks } from './lib/firebase/tasks';
import { recordDailyTaskCompletion, ensureAndFetchUserStats } from './lib/firebase/progressTracker';
import { toggleMultipleStagedItems } from './lib/firebase/session';
import { DEFAULT_STARTER_SUBJECTS, DEFAULT_STARTER_TASKS } from './mockData';

// checking if the changes are actually being made 

export const BLANK_JOURNEY: StudyJourney = {
  journey_title: "My Academic Journey",
  current_milestone: "Semester Goals",
  total_estimated_days: 0,
  daily_tasks: []
};

export default function App() {
  const [view, setView] = useState<'home' | 'planner'>('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<StudyJourney>(BLANK_JOURNEY);
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0,
    level: 1,
    streak: 0,
    tasksCompleted: 0,
    lastActiveDate: new Date().toISOString(),
    focusGoal: "Master core coursework and maintain daily consistency",
    journalEntries: []
  });
  const [subjectMastery, setSubjectMastery] = useState<SubjectData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  


  const initialLoadDone = useRef(false);

  const seededSubjectsRef = useRef<string | null>(null);
  const seededTasksRef = useRef<string | null>(null);

  // 1. Auth Setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Load Data (Firestore)
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // User Stats & Streak initialization/sync
        const loadedStats = await ensureAndFetchUserStats(user.uid);
        setStats(loadedStats);

        // Journey
        const journeyRef = doc(db, 'journeys', user.uid);
        const journeySnap = await getDoc(journeyRef);
        if (journeySnap.exists()) {
          setJourney(journeySnap.data() as StudyJourney);
        } else {
          await setDoc(journeyRef, BLANK_JOURNEY);
          setJourney(BLANK_JOURNEY);
        }
      } catch (err) {
        console.error("Firestore Load Error:", err);
      } finally {
        initialLoadDone.current = true;
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Real-time Subject Subscription
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToSubjects((subjects) => {
      if (subjects.length > 0) {
        setSubjectMastery(subjects);
      } else {
        if (seededSubjectsRef.current !== user.uid) {
          seededSubjectsRef.current = user.uid;
          DEFAULT_STARTER_SUBJECTS.forEach(s => syncSubjectToFirebase(s));
          setSubjectMastery(DEFAULT_STARTER_SUBJECTS);
        } else {
          setSubjectMastery([]);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time Tasks Subscription
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks((newTasks) => {
      if (newTasks.length > 0) {
        setTasks(newTasks);
        resetDailyRegularTasks(newTasks);
      } else {
        if (seededTasksRef.current !== user.uid) {
          seededTasksRef.current = user.uid;
          DEFAULT_STARTER_TASKS.forEach(t => syncTaskToFirebase(t));
          setTasks(DEFAULT_STARTER_TASKS);
        } else {
          setTasks([]);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Save Data (Firestore AND Local Backup)
  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    localStorage.setItem('academia_quest_stats', JSON.stringify(stats));
    setDoc(doc(db, 'users', user.uid), stats).catch(console.error);
  }, [stats, user]);

  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    localStorage.setItem('academia_quest_journey', JSON.stringify(journey));
    setDoc(doc(db, 'journeys', user.uid), journey).catch(console.error);
  }, [journey, user]);

  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    localStorage.setItem('academia_quest_mastery', JSON.stringify(subjectMastery));
    // Individual subject sync is now handled by SubjectsPanel.tsx
  }, [subjectMastery, user]);

  // Stats derived
  const level = Math.floor(Math.sqrt(stats.totalXP / 100)) + 1;
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const levelProgress = ((stats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const completionPercentage = Math.round(
    (journey.daily_tasks.filter(t => t.completed).length / (journey.daily_tasks.length || 1)) * 100
  );

  // Handlers
  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newState = !task.completed;
    const limitVal = task.targetCount !== undefined ? task.targetCount : (task.limit || 1);
    
    // Recursively set all subtasks completion status to match main task
    const updatedSubTasks = task.subTasks?.map(st => ({
      ...st,
      completed: newState
    })) || [];

    const updatedTask: Task = { 
      ...task, 
      completed: newState, 
      isCompleted: newState,
      completedAt: newState ? new Date().toISOString() : undefined,
      count: newState ? limitVal : 0,
      currentCount: newState ? limitVal : 0,
      subTasks: updatedSubTasks
    };
    
    const xpReward = task.xp_reward || 50;
    const xpDelta = newState ? xpReward : -xpReward;

    // Update local state immediately for snappy UI
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    setStats(s => ({ 
      ...s, 
      totalXP: Math.max(0, s.totalXP + xpDelta),
      tasksCompleted: Math.max(0, s.tasksCompleted + (newState ? 1 : -1)),
      lastActiveDate: new Date().toISOString()
    }));

    if (user) {
      await syncTaskToFirebase(updatedTask);
      
      // Keep Active Focus Session in sync with task completion
      const todayStr = new Date().toISOString().split('T')[0];
      const itemIds = task.subTasks && task.subTasks.length > 0
        ? task.subTasks.map(st => `${task.id}_${st.id}`)
        : [`${task.id}_default`];

      const fallbackItems: any[] = [];
      if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks.forEach(st => {
          fallbackItems.push({
            id: `${task.id}_${st.id}`,
            subjectId: task.id,
            subjectName: task.subject || 'General',
            taskCategory: task.taskType || 'DAILY',
            priority: task.priority || 'low',
            moduleId: task.id,
            moduleName: task.task_title,
            topicId: st.id,
            topicTitle: st.title,
            isStaged: true,
            isCompleted: newState,
            stagedAt: new Date().toISOString()
          });
        });
      } else {
        fallbackItems.push({
          id: `${task.id}_default`,
          subjectId: task.id,
          subjectName: task.subject || 'General',
          taskCategory: task.taskType || 'DAILY',
          priority: task.priority || 'low',
          moduleId: task.id,
          moduleName: task.task_title,
          topicId: 'default',
          topicTitle: task.task_title,
          isStaged: true,
          isCompleted: newState,
          stagedAt: new Date().toISOString()
        });
      }

      toggleMultipleStagedItems(todayStr, itemIds, newState, fallbackItems).catch(console.error);

      const updatedUserStats = await recordDailyTaskCompletion(xpDelta, task.subject || 'GENERAL');
      if (updatedUserStats) {
        setStats(updatedUserStats);
      }
    }
  };

  const handleAddTask = async (type: 'regular' | 'subject' = 'regular') => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      subject: type === 'subject' ? (subjectMastery[0]?.name || 'General') : 'General',
      task_title: 'New Task',
      estimated_minutes: 30,
      completed: false,
      isCompleted: false,
      priority: 'medium',
      count: 0,
      currentCount: 0,
      limit: type === 'regular' ? 3 : 1,
      targetCount: type === 'regular' ? 3 : 1,
      type,
      createdAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString().split('T')[0]
    };
    
    setTasks(prev => [newTask, ...prev]);
    if (user) {
      await syncTaskToFirebase(newTask);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (user) {
      await removeTaskFromFirebase(taskId);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const next = { ...t, ...updates };
          if (user) syncTaskToFirebase(next);
          return next;
        }
        return t;
      });
      return updated;
    });
  };

  const handleStartFresh = () => {
    setJourney(prev => ({
      ...prev,
      daily_tasks: prev.daily_tasks.map(t => ({ ...t, completed: false }))
    }));
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete ALL your progress, tasks, and history from both the cloud and this device. This cannot be undone.")) return;
    
    try {
      localStorage.clear();
      
      if (user) {
        // We don't delete the user auth, just the data docs
        await Promise.all([
          deleteDoc(doc(db, 'users', user.uid)),
          deleteDoc(doc(db, 'journeys', user.uid)),
          deleteDoc(doc(db, 'subject_mastery', user.uid))
        ]);
      }

      // Reset local state to default
      setStats({
        totalXP: 0,
        level: 1,
        streak: 0,
        tasksCompleted: 0,
        lastActiveDate: new Date().toISOString(),
        focusGoal: "",
        journalEntries: []
      });
      setJourney(BLANK_JOURNEY);
      setSubjectMastery([]);
      
      alert("Data wiped successfully. Starting fresh.");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Error deleting data. Some data may still persist.");
    }
  };

  const handleUpdateFocusGoal = (goal: string) => {
    setStats(prev => ({ ...prev, focusGoal: goal }));
  };

  const downloadJournal = () => {
    const content = stats.journalEntries.map(e => `## ${e.date}\n**Prompt:** ${e.prompt}\n\n${e.content}\n\n---`).join('\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academia-quest-journal-${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-800 rounded-2xl" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-500 border-r-blue-500/50 border-b-transparent border-l-transparent rounded-2xl animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              ACADEMIA QUEST
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Synchronizing Neural Link
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden">
      <Header 
        view={view} 
        setView={setView} 
        streak={stats.streak} 
        handleStartFresh={handleStartFresh} 
        handleDeleteAllData={handleDeleteAllData}
      />

      <main className="flex-1 overflow-hidden transition-all duration-500">
        {view === 'home' ? (
          <HomeView 
            journey={journey} 
            stats={stats}
            tasks={tasks}
            completionPercentage={completionPercentage} 
            setView={setView} 
            updateFocusGoal={handleUpdateFocusGoal}
            handleToggleTask={handleToggleTask}
            handleAddTask={handleAddTask}
            handleRemoveTask={handleRemoveTask}
            handleUpdateTask={handleUpdateTask}
            level={level}
            levelProgress={levelProgress}
            subjectMastery={subjectMastery}
            setSubjectMastery={setSubjectMastery}
            setStats={setStats}
          />
        ) : (
          <PlannerView 
            journey={journey} 
            setJourney={setJourney}
            stats={stats} 
            setStats={setStats}
            completionPercentage={completionPercentage} 
            level={level}
            levelProgress={levelProgress}
            nextLevelXP={nextLevelXP}
            setView={setView}
            handleToggleTask={handleToggleTask}
            subjectMastery={subjectMastery}
            setSubjectMastery={setSubjectMastery}
            tasks={tasks}
            setTasks={setTasks}
          />
        )}
      </main>

      
    </div>
  );
}
