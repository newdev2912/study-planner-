import React from 'react';
import { ClipboardCheck } from 'lucide-react';

interface CompletedEmptyStateProps {
  tab: 'study' | 'daily';
}

export const CompletedEmptyState = ({ tab }: CompletedEmptyStateProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <div className="p-3 bg-slate-950/40 rounded-full border border-slate-900 border-dashed mb-2 text-slate-700">
        <ClipboardCheck className="w-5 h-5 mx-auto opacity-40" />
      </div>
      <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase block">
        {tab === 'study' ? "NO COMPLETED ACADEMICS" : "NO COMPLETED DAILIES"}
      </span>
      <p className="text-[9px] text-slate-600 mt-0.5 max-w-[170px] leading-relaxed">
        {tab === 'study' 
          ? "Completed Study Modules will automatically migrate here from active workspaces." 
          : "Complete all of today's staged daily task checkpoints to register entries."}
      </p>
    </div>
  );
};
