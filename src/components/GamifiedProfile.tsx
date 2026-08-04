import { Trophy, Flame } from 'lucide-react';
import { ProgressBar } from './Shared';
import { UserStats, StudyJourney } from '../types';
import { DashboardPanel } from './DashboardPanel';

interface GamifiedProfileProps {
  stats: UserStats;
  journey: StudyJourney;
  level: number;
  levelProgress: number;
}

export const GamifiedProfile = ({ stats, journey, level, levelProgress }: GamifiedProfileProps) => {
  const getRank = (lvl: number) => {
    if (lvl < 5) return "Academic Novice";
    if (lvl < 10) return "Study Sentinel";
    if (lvl < 20) return "Knowledge Knight";
    return "Academic Paladin";
  };

  return (
    <DashboardPanel 
      title="Level & XP Progress" 
      icon={<Trophy />} 
      accentColor="amber"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight text-white">Level {level}</h2>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{getRank(level)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl">
          <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
          <span className="text-[11px] font-black text-amber-200">{stats.streak}-Day Streak</span>
        </div>
      </div>
      
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
          <span>XP Progress</span>
          <span className="text-amber-400">{Math.round(levelProgress)}%</span>
        </div>
        <ProgressBar progress={levelProgress} color="bg-amber-500" />
        <p className="text-[9px] text-slate-500 text-right font-bold">{stats.totalXP} XP Total</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800/50 text-center">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Tasks Done</p>
          <p className="text-base font-black text-slate-100">{journey.daily_tasks.filter(t => t.completed).length}</p>
        </div>
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800/50 text-center">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Rank Points</p>
          <p className="text-base font-black text-slate-100">{Math.floor(stats.totalXP / 10)}</p>
        </div>
      </div>
    </DashboardPanel>
  );
};
