import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { StudyJourney, UserStats, SubjectData } from './types';
import { MOCK_JOURNEY } from './mockData';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { PlannerView } from './components/PlannerView';
import { AIChat } from './components/AIChat';
import { db, auth } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState<'home' | 'planner'>('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [journey, setJourney] = useState<StudyJourney>(MOCK_JOURNEY);
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0,
    level: 1,
    streak: 0,
    tasksCompleted: 0,
    lastActiveDate: new Date().toISOString(),
    focusGoal: "",
    journalEntries: []
  });
  const [subjectMastery, setSubjectMastery] = useState<SubjectData[]>([]);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! I'm your local **Llama 3.2** assistant. Ask me anything about your studies!" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const initialLoadDone = useRef(false);

  // 1. Auth Setup with Local Fallback
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error: any) {
          if (error.code === 'auth/admin-restricted-operation') {
            console.warn("⚠️ Cloud Sync requires 'Anonymous Auth' enabled in Firebase Console. Using Local Mode.");
          } else {
            console.error("Firebase Auth Error:", error.code);
          }
          // Fallback to a local identity to keep the app functional
          setUser({ uid: 'local-guest', isLocal: true });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Load Data (Firestore or Local Storage)
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      if (user.isLocal) {
        const savedStats = localStorage.getItem('academia_quest_stats');
        const savedJourney = localStorage.getItem('academia_quest_journey');
        const savedMastery = localStorage.getItem('academia_quest_mastery');

        if (savedStats) setStats(JSON.parse(savedStats));
        if (savedJourney) setJourney(JSON.parse(savedJourney));
        if (savedMastery) setSubjectMastery(JSON.parse(savedMastery));
        
        initialLoadDone.current = true;
        setLoading(false);
        return;
      }

      try {
        // User Stats
        const statsRef = doc(db, 'users', user.uid);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setStats(statsSnap.data() as UserStats);
        } else {
          await setDoc(statsRef, stats);
        }

        // Journey
        const journeyRef = doc(db, 'journeys', user.uid);
        const journeySnap = await getDoc(journeyRef);
        if (journeySnap.exists()) {
          setJourney(journeySnap.data() as StudyJourney);
        } else {
          await setDoc(journeyRef, journey);
        }

        // Subject Mastery
        const masteryRef = doc(db, 'subject_mastery', user.uid);
        const masterySnap = await getDoc(masteryRef);
        if (masterySnap.exists()) {
          setSubjectMastery((masterySnap.data() as {subjects: SubjectData[]}).subjects);
        } else {
          const initialSubs = Array.from(new Set(journey.daily_tasks.map(t => t.subject))).map((name, i) => ({
            id: `subject-${i}`,
            name,
            modules: [
              { id: `mod-${i}-1`, name: 'Core Foundations', topics: [{ id: `top-${i}-1`, title: 'Introduction', completed: true }] }
            ]
          }));
          setSubjectMastery(initialSubs);
          await setDoc(masteryRef, { subjects: initialSubs });
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

  // 3. Save Data (Firestore AND Local Backup)
  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    localStorage.setItem('academia_quest_stats', JSON.stringify(stats));
    if (!user.isLocal) setDoc(doc(db, 'users', user.uid), stats).catch(console.error);
  }, [stats, user]);

  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    localStorage.setItem('academia_quest_journey', JSON.stringify(journey));
    if (!user.isLocal) setDoc(doc(db, 'journeys', user.uid), journey).catch(console.error);
  }, [journey, user]);

  useEffect(() => {
    if (!user || !initialLoadDone.current) return;
    localStorage.setItem('academia_quest_mastery', JSON.stringify(subjectMastery));
    if (!user.isLocal) setDoc(doc(db, 'subject_mastery', user.uid), { subjects: subjectMastery }).catch(console.error);
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
  const handleToggleTask = (taskId: string) => {
    setJourney(prev => {
      const newTasks = prev.daily_tasks.map(t => {
        if (t.id === taskId) {
          const newState = !t.completed;
          if (newState) {
            setStats(s => ({ 
              ...s, 
              totalXP: s.totalXP + t.xp_reward,
              tasksCompleted: s.tasksCompleted + 1,
              lastActiveDate: new Date().toISOString()
            }));
          } else {
            setStats(s => ({ 
              ...s, 
              totalXP: Math.max(0, s.totalXP - t.xp_reward),
              tasksCompleted: Math.max(0, s.tasksCompleted - 1)
            }));
          }
          return { ...t, completed: newState };
        }
        return t;
      });
      return { ...prev, daily_tasks: newTasks };
    });
  };

  const handleAddTask = () => {
    const newTask: any = {
      id: `task-${Date.now()}`,
      day_number: 1,
      subject: 'New Subject',
      task_title: 'New Task',
      description: 'Describe your task here...',
      estimated_minutes: 30,
      xp_reward: 50,
      category: 'Theory',
      ai_daily_summary: 'Keep going!',
      journal_prompt: 'What did you learn?',
      completed: false,
      priority: 'medium'
    };
    setJourney(prev => ({
      ...prev,
      daily_tasks: [newTask, ...prev.daily_tasks]
    }));
  };

  const handleRemoveTask = (taskId: string) => {
    setJourney(prev => ({
      ...prev,
      daily_tasks: prev.daily_tasks.filter(t => t.id !== taskId)
    }));
  };

  const handleUpdateTask = (taskId: string, updates: Partial<any>) => {
    setJourney(prev => ({
      ...prev,
      daily_tasks: prev.daily_tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }));
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
      
      if (user && !user.isLocal) {
        // We don't delete the user auth, just the data docs
        const { deleteDoc, doc } = await import('firebase/firestore');
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
      setJourney(MOCK_JOURNEY);
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
const handleSendMessage = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();
  if (!chatInput.trim() || isGenerating) return;

  const userMessage = chatInput.trim();
  setChatInput("");

  // 1. Add user message + empty AI message placeholder
  const updatedMessages = [
    ...chatMessages,
    { role: 'user' as const, text: userMessage },
    { role: 'ai' as const, text: '' } // Placeholder for typewriter streaming
  ];
  setChatMessages(updatedMessages);
  setIsGenerating(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history: updatedMessages.slice(1, -2).map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text
        }))
      })
    });

    if (!res.ok || !res.body) {
      throw new Error(`Server status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            if (data.content) {
              accumulatedText += data.content;
              
              // Typewriter Effect: Dynamically update the last AI message token by token!
              setChatMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'ai', text: accumulatedText };
                return next;
              });
            }
          } catch (e) {
            // Ignore partial lines
          }
        }
      }
    }
  } catch (err) {
    console.error('Stream Error:', err);
    setChatMessages(prev => {
      const next = [...prev];
      next[next.length - 1] = {
        role: 'ai',
        text: "⚠️ Stream error. Check 'ollama serve' and ngrok connection!"
      };
      return next;
    });
  } finally {
    setIsGenerating(false);
  }
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
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden">
      <Header 
        view={view} 
        setView={setView} 
        streak={stats.streak} 
        handleStartFresh={handleStartFresh} 
        handleDeleteAllData={handleDeleteAllData}
        isLocal={user?.isLocal}
      />

      <main className="flex-1 overflow-hidden transition-all duration-500">
        {view === 'home' ? (
          <HomeView 
            journey={journey} 
            stats={stats}
            completionPercentage={completionPercentage} 
            setView={setView} 
            downloadJournal={downloadJournal}
            updateFocusGoal={handleUpdateFocusGoal}
            handleToggleTask={handleToggleTask}
            handleAddTask={handleAddTask}
            handleRemoveTask={handleRemoveTask}
            handleUpdateTask={handleUpdateTask}
            setJourney={setJourney}
            level={level}
            levelProgress={levelProgress}
            subjectMastery={subjectMastery}
            setSubjectMastery={setSubjectMastery}
          />
        ) : (
          <PlannerView 
            journey={journey} 
            stats={stats} 
            completionPercentage={completionPercentage} 
            level={level}
            levelProgress={levelProgress}
            nextLevelXP={nextLevelXP}
            setView={setView}
            handleToggleTask={handleToggleTask}
          />
        )}
      </main>

      <AIChat 
        isOpen={isChatOpen} 
        setIsOpen={setIsChatOpen} 
        input={chatInput}
        setInput={setChatInput}
        messages={chatMessages}
        isGenerating={isGenerating}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
