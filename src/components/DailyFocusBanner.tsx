import { PenTool, Target, Save } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface DailyFocusBannerProps {
  focusGoal: string;
  updateFocusGoal: (goal: string) => void;
}

export const DailyFocusBanner = ({ focusGoal, updateFocusGoal }: DailyFocusBannerProps) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(focusGoal || "");

  return (
    <div className="flex-shrink-0">
      <div className="bg-slate-950/25 backdrop-blur-md border border-slate-800/60 rounded-2xl shadow-xl hover:border-slate-700/50 hover:bg-slate-950/35 py-4 px-6 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Primary Daily Focus</p>
            {isEditingGoal ? (
              <div className="flex gap-2">
                <input 
                  autoFocus
                  type="text"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (updateFocusGoal(tempGoal), setIsEditingGoal(false))}
                  className="flex-1 bg-slate-900/50 border border-cyan-500/30 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
                <button 
                  onClick={() => { updateFocusGoal(tempGoal); setIsEditingGoal(false); }}
                  className="p-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  {focusGoal || "Declare your ultimate objective for this session..."}
                </h3>
                <button 
                  onClick={() => { setTempGoal(focusGoal || ""); setIsEditingGoal(true); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/5 text-slate-400 hover:text-cyan-400 rounded transition-all"
                >
                  <PenTool className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
