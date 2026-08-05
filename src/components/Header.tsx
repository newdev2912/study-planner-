import React from 'react';
import { Home, GraduationCap, Flame, RotateCcw, Cloud, Trash2, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  view: 'home' | 'planner';
  setView: (view: 'home' | 'planner') => void;
  streak: number;
  handleStartFresh: () => void;
  handleDeleteAllData: () => void;
}

export const Header = ({ view, setView, streak, handleStartFresh, handleDeleteAllData }: HeaderProps) => {

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="h-20 border-b border-slate-800/60 bg-slate-950/25 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25 border border-orange-400/40 group-hover:scale-105 transition-all duration-300">
            <Flame className="w-6 h-6 text-amber-100 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent leading-none mb-1 font-jakarta">
              Study Planner
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider leading-none">
              Improve productivity and focus
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-slate-800/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
          <button 
            onClick={() => setView('home')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all duration-300",
              view === 'home' 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40" 
                : "text-slate-500 hover:text-slate-300 font-bold"
            )}
          >
            <Home className="w-4 h-4" />
            Base
          </button>
          <button 
            onClick={() => setView('planner')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all duration-300",
              view === 'planner' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 border border-orange-400/40" 
                : "text-slate-500 hover:text-slate-300 font-bold"
            )}
          >
            <GraduationCap className="w-4 h-4" />
            Planner
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-lg text-blue-400">
            <Cloud className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Neural Link Active</span>
          </div>
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <button 
              onClick={handleStartFresh}
              title="Start Fresh (Reset task completions)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleDeleteAllData}
              title="Delete All Data (Cloud & Local)"
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-orange-500/5 border border-orange-500/10 rounded-xl">
             <Flame className="w-4 h-4 text-orange-500" />
             <span className="text-xs font-bold text-orange-500">{streak}d Streak</span>
          </div>
        </div>
      </div>
    </header>
  );
};
