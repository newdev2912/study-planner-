import React, { useState, useEffect } from 'react';
import { Activity, Flame, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth, db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface ConsistencyPanelProps {
  stats?: any;
}

export const ConsistencyPanel = ({ stats = null }: ConsistencyPanelProps) => {
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Subscribe to historical Daily Focus Sessions to build an authentic consistency dashboard
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoadingHistory(false);
      return;
    }
    
    const sessionsCol = collection(db, `users/${userId}/dailyFocusSessions`);
    const q = query(sessionsCol, orderBy("date", "desc"), limit(7));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions: any[] = [];
      snapshot.forEach((doc) => {
        sessions.push(doc.data());
      });
      setHistorySessions(sessions);
      setLoadingHistory(false);
    }, (error) => {
      console.error("Error loading daily sessions history:", error);
      setLoadingHistory(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Generate date markers for last 7 calendar days to show in consistency tracker
  const getConsistencyHistoryList = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., "Mon"
      const dateLabel = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }); // e.g., "08/05"
      
      const matchedSession = historySessions.find(s => s.date === dateString);
      list.push({
        dateString,
        dayLabel,
        dateLabel,
        hasSession: !!matchedSession,
        session: matchedSession
      });
    }
    return list;
  };

  const consistencyHistory = getConsistencyHistoryList();

  const getConsistencyIndex = () => {
    const activeHistory = consistencyHistory.filter(day => day.hasSession);
    if (activeHistory.length === 0) return 0;
    
    const sum = activeHistory.reduce((acc, curr) => {
      const pct = curr.session.totalTasks > 0 
        ? (curr.session.completedTasks / curr.session.totalTasks) * 100 
        : 0;
      return acc + pct;
    }, 0);
    return Math.round(sum / activeHistory.length);
  };

  const consistencyScore = getConsistencyIndex();
  const activeStreak = stats?.streak || 0;

  return (
    <div className="h-[285px] bg-slate-900/20 border border-slate-800/80 rounded-2xl flex flex-col p-4 overflow-hidden backdrop-blur-md relative shrink-0">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase font-jakarta">CONSISTENCY INDEX</span>
        </div>
        
        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-amber-500" />
          <span>{activeStreak}D STREAK</span>
        </div>
      </div>

      {/* Score metrics & dynamic summary */}
      <div className="grid grid-cols-2 gap-3 mb-3 flex-shrink-0">
        <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-900/80 flex flex-col justify-center">
          <span className="text-[7px] font-black text-slate-500 tracking-wider uppercase">HABIT STABILITY</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-cyan-400 font-mono tracking-tighter">{consistencyScore}%</span>
            <span className="text-[8px] font-bold text-slate-500">ACCURACY</span>
          </div>
        </div>
        <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-900/80 flex flex-col justify-center">
          <span className="text-[7px] font-black text-slate-500 tracking-wider uppercase">ACTIVE DAYS</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-100 font-mono tracking-tighter">
              {consistencyHistory.filter(day => day.hasSession).length}/7
            </span>
            <span className="text-[8px] font-bold text-slate-500">THIS WEEK</span>
          </div>
        </div>
      </div>

      {/* 7-Day calendar checkoff list */}
      <div className="flex items-center justify-between gap-1 p-2 bg-slate-950/20 rounded-xl border border-slate-900/50 mb-3 flex-shrink-0">
        {consistencyHistory.map((day, idx) => {
          const isToday = idx === 6;
          
          let dotClass = "border-slate-800 bg-slate-950/40 text-slate-700";
          let pct = 0;
          let displayVal = "";
          
          if (day.hasSession) {
            const total = day.session.totalTasks;
            const completed = day.session.completedTasks;
            pct = total > 0 ? (completed / total) * 100 : 0;
            
            if (pct === 100) {
              dotClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]";
              displayVal = "✓";
            } else if (pct > 0) {
              dotClass = "bg-amber-500/10 border-amber-500/40 text-amber-400";
              displayVal = `${Math.round(pct)}%`;
            } else {
              dotClass = "border-slate-750 bg-slate-900/40 text-slate-500";
              displayVal = "0%";
            }
          } else {
            displayVal = "-";
          }

          return (
            <div 
              key={day.dateString}
              className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
            >
              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-[7px] font-bold",
                  isToday ? "text-cyan-400 font-extrabold" : "text-slate-500"
                )}>
                  {day.dayLabel}
                </span>
                <span className="text-[6px] text-slate-600 font-mono">{day.dateLabel.split('/')[1]}</span>
              </div>

              <div className={cn(
                "w-7 h-7 rounded-lg border text-[8px] font-mono font-bold flex items-center justify-center transition-all select-none",
                isToday && !day.hasSession && "border-dashed border-cyan-500/35 animate-pulse",
                dotClass
              )}>
                {displayVal}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI micro feedback ticker */}
      <div className="flex-1 bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 flex items-start gap-2">
        <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[9px] text-slate-400 leading-normal">
          {consistencyScore === 100 
            ? "Flawless cycle! Every focus session deployed has been carried to full completion."
            : consistencyScore >= 70 
            ? "Strong momentum. Lock in daily checkpoint tasks to preserve your streak."
            : activeStreak > 0
            ? `Keep active! Continue checking off study items to maintain your ${activeStreak}-day streak.`
            : "No active history detected. Deploy a workspace in the center and mark checkoffs to start logging."}
        </p>
      </div>

    </div>
  );
};
