import React from 'react';
import { Target, Zap, BookOpen, PenTool, Play, Plus, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { GlowCard, ProgressBar } from './Shared';
import { StudyJourney } from '../types';
import { cn } from '../lib/utils';

interface HomeViewProps {
  journey: StudyJourney;
  completionPercentage: number;
  setView: (view: 'home' | 'planner') => void;
  downloadJournal: () => void;
}

export const HomeView = ({ journey, completionPercentage, setView, downloadJournal }: HomeViewProps) => {
  return (
    <div className="grid grid-cols-12 gap-8 max-w-[1400px] mx-auto px-6 py-8">
      {/* Left Column: Purpose & Goals */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <GlowCard className="bg-gradient-to-br from-indigo-900/40 to-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold">Primary Mission</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Complete your {journey.journey_title} by targeting high-impact subjects and maintaining a consistent daily ritual. Your current focus is {journey.current_milestone}.
          </p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 uppercase tracking-wider">Overall Progress</span>
                <span className="text-indigo-400">{completionPercentage}%</span>
              </div>
              <ProgressBar progress={completionPercentage} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="text-center">
                <span className="block text-2xl font-black text-white">{journey.daily_tasks.length}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Total Tasks</span>
              </div>
              <div className="text-center border-l border-slate-800">
                <span className="block text-2xl font-black text-white">{journey.total_estimated_days}d</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Roadmap Span</span>
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Milestone Tracking
          </h3>
          <div className="space-y-4">
            {['Calculus Mastery', 'CS Project Delta', 'Biology Finals'].map((m, i) => (
              <div key={m} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <span className="text-sm font-medium text-slate-300">{m}</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded uppercase",
                  i === 0 ? "bg-green-500/10 text-green-400" : "bg-slate-800 text-slate-500"
                )}>
                  {i === 0 ? 'Active' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Middle Column: Syllabus & Start Button */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <GlowCard className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-indigo-500/30 bg-indigo-500/[0.02]">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 mb-8 relative">
            <Play className="w-10 h-10 fill-current ml-1" />
            <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Initiate Session</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
            Synchronize your neural pathways. Ready to tackle {journey.daily_tasks.filter(t => !t.completed).length} pending objectives today.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('planner')}
            className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all uppercase tracking-widest"
          >
            Enter Planner
          </motion.button>
        </GlowCard>

        <GlowCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Syllabus Overview
            </h3>
            <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-3">
             <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
               <p className="text-xs font-bold text-slate-500 mb-1">CURRENT MODULE</p>
               <p className="text-sm text-slate-200">Unit 4: Advanced Partial Derivatives & Optimization</p>
             </div>
             <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
               <p className="text-xs font-bold text-slate-500 mb-1">UPCOMING</p>
               <p className="text-sm text-slate-400">Unit 5: Multiple Integrals & Applications</p>
             </div>
          </div>
        </GlowCard>
      </div>

      {/* Right Column: Journal */}
      <div className="col-span-12 lg:col-span-4">
        <GlowCard className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PenTool className="w-5 h-5 text-pink-400" />
              Learning Journal
            </h2>
            <button onClick={downloadJournal} className="text-slate-500 hover:text-white"><Download className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 space-y-6">
            <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl">
              <p className="text-[10px] font-black text-pink-400 uppercase mb-2 tracking-widest">Today's Prompt</p>
              <p className="text-sm text-slate-200 italic leading-relaxed">
                "{journey.daily_tasks[0]?.journal_prompt || "How did your understanding evolve today?"}"
              </p>
            </div>
            <textarea 
              placeholder="Synthesize your session results..."
              className="w-full flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none"
            />
            <button className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-white/5">
              Sync Entry
            </button>
          </div>
        </GlowCard>
      </div>
    </div>
  );
};
