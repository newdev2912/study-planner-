import { Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import { DashboardPanel } from './DashboardPanel';

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
                ? "bg-teal-500 border-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.3)]" 
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
    <DashboardPanel 
      title="Neural Continuity" 
      icon={<Activity />} 
      accentColor="teal"
    >
      <div className="mb-4">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Last 28 Days</p>
        <ConsistencyGrid completionPercentage={completionPercentage} />
      </div>
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Weekly Consistency</span>
          <span className="text-[10px] text-teal-400 font-bold">85%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Monthly Goal</span>
          <span className="text-[10px] text-cyan-400 font-bold">In Progress</span>
        </div>
      </div>
    </DashboardPanel>
  );
};
