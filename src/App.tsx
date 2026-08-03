import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { StudyJourney, UserStats } from './types';
import { MOCK_JOURNEY } from './mockData';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { PlannerView } from './components/PlannerView';
import { AIChat } from './components/AIChat';

export default function App() {
  const [view, setView] = useState<'home' | 'planner'>('home');
  const [journey, setJourney] = useState<StudyJourney>(() => {
    const saved = localStorage.getItem('academia_quest_journey');
    return saved ? JSON.parse(saved) : MOCK_JOURNEY;
  });
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('academia_quest_stats');
    return saved ? JSON.parse(saved) : {
      totalXP: 0,
      level: 1,
      streak: 0,
      journalEntries: []
    };
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! I'm your AcademiaQuest Assistant. Need to adjust your roadmap or syllabus today?" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('academia_quest_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('academia_quest_journey', JSON.stringify(journey));
  }, [journey]);

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
            setStats(s => ({ ...s, totalXP: s.totalXP + t.xp_reward }));
          } else {
            setStats(s => ({ ...s, totalXP: Math.max(0, s.totalXP - t.xp_reward) }));
          }
          return { ...t, completed: newState };
        }
        return t;
      });
      return { ...prev, daily_tasks: newTasks };
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isGenerating) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput("");
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      });
      const data = await res.json();
      if (data.daily_tasks) {
        setJourney({ ...data, daily_tasks: data.daily_tasks.map((t: any, i: number) => ({ ...t, id: `ai-${Date.now()}-${i}`, completed: false })) });
        setChatMessages(prev => [...prev, { role: 'ai', text: `Roadmap synchronized. **${data.journey_title}** is now active.` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Signal lost. Unable to reach neural core." }]);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <Header view={view} setView={setView} streak={stats.streak} />

      <main className="transition-all duration-500">
        {view === 'home' ? (
          <HomeView 
            journey={journey} 
            completionPercentage={completionPercentage} 
            setView={setView} 
            downloadJournal={downloadJournal}
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
