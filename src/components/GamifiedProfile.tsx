import { useState, useEffect } from 'react';
import { Trophy, Flame, ChevronLeft, ChevronRight, PawPrint } from 'lucide-react';
import { ProgressBar } from './Shared';
import { UserStats, StudyJourney } from '../types';
import { DashboardPanel } from './DashboardPanel';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface DayLog {
  dateStr: string;      // e.g. 'AUG 05, 2026'
  isoDate: string;      // e.g. '2026-08-05'
  dayNum: number;       // e.g. 5
  xpEarned: number;
  tasksCompleted: number;
  subjects?: string[];
  subject?: string;
  hasDeadline?: boolean;
}

interface GamifiedProfileProps {
  stats: UserStats;
  journey: StudyJourney;
  level: number;
  levelProgress: number;
}

export type CalendarThemeKey = 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'indigo';

export interface CalendarTheme {
  name: string;
  accentColor: 'cyan' | 'emerald' | 'purple' | 'amber' | 'red' | 'indigo';
  dotBg: string;
  textColor: string;
  toggleActive: string;
  progressBg: string;
  badgeBg: string;
  phase1: string; // Low Activity (1-100 XP)
  phase2: string; // Medium Activity (101-250 XP)
  phase3: string; // High Activity (251+ XP)
  selectedRing: string;
}

export const CALENDAR_THEMES: Record<CalendarThemeKey, CalendarTheme> = {
  cyan: {
    name: 'Cyan',
    accentColor: 'cyan',
    dotBg: 'bg-cyan-400',
    textColor: 'text-cyan-400',
    toggleActive: 'bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/30',
    progressBg: 'bg-cyan-500',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    phase1: 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 hover:border-cyan-400',
    phase2: 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20 hover:border-cyan-300',
    phase3: 'bg-cyan-400 border-cyan-300 text-slate-950 font-black shadow-md shadow-cyan-400/30 hover:bg-cyan-300',
    selectedRing: 'ring-2 ring-cyan-400'
  },
  emerald: {
    name: 'Emerald',
    accentColor: 'emerald',
    dotBg: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    toggleActive: 'bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-400/30',
    progressBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    phase1: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:border-emerald-400',
    phase2: 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-500/20 hover:border-emerald-300',
    phase3: 'bg-emerald-400 border-emerald-300 text-slate-950 font-black shadow-md shadow-emerald-400/30 hover:bg-emerald-300',
    selectedRing: 'ring-2 ring-emerald-400'
  },
  violet: {
    name: 'Violet',
    accentColor: 'purple',
    dotBg: 'bg-purple-400',
    textColor: 'text-purple-400',
    toggleActive: 'bg-purple-400 text-slate-950 font-black shadow-md shadow-purple-400/30',
    progressBg: 'bg-purple-500',
    badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    phase1: 'bg-purple-950/30 border-purple-500/30 text-purple-400 hover:border-purple-400',
    phase2: 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-sm shadow-purple-500/20 hover:border-purple-300',
    phase3: 'bg-purple-400 border-purple-300 text-slate-950 font-black shadow-md shadow-purple-400/30 hover:bg-purple-300',
    selectedRing: 'ring-2 ring-purple-400'
  },
  amber: {
    name: 'Amber',
    accentColor: 'amber',
    dotBg: 'bg-amber-400',
    textColor: 'text-amber-400',
    toggleActive: 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30',
    progressBg: 'bg-amber-500',
    badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    phase1: 'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:border-amber-400',
    phase2: 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/20 hover:border-amber-300',
    phase3: 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md shadow-amber-400/30 hover:bg-amber-300',
    selectedRing: 'ring-2 ring-amber-400'
  },
  rose: {
    name: 'Rose',
    accentColor: 'red',
    dotBg: 'bg-rose-400',
    textColor: 'text-rose-400',
    toggleActive: 'bg-rose-400 text-slate-950 font-black shadow-md shadow-rose-400/30',
    progressBg: 'bg-rose-500',
    badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    phase1: 'bg-rose-950/30 border-rose-500/30 text-rose-400 hover:border-rose-400',
    phase2: 'bg-rose-500/20 border-rose-400 text-rose-200 shadow-sm shadow-rose-500/20 hover:border-rose-300',
    phase3: 'bg-rose-400 border-rose-300 text-slate-950 font-black shadow-md shadow-rose-400/30 hover:bg-rose-300',
    selectedRing: 'ring-2 ring-rose-400'
  },
  indigo: {
    name: 'Indigo',
    accentColor: 'indigo',
    dotBg: 'bg-indigo-400',
    textColor: 'text-indigo-400',
    toggleActive: 'bg-indigo-400 text-slate-950 font-black shadow-md shadow-indigo-400/30',
    progressBg: 'bg-indigo-500',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    phase1: 'bg-indigo-950/30 border-indigo-500/30 text-indigo-400 hover:border-indigo-400',
    phase2: 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-sm shadow-indigo-500/20 hover:border-indigo-300',
    phase3: 'bg-indigo-400 border-indigo-300 text-slate-950 font-black shadow-md shadow-indigo-400/30 hover:bg-indigo-300',
    selectedRing: 'ring-2 ring-indigo-400'
  }
};

