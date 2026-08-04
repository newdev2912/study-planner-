import { Trophy, Flame } from 'lucide-react';
import { GlowCard, ProgressBar } from './Shared';
import { UserStats, StudyJourney } from '../types';

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
    <GlowCard glowColor="orange" className="h-full bg-gradient-to-br from-orange-900/20 to-slate-900/50 border-orange-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">Level {level}</h2>
            <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">{getRank(level)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          <span className="text-sm font-black text-orange-200">{stats.streak}-Day Streak</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span>XP Progress</span>
          <span className="text-orange-400">{Math.round(levelProgress)}%</span>
        </div>
        <ProgressBar progress={levelProgress} color="bg-orange-500" />
        <p className="text-[10px] text-slate-500 text-right font-bold">{stats.totalXP} XP Total</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">Tasks Done</p>
          <p className="text-lg font-black">{journey.daily_tasks.filter(t => t.completed).length}</p>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">Rank Points</p>
          <p className="text-lg font-black">{Math.floor(stats.totalXP / 10)}</p>
        </div>
      </div>
    </GlowCard>
  );
};
