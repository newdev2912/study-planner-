import { Target, Zap, BookOpen, PenTool, Play, Plus, Download, Activity, Flag } from 'lucide-react';
import { motion } from 'motion/react';
import { GlowCard, ProgressBar } from './Shared';
import { StudyJourney, UserStats } from '../types';
import { cn } from '../lib/utils';
import { format, subDays } from 'date-fns';

interface HomeViewProps {
  journey: StudyJourney;
  stats: UserStats;
  completionPercentage: number;
  setView: (view: 'home' | 'planner') => void;
  downloadJournal: () => void;
  updateFocusGoal: (goal: string) => void;
}

const ConsistencyGrid = ({ completionPercentage }: { completionPercentage: number }) => {
  const days = Array.from({ length: 28 }).map((_, i) => {
    const date = subDays(new Date(), 27 - i);
    const isToday = i === 27;
    const completed = isToday ? completionPercentage === 100 : Math.random() > 0.3;
    return { date, completed, isToday };
  });

  return (
    <div className="flex flex-wrap gap-1.5 justify-between">
      {days.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.005 }}
            className={cn(
              "w-5 h-5 rounded-md transition-all duration-500 relative",
              day.completed 
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                : "bg-slate-800 border border-slate-700",
              day.isToday && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950"
            )}
          >
            {day.completed && (
              <motion.div 
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-400 blur-sm rounded-md"
              />
            )}
          </motion.div>
          {i % 7 === 0 && <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">{format(day.date, 'MMM d')}</span>}
        </div>
      ))}
    </div>
  );
};

export const HomeView = ({ journey, stats, completionPercentage, setView, downloadJournal, updateFocusGoal }: HomeViewProps) => {
  return (
    <div className="h-full max-w-[1400px] mx-auto px-6 py-6 flex flex-col gap-6 overflow-hidden">
      {/* Top Banner: Focus Goal */}
      <div className="flex-shrink-0">
        <GlowCard glowColor="blue" className="py-4 px-6 border-blue-500/10 bg-blue-500/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg">
              <Flag className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Primary Daily Focus</p>
              <input 
                type="text"
                value={stats.focusGoal || ""}
                onChange={(e) => updateFocusGoal(e.target.value)}
                placeholder="Declare your ultimate objective for this session..."
                className="w-full bg-transparent border-none p-0 text-sm text-slate-100 placeholder:text-slate-600 focus:ring-0 font-bold"
              />
            </div>
          </div>
        </GlowCard>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden min-h-0">
        {/* Left Column: Purpose & Progress */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden min-h-0">
          <GlowCard glowColor="orange" className="flex-shrink-0 bg-gradient-to-br from-orange-900/40 to-slate-900/50 border-orange-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold">Primary Mission</h2>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Complete your {journey.journey_title} by targeting {journey.current_milestone}.
            </p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                  <span className="text-slate-500 uppercase tracking-wider">Overall Progress</span>
                  <span className="text-orange-400">{completionPercentage}%</span>
                </div>
                <ProgressBar progress={completionPercentage} color="bg-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="text-center">
                  <span className="block text-xl font-black text-white">{journey.daily_tasks.length}</span>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Total Tasks</span>
                </div>
                <div className="text-center border-l border-slate-800">
                  <span className="block text-xl font-black text-white">{journey.total_estimated_days}d</span>
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Roadmap Span</span>
                </div>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="yellow" className="flex-1 flex flex-col border-yellow-500/20 overflow-hidden min-h-0">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 flex-shrink-0">
              <Zap className="w-4 h-4 text-yellow-400" />
              Milestone Tracking
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
              {['Calculus Mastery', 'CS Project Delta', 'Biology Finals', 'Organic Chem Lab', 'Physics Simulation'].map((m, i) => (
                <div key={m} className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <span className="text-xs font-medium text-slate-300">{m}</span>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase",
                    i === 0 ? "bg-green-500/10 text-green-400" : "bg-slate-800 text-slate-500"
                  )}>
                    {i === 0 ? 'Active' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>

        {/* Middle Column: Syllabus & Start Button */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden min-h-0">
          <GlowCard glowColor="blue" className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-blue-500/20 bg-blue-500/[0.01] hover:border-blue-500/40 min-h-0">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 mb-6 relative flex-shrink-0">
              <Play className="w-8 h-8 fill-current ml-1" />
              <div className="absolute -inset-3 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
            </div>
            <h2 className="text-2xl font-black mb-3 tracking-tight">Initiate Session</h2>
            <p className="text-slate-400 text-xs mb-6 max-w-xs mx-auto">
              Synchronize your neural pathways. Ready to tackle {journey.daily_tasks.filter(t => !t.completed).length} pending objectives today.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('planner')}
              className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest flex-shrink-0"
            >
              Enter Planner
            </motion.button>
          </GlowCard>

          <GlowCard glowColor="blue" className="flex-shrink-0 border-blue-500/20 h-48 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Syllabus Overview
              </h3>
              <button className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"><Plus className="w-3 h-3" /></button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
               <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
                 <p className="text-[8px] font-black text-slate-500 mb-0.5 uppercase tracking-tighter">CURRENT MODULE</p>
                 <p className="text-xs text-slate-200">Unit 4: Advanced Partial Derivatives & Optimization</p>
               </div>
               <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
                 <p className="text-[8px] font-black text-slate-500 mb-0.5 uppercase tracking-tighter">UPCOMING</p>
                 <p className="text-xs text-slate-400">Unit 5: Multiple Integrals & Applications</p>
               </div>
            </div>
          </GlowCard>
        </div>

        {/* Right Column: Journal */}
        <div className="col-span-12 lg:col-span-4 flex flex-col overflow-hidden min-h-0">
          <GlowCard glowColor="purple" className="flex-1 flex flex-col border-purple-500/20 overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PenTool className="w-4 h-4 text-purple-400" />
                Learning Journal
              </h2>
              <button onClick={downloadJournal} className="text-slate-500 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
              <div className="p-3.5 bg-purple-500/5 border border-purple-500/10 rounded-xl flex-shrink-0">
                <p className="text-[9px] font-black text-purple-400 uppercase mb-1.5 tracking-widest">Today's Prompt</p>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{journey.daily_tasks[0]?.journal_prompt || "How did your understanding evolve today?"}"
                </p>
              </div>
              <textarea 
                placeholder="Synthesize your session results..."
                className="w-full flex-1 bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/50 focus:outline-none resize-none no-scrollbar"
              />
              <button className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/10 flex-shrink-0">
                Sync Entry
              </button>
            </div>
          </GlowCard>
        </div>
      </div>

      {/* Bottom Consistency Panel */}
      <div className="flex-shrink-0">
        <GlowCard glowColor="purple" className="border-slate-800/50 bg-slate-900/20 py-4 px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold leading-tight">Neural Continuity</h2>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Consistency Matrix • Last 28 Days</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Synchronized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-slate-800 border border-slate-700 rounded-sm" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Pending</span>
              </div>
            </div>
          </div>
          <ConsistencyGrid completionPercentage={completionPercentage} />
        </GlowCard>
      </div>
    </div>
  );
};

