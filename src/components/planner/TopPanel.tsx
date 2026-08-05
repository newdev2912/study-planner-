import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Home, CheckCircle2, Circle } from 'lucide-react';
import { Task } from '../../types';
import { cn } from '../../lib/utils';

interface TopPanelProps {
  journeyTitle: string;
  activeSessionTasks: Task[];
  completionPercentage: number;
  setView: (view: 'home' | 'planner') => void;
}

export const TopPanel = ({
  journeyTitle,
  activeSessionTasks,
  completionPercentage,
  setView
}: TopPanelProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col p-4 flex-shrink-0">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Brand & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => setView('home')}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-black"
            title="Return to Base"
          >
            <Home className="w-4 h-4 text-purple-400" />
            <span>BASE</span>
          </button>
          
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-purple-400 tracking-[0.25em] uppercase">SYSTEM OPERATIONAL DECK</span>
            <h1 className="text-sm font-black text-slate-100 tracking-tight truncate max-w-[280px] sm:max-w-xs md:max-w-sm">
              {journeyTitle}
            </h1>
          </div>
        </div>

        {/* Middle Section: Dynamic Task Selection Strip */}
        <div className="flex items-center gap-1.5 flex-1 w-full max-w-2xl">
          <button 
            onClick={() => scroll('left')} 
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 px-1 py-1"
          >
            {activeSessionTasks.length === 0 ? (
              <div className="text-[10px] font-bold text-slate-500 italic tracking-wider py-1 select-none w-full text-center">
                [ Deploy a Focus Session to activate monitoring strip ]
              </div>
            ) : (
              activeSessionTasks.map((task) => {
                const isTaskCompleted = task.completed;
                const typeColors = {
                  'CODE': 'border-blue-500/30 text-blue-400 bg-blue-950/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]',
                  'DAILY': 'border-amber-500/30 text-amber-400 bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]',
                  'STUDY': 'border-purple-500/30 text-purple-400 bg-purple-950/20 shadow-[0_0_10px_rgba(168,85,247,0.05)]'
                };
                const themeClass = typeColors[task.taskType as 'CODE' | 'DAILY' | 'STUDY'] || typeColors['STUDY'];

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap transition-all border shrink-0 flex items-center gap-2",
                      isTaskCompleted
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : themeClass
                    )}
                  >
                    {isTaskCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 text-slate-500 shrink-0" />
                    )}
                    <span>
                      [{task.subject}] {task.task_title}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <button 
            onClick={() => scroll('right')} 
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Neon Percentage Indicator (Replacing buttons) */}
        <div className="shrink-0 flex items-center gap-2 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800/80">
          <span className="text-[9px] font-black text-slate-500 tracking-wider uppercase">SESSION COMPLETED</span>
          <span className="text-xs font-black text-cyan-400 font-mono tracking-widest">{Math.round(completionPercentage)}%</span>
        </div>
      </div>

      {/* Full width progress bar along bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-950/80">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
        />
      </div>
    </div>
  );
};
