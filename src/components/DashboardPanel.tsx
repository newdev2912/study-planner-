import React from 'react';
import { cn } from '../lib/utils';

interface DashboardPanelProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  accentColor: 'emerald' | 'amber' | 'cyan' | 'purple' | 'fuchsia' | 'teal' | 'indigo' | 'red';
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

const accentStyles = {
  emerald: {
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/5',
    text: 'text-emerald-400',
    icon: 'text-emerald-400'
  },
  amber: {
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/5',
    text: 'text-amber-400',
    icon: 'text-amber-400'
  },
  cyan: {
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/5',
    text: 'text-cyan-400',
    icon: 'text-cyan-400'
  },
  purple: {
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/5',
    text: 'text-purple-400',
    icon: 'text-purple-400'
  },
  fuchsia: {
    border: 'border-fuchsia-500/30',
    glow: 'shadow-fuchsia-500/5',
    text: 'text-fuchsia-400',
    icon: 'text-fuchsia-400'
  },
  teal: {
    border: 'border-teal-500/30',
    glow: 'shadow-teal-500/5',
    text: 'text-teal-400',
    icon: 'text-teal-400'
  },
  indigo: {
    border: 'border-indigo-500/30',
    glow: 'shadow-indigo-500/5',
    text: 'text-indigo-400',
    icon: 'text-indigo-400'
  },
  red: {
    border: 'border-red-500/30',
    glow: 'shadow-red-500/5',
    text: 'text-red-400',
    icon: 'text-red-400'
  }
};

export const DashboardPanel = ({ 
  title, 
  icon, 
  accentColor, 
  children, 
  className,
  headerAction 
}: DashboardPanelProps) => {
  const styles = accentStyles[accentColor];

  const hoverGlows = {
    emerald: 'hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    amber: 'hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    cyan: 'hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
    purple: 'hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    fuchsia: 'hover:border-fuchsia-500/40 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)]',
    teal: 'hover:border-teal-500/40 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]',
    indigo: 'hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    red: 'hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]',
  };

  return (
    <div className={cn(
      "bg-slate-950/20 backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-500 h-full flex flex-col overflow-hidden",
      "hover:bg-slate-950/30",
      styles.border,
      hoverGlows[accentColor],
      className
    )}>
      <div className="p-5 border-b border-slate-800/40 flex items-center justify-between bg-slate-950/20">
        <div className="flex items-center gap-3">
          {icon && <div className={cn("w-5 h-5", styles.icon)}>{icon}</div>}
          <h2 className={cn(
            "text-slate-100",
            typeof title === 'string' ? "text-sm font-black uppercase tracking-widest" : ""
          )}>
            {title}
          </h2>
        </div>
        {headerAction && (
          <div className="flex items-center gap-2">
            {headerAction}
          </div>
        )}
      </div>
      <div className="flex-1 p-5 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  );
};
