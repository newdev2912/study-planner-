import { Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { GlowCard } from './Shared';
import { cn } from '../lib/utils';

interface ConsistencyMatrixProps {
  completionPercentage: number;
}

const ConsistencyGrid = ({ completionPercentage }: { completionPercentage: number }) => {
  const days = Array.from({ length: 28 }, (_, i) => subDays(new Date(), 27 - i));
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day, i) => {
        const isCompleted = i < (completionPercentage / 100) * 28;
        return (
          <div 
            key={day.toISOString()} 
            className={cn(
              "aspect-square rounded-sm border transition-all duration-500",
              isCompleted 
                ? "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                : "bg-slate-800/50 border-slate-700/50"
            )}
            title={format(day, 'MMM d, yyyy')}
          />
        );
      })}
    </div>
  );
};

export const ConsistencyMatrix = ({ completionPercentage }: ConsistencyMatrixProps) => {
  return (
    <GlowCard glowColor="slate" className="h-full border-slate-800/50 bg-slate-900/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold leading-tight">Neural Continuity</h2>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Last 28 Days</p>
          </div>
        </div>
      </div>
      <ConsistencyGrid completionPercentage={completionPercentage} />
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Weekly Consistency</span>
          <span className="text-[10px] text-emerald-400 font-bold">85%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Monthly Goal</span>
          <span className="text-[10px] text-blue-400 font-bold">In Progress</span>
        </div>
      </div>
    </GlowCard>
  );
};
