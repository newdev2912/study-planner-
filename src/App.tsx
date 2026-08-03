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
      focusGoal: "",
      journalEntries: []
    };
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
  { role: 'ai', text: "Hello! I'm your local **Llama 3.2** assistant. Ask me anything about your studies!" }
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

  const handleStartFresh = () => {
    setJourney(prev => ({
      ...prev,
      daily_tasks: prev.daily_tasks.map(t => ({ ...t, completed: false }))
    }));
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

  return (
    <div className="h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden">
      <Header 
        view={view} 
        setView={setView} 
        streak={stats.streak} 
        handleStartFresh={handleStartFresh} 
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
