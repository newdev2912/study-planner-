import { PenTool, Target, Save } from 'lucide-react';
import { useState } from 'react';
import { GlowCard } from './Shared';

interface DailyFocusBannerProps {
  focusGoal: string;
  updateFocusGoal: (goal: string) => void;
}

export const DailyFocusBanner = ({ focusGoal, updateFocusGoal }: DailyFocusBannerProps) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(focusGoal || "");

  return (
    <div className="flex-shrink-0">
      <GlowCard glowColor="blue" className="py-4 px-6 border-blue-500/10 bg-blue-500/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Primary Daily Focus</p>
            {isEditingGoal ? (
              <div className="flex gap-2">
                <input 
                  autoFocus
                  type="text"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (updateFocusGoal(tempGoal), setIsEditingGoal(false))}
                  className="flex-1 bg-slate-900/50 border border-blue-500/30 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none"
                />
                <button onClick={() => { updateFocusGoal(tempGoal); setIsEditingGoal(false); }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded"><Save className="w-4 h-4"/></button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <h3 className="text-sm font-bold text-slate-100">
                  {focusGoal || "Declare your ultimate objective for this session..."}
                </h3>
                <button onClick={() => { setTempGoal(focusGoal || ""); setIsEditingGoal(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-blue-400 transition-all"><PenTool className="w-3 h-3"/></button>
              </div>
            )}
          </div>
        </div>
      </GlowCard>
    </div>
  );
};
