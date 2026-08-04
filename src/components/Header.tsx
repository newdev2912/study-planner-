import React from 'react';
import { Home, GraduationCap, Flame, RotateCcw, CloudOff, Cloud, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  view: 'home' | 'planner';
  setView: (view: 'home' | 'planner') => void;
  streak: number;
  handleStartFresh: () => void;
  handleDeleteAllData: () => void;
  isLocal?: boolean;
}

export const Header = ({ view, setView, streak, handleStartFresh, handleDeleteAllData, isLocal }: HeaderProps) => {

  return (
    <header className="h-20 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
            SP
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent leading-none mb-1">
              AcademiaQuest
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
          {isLocal ? (
            <button 
              onClick={() => alert("Cloud Sync is currently disabled because 'Anonymous Authentication' is not enabled in the Firebase Console.\n\nTo fix this:\n1. Go to Firebase Console\n2. Authentication -> Sign-in method\n3. Enable 'Anonymous'\n\nYour data is currently being saved to your browser's local storage.")}
              title="Click for sync help"
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
            >
              <CloudOff className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Local Mode</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-lg text-blue-400">
              <Cloud className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Synced</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/50 rounded-xl border border-slate-800">
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