export const GamifiedProfile = ({ stats, journey, level, levelProgress }: GamifiedProfileProps) => {
  const [viewMode, setViewMode] = useState<'stats' | 'calendar'>('stats');
  const [monthOffset, setMonthOffset] = useState<number>(0); // 0 = Present month, 1..4 = past months
  const [dailyLogsMap, setDailyLogsMap] = useState<Record<string, DayLog>>({});
  const [themeKey, setThemeKey] = useState<CalendarThemeKey>('cyan');
  const [showColorMenu, setShowColorMenu] = useState<boolean>(false);

  const activeTheme = CALENDAR_THEMES[themeKey];

  const todayObj = new Date();
  const todayIso = todayObj.toISOString().split('T')[0];

  const [selectedDay, setSelectedDay] = useState<DayLog>({
    dateStr: 'AUG 05, 2026',
    isoDate: todayIso,
    dayNum: todayObj.getDate(),
    xpEarned: 0,
    tasksCompleted: 0,
    subject: undefined
  });

  // Subscribe to real-time Firebase Firestore Daily Logs & Sessions for historical telemetry
  useEffect(() => {
    let unsubscribeLogs: (() => void) | null = null;
    let unsubscribeSessions: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeLogs) {
        unsubscribeLogs();
        unsubscribeLogs = null;
      }
      if (unsubscribeSessions) {
        unsubscribeSessions();
        unsubscribeSessions = null;
      }

      if (!user) {
        setDailyLogsMap({});
        return;
      }

      const userId = user.uid;

      // Listen to dailyLogs collection
      const logsRef = collection(db, `users/${userId}/dailyLogs`);
      const q = query(logsRef);

      unsubscribeLogs = onSnapshot(
        q,
        (snapshot) => {
          const logs: Record<string, DayLog> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            logs[doc.id] = {
              dateStr: data.dateStr || doc.id,
              isoDate: doc.id,
              dayNum: parseInt(doc.id.split('-')[2] || '1', 10),
              xpEarned: data.xpEarned || 0,
              tasksCompleted: data.tasksCompleted || 0,
              subjects: data.subjects || [],
              subject: data.subjects?.[0] || 'GENERAL',
              hasDeadline: data.hasDeadline || false
            };
          });
          setDailyLogsMap(logs);
        },
        (error) => {
          console.warn("Firestore listener for dailyLogs:", error.message);
        }
      );

      // Also listen to dailyFocusSessions for backwards compatibility
      const sessionsRef = collection(db, `users/${userId}/dailyFocusSessions`);
      const qSessions = query(sessionsRef);

      unsubscribeSessions = onSnapshot(
        qSessions,
        (snapshot) => {
          const sessionLogs: Record<string, DayLog> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            const tasksCount = data.completedTasks || 0;
            sessionLogs[doc.id] = {
              dateStr: doc.id,
              isoDate: doc.id,
              dayNum: parseInt(doc.id.split('-')[2] || '1', 10),
              xpEarned: tasksCount * 80,
              tasksCompleted: tasksCount,
              subject: data.items?.[0]?.subject || 'DSA',
              hasDeadline: false
            };
          });
          setDailyLogsMap(prev => ({ ...sessionLogs, ...prev }));
        },
        (error) => {
          console.warn("Firestore listener for dailyFocusSessions:", error.message);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeSessions) unsubscribeSessions();
    };
  }, []);

  const getRank = (lvl: number) => {
    if (lvl < 5) return "Academic Novice";
    if (lvl < 10) return "Study Sentinel";
    if (lvl < 20) return "Knowledge Knight";
    return "Academic Paladin";
  };

  // Generate days for the active selected month
  const getMonthData = (offset: number) => {
    const now = new Date();
    // Calculate target year & month
    const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = targetDate.getFullYear();
    const monthIndex = targetDate.getMonth();
    
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const fullMonthTitle = `${monthName} ${year}`;

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    // Starting day of week: 0 for Monday, 6 for Sunday
    const firstDayOfWeek = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

    const subjectsList = ['DSA', 'EVS', 'CIVICS', 'MATH', 'PHYSICS', 'CHEMISTRY', 'ALGORITHMS'];

    const days: DayLog[] = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const formattedMonth = String(monthIndex + 1).padStart(2, '0');
      const formattedDay = String(dayNum).padStart(2, '0');
      const isoDate = `${year}-${formattedMonth}-${formattedDay}`;

      const realLog = dailyLogsMap[isoDate];
      const isToday = isoDate === todayIso;

      let xp = 0;
      let tasksCount = 0;
      let primarySubject: string | undefined = undefined;

      if (realLog) {
        xp = realLog.xpEarned;
        tasksCount = realLog.tasksCompleted;
        primarySubject = realLog.subject || (realLog.subjects?.[0]) || undefined;
      } else if (isToday) {
        const completedToday = journey.daily_tasks.filter(t => t.completed);
        tasksCount = completedToday.length;
        xp = completedToday.reduce((acc, t) => acc + (t.xp_reward || 50), 0);
        if (completedToday.length > 0) {
          primarySubject = completedToday[0].subject || 'GENERAL';
        }
      }

      return {
        dateStr: `${monthShort} ${formattedDay}, ${year}`,
        isoDate,
        dayNum,
        xpEarned: xp,
        tasksCompleted: tasksCount,
        subject: primarySubject,
        hasDeadline: false
      };
    });

    return {
      year,
      monthIndex,
      fullMonthTitle,
      daysInMonth,
      firstDayOfWeek,
      days
    };
  };

  const currentMonthData = getMonthData(monthOffset);

  // 4-Phase Heatmap Color Selector
  const getPhaseStyles = (xp: number, isSelected: boolean) => {
    if (xp === 0) {
      // Phase 0: No Activity (0 XP)
      return cn(
        "bg-slate-900/40 border-slate-800/80 text-slate-600 hover:border-slate-700",
        isSelected && cn("font-black z-10 scale-105", activeTheme.selectedRing)
      );
    }
    if (xp <= 100) {
      // Phase 1: Low Activity (1 - 100 XP)
      return cn(
        activeTheme.phase1,
        isSelected && cn("font-black z-10 scale-105", activeTheme.selectedRing)
      );
    }
    if (xp <= 250) {
      // Phase 2: Medium Activity (101 - 250 XP)
      return cn(
        activeTheme.phase2,
        isSelected && cn("font-black z-10 scale-105", activeTheme.selectedRing)
      );
    }
    // Phase 3: High Activity (251+ XP)
    return cn(
      activeTheme.phase3,
      isSelected && "ring-2 ring-white font-black z-10 scale-105"
    );
  };

  const headerToggle = (
    <div className="flex items-center gap-1.5">
      {/* Paw Color Selector */}
      <div className="relative flex items-center">
        {showColorMenu && (
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/95 border border-slate-800 px-2.5 py-1.5 rounded-xl shadow-2xl backdrop-blur-md z-30 whitespace-nowrap animate-fadeIn">
            {(Object.keys(CALENDAR_THEMES) as CalendarThemeKey[]).map((key) => {
              const t = CALENDAR_THEMES[key];
              const isSelected = themeKey === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setThemeKey(key);
                    setShowColorMenu(false);
                  }}
                  className={cn(
                    "w-3.5 h-3.5 rounded-full transition-all transform hover:scale-125 focus:outline-none",
                    t.dotBg,
                    isSelected
                      ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110"
                      : "opacity-70 hover:opacity-100"
                  )}
                  title={`Set ${t.name} Theme`}
                />
              );
            })}
          </div>
        )}

        <button
          onClick={() => setShowColorMenu(!showColorMenu)}
          className={cn(
            "p-1 bg-slate-900/80 border border-slate-800 rounded-lg transition-all active:scale-95 group relative",
            showColorMenu ? "border-slate-700 bg-slate-800" : "hover:bg-slate-850 hover:border-slate-700"
          )}
          title="Customize Calendar Theme Color"
        >
          <PawPrint className={cn("w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110", activeTheme.textColor)} />
        </button>
      </div>

      <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => setViewMode('stats')}
          className={cn(
            "px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all duration-300",
            viewMode === 'stats'
              ? activeTheme.toggleActive
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          STATS
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={cn(
            "px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all duration-300",
            viewMode === 'calendar'
              ? activeTheme.toggleActive
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          CALENDAR
        </button>
      </div>
    </div>
  );

  return (
    <DashboardPanel 
      title="Level & XP Progress" 
      icon={<Trophy className={activeTheme.textColor} />} 
      accentColor={activeTheme.accentColor}
      headerAction={headerToggle}
    >
      {viewMode === 'stats' ? (
        <div className="flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg", activeTheme.badgeBg)}>
                <Trophy className={cn("w-4 h-4", activeTheme.textColor)} />
              </div>
              <div>
                <h2 className="text-base font-black leading-tight text-white">Level {level}</h2>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider", activeTheme.textColor)}>{getRank(level)}</p>
              </div>
            </div>
            <div className={cn("flex items-center gap-1.5 border px-2.5 py-1 rounded-xl", activeTheme.badgeBg)}>
              <Flame className={cn("w-3.5 h-3.5 animate-pulse", activeTheme.textColor)} />
              <span className="text-[10px] font-black text-slate-200">{stats.streak}-Day Streak</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>XP Progress</span>
              <span className={activeTheme.textColor}>{Math.round(levelProgress)}%</span>
            </div>
            <ProgressBar progress={levelProgress} color={activeTheme.progressBg} />
            <p className="text-[9px] text-slate-500 text-right font-bold">{stats.totalXP} XP Total</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/80 text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Tasks Done</p>
              <p className="text-base font-black text-slate-100">{journey.daily_tasks.filter(t => t.completed).length}</p>
            </div>
            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/80 text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Rank Points</p>
              <p className={cn("text-base font-black", activeTheme.textColor)}>{Math.floor(stats.totalXP / 10)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between h-full space-y-2 pt-0.5">
          {/* Month Navigation Header with Small Arrows */}
          <div className="flex items-center justify-between px-1 bg-slate-900/60 border border-slate-800/80 rounded-xl py-1">
            <button
              onClick={() => setMonthOffset(prev => Math.min(4, prev + 1))}
              disabled={monthOffset >= 4}
              className={cn(
                "p-1 rounded-lg transition-all flex items-center justify-center border",
                monthOffset >= 4
                  ? "opacity-25 border-transparent cursor-not-allowed text-slate-600"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title="Previous Month (Past limit: 4 months)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-black text-slate-200 tracking-wider">
                {currentMonthData.fullMonthTitle}
              </span>
              <span className={cn("text-[7.5px] font-mono font-bold uppercase tracking-widest", activeTheme.textColor)}>
                {monthOffset === 0 ? 'PRESENT MONTH' : `${monthOffset} ${monthOffset === 1 ? 'MONTH' : 'MONTHS'} AGO`}
              </span>
            </div>

            <button
              onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
              disabled={monthOffset <= 0}
              className={cn(
                "p-1 rounded-lg transition-all flex items-center justify-center border",
                monthOffset <= 0
                  ? "opacity-25 border-transparent cursor-not-allowed text-slate-600"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              )}
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Single Month Heatmap Grid */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-7 gap-1 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-[8px] font-black text-slate-500 pb-0.5">
                  {d}
                </span>
              ))}

              {/* Leading Empty Slots for Month Day-of-Week Alignment */}
              {Array.from({ length: currentMonthData.firstDayOfWeek }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-5 w-full" />
              ))}

              {/* Days in Month */}
              {currentMonthData.days.map((item) => {
                const isSelected = selectedDay.isoDate === item.isoDate;

                return (
                  <button
                    key={item.isoDate}
                    onClick={() => setSelectedDay(item)}
                    className={cn(
                      "h-5 w-full rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all relative border",
                      getPhaseStyles(item.xpEarned, isSelected),
                      item.hasDeadline && "after:absolute after:top-0.5 after:right-0.5 after:w-1 after:h-1 after:bg-rose-500 after:rounded-full animate-pulse"
                    )}
                  >
                    {item.dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Telemetry Micro-Inspector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[9.5px] font-mono shadow-inner">
            <div className="flex items-center gap-1.5 truncate">
              <span className={cn("font-bold", activeTheme.textColor)}>[{selectedDay.dateStr}]</span>
              <span className="text-slate-300 font-medium">
                {selectedDay.xpEarned > 0 ? `${selectedDay.xpEarned} XP` : 'Rest Day'}
                {selectedDay.tasksCompleted > 0 && ` • ${selectedDay.tasksCompleted} Tasks`}
              </span>
            </div>
            {selectedDay.subject ? (
              <span className={cn("text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0", activeTheme.badgeBg)}>
                {selectedDay.subject}
              </span>
            ) : (
              <span className="text-[8px] text-slate-500">No activity logged</span>
            )}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
};



