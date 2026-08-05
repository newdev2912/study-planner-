import React from 'react';
import { Terminal, ShieldAlert, Cpu } from 'lucide-react';

export const RightPanel = () => {
  return (
    <div className="w-full h-full bg-slate-900/20 border border-slate-800/80 rounded-2xl flex flex-col p-5 overflow-hidden backdrop-blur-md relative">
      {/* Decorative scanning line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent animate-pulse" />

      {/* Panel header */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800/80 flex-shrink-0">
        <Terminal className="w-4 h-4 text-cyan-400" />
        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">RESERVED UTILITY DECK</span>
      </div>

      {/* Clean placeholder grid elements */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Top visual placeholder widget */}
        <div className="p-4 rounded-xl border border-dashed border-slate-800/50 bg-slate-950/10 flex flex-col items-center justify-center text-center py-8">
          <Cpu className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">COGNITIVE COMPUTE SYSTEM</span>
          <p className="text-[10px] text-slate-650 mt-1 max-w-[150px]">
            Reserved for real-time focus log analyzers, pomodoro modules, and live telemetry trackers.
          </p>
        </div>

        {/* Bottom micro diagnostics */}
        <div className="space-y-2 border-t border-slate-850 pt-3">
          <div className="flex items-center justify-between text-[8px] font-black text-slate-500 tracking-wider">
            <span>DIAGNOSTICS STAT</span>
            <span className="text-cyan-500">STABLE</span>
          </div>
          
          <div className="flex items-center gap-1.5 p-2 bg-slate-950/40 rounded-lg border border-slate-900">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-650" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">NEURAL CAPACITANCE</span>
              <span className="text-[9px] text-slate-400">Offline mode active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
