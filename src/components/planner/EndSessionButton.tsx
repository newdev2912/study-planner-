import React from 'react';
import { cn } from '../../lib/utils';

interface EndSessionButtonProps {
  onEndSession: () => void;
}

export const EndSessionButton: React.FC<EndSessionButtonProps> = ({ onEndSession }) => {
  return (
    <button
      onClick={onEndSession}
      className="flex items-center gap-2 ml-2 px-4 py-2.5 bg-slate-900/90 border border-slate-800/80 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 hover:border-red-900/50 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
      title="End Active Session & Record Progress"
    >
      END SESSION
    </button>
  );
};
