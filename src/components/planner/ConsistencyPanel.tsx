import React, { useState, useEffect } from 'react';
import { Activity, Flame, Zap, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth, db } from '../../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export interface DayHistory {
  dayName: string;   // 'THU', 'FRI', 'WED'
  dateNum: string;   // '30', '31', '05'
  isToday: boolean;
  completionRate: number; // 0 to 100
  isLogged: boolean;
  dateString?: string;
}

interface ConsistencyPanelProps {
  stats?: any;
  habitStability?: number;
  activeDaysCount?: number;
  streakCount?: number;
  weeklyHistory?: DayHistory[];
}

export const ConsistencyPanel: React.FC<ConsistencyPanelProps> = ({
  stats = null,
  habitStability: propHabitStability,
  activeDaysCount: propActiveDaysCount,
  streakCount: propStreakCount,
  weeklyHistory: propWeeklyHistory
}) => {
  const [historySessions, setHistorySessions] = useState<any[]>([]);

  // Subscribe to historical Daily Focus Sessions to build an authentic consistency dashboard
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setHistorySessions([]);
        return;
      }

      const sessionsCol = collection(db, `users/${user.uid}/dailyFocusSessions`);
      const q = query(sessionsCol, orderBy("date", "desc"), limit(7));

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const sessions: any[] = [];
          snapshot.forEach((doc) => {
            sessions.push(doc.data());
          });
          setHistorySessions(sessions);
        },
        (error) => {
          if (error.code === 'permission-denied') {
            console.warn("Sessions history listener permission pending auth sync.");
          } else {
            console.error("Error loading daily sessions history:", error);
          }
        }
      );
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, []);

  // Generate date markers for last 7 calendar days to show in consistency tracker
  const getConsistencyHistoryList = (): DayHistory[] => {
    if (propWeeklyHistory && propWeeklyHistory.length === 7) {
      return propWeeklyHistory;
    }

    const list: DayHistory[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(); // e.g., "THU"
      const dateNum = date.getDate().toString().padStart(2, '0'); // e.g., "05"
      const isToday = i === 0;
      
      const matchedSession = historySessions.find(s => s.date === dateString);
      
      let completionRate = 0;
      let isLogged = !!matchedSession;
      if (matchedSession) {
        const total = matchedSession.totalTasks || 0;
        const completed = matchedSession.completedTasks || 0;
        completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      }

      list.push({
        dateString,
        dayName,
        dateNum,
        isToday,
        isLogged,
        completionRate
      });
    }
    return list;
  };

  const computedWeeklyHistory = getConsistencyHistoryList();

  const getHabitStability = () => {
    if (propHabitStability !== undefined) return propHabitStability;
    const loggedDays = computedWeeklyHistory.filter(day => day.isLogged);
    if (loggedDays.length === 0) return 61; // Baseline standard demo
    const sum = loggedDays.reduce((acc, curr) => acc + curr.completionRate, 0);
    return Math.round(sum / loggedDays.length);
  };

  const computedHabitStability = getHabitStability();
  const computedActiveDaysCount = propActiveDaysCount !== undefined 
    ? propActiveDaysCount 
    : computedWeeklyHistory.filter(day => day.isLogged).length;
  const computedStreakCount = propStreakCount !== undefined 
    ? propStreakCount 
    : (stats?.streak || 0);

  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 backdrop-blur-xl relative overflow-hidden shrink-0 hover:z-10 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
      
      {/* Header & Stats Cards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400"/>
          <h3 className="text-xs font-black uppercase text-slate-200 tracking-widest font-jakarta">
            ACTIVITY TRACKER
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-wider group cursor-pointer hover:scale-105 hover:bg-amber-500/20 transition-all duration-300">
          <Flame className="w-3.5 h-3.5 fill-current group-hover:scale-125 group-hover:text-amber-300 transition-all duration-300"/>
          <span>{computedStreakCount}D STREAK</span>
        </div>
      </div>

      {/* Stats Summary Capsules */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-1">
            Habit Stability
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-cyan-400 font-mono tracking-tighter">{computedHabitStability}%</span>
            <span className="text-[9px] font-bold text-slate-500">ACCURACY</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-1">
            Active Days
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-200 font-mono tracking-tighter">{computedActiveDaysCount}/7</span>
            <span className="text-[9px] font-bold text-slate-500">THIS WEEK</span>
          </div>
        </div>
      </div>

      {/* REDESIGNED 7-DAY CALENDAR CAPSULE GRID */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3">
        <div className="grid grid-cols-7 gap-2">
          {computedWeeklyHistory.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              
              {/* Day & Date Header */}
              <div className="text-center">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider block leading-none",
                  item.isToday ? "text-cyan-400" : "text-slate-400"
                )}>
                  {item.dayName}
                </span>
                <span className={cn(
                  "text-[10px] font-mono font-bold mt-1 block leading-none",
                  item.isToday ? "text-cyan-300 font-black" : "text-slate-500"
                )}>
                  {item.dateNum}
                </span>
              </div>

              {/* Status Pill Card */}
              <div className={cn(
                "w-full h-10 rounded-xl flex items-center justify-center text-xs font-mono font-black transition-all border",
                !item.isLogged && "bg-slate-900/60 border-slate-800/80 text-slate-700",
                item.isLogged && item.completionRate === 100 && "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10",
                item.isLogged && item.completionRate < 100 && "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
              )}>
                {item.isLogged ? (
                  item.completionRate === 100 ? (
                    <Check className="w-4 h-4 stroke-[3]"/>
                  ) : (
                    `${item.completionRate}%`
                  )
                ) : (
                  "-"
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* AI micro feedback ticker */}
      <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-2.5 flex items-start gap-2">
        <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[9px] text-slate-400 leading-normal">
          {computedHabitStability === 100 
            ? "Flawless cycle! Every focus session deployed has been carried to full completion."
            : computedHabitStability >= 70 
            ? "Strong momentum. Lock in daily checkpoint tasks to preserve your streak."
            : computedActiveDaysCount > 0
            ? `Keep active! Continue checking off study items to maintain your streak.`
            : "No active history detected. Deploy a workspace in the center and mark checkoffs to start logging."}
        </p>
      </div>

    </div>
  );
};

