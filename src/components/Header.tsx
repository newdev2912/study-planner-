import React from 'react';
import { Home, GraduationCap, Flame, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  view: 'home' | 'planner';
  setView: (view: 'home' | 'planner') => void;
  streak: number;
  handleStartFresh: () => void;
}

export const Header = ({ view, setView, streak, handleStartFresh }: HeaderProps) => {

  return (
    <header className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
            SP
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent leading-none mb-1">
              Study Planner
            </h1>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Neural Learning Manager</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setView('home')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              view === 'home' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Home className="w-4 h-4" />
            Base
          </button>
          <button 
            onClick={() => setView('planner')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              view === 'planner' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <GraduationCap className="w-4 h-4" />
            Planner
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleStartFresh}
            title="Start Fresh (Reset task completions)"
            className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Start Fresh</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-orange-500/5 border border-orange-500/10 rounded-xl">
             <Flame className="w-4 h-4 text-orange-500" />
             <span className="text-xs font-bold text-orange-500">{streak}d Streak</span>
          </div>
        </div>
      </div>
    </header>
  );
};
