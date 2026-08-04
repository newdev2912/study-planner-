import React from 'react';
import { cn } from '../lib/utils';

interface DashboardPanelProps {
  title: string;
  icon?: React.ReactNode;
  accentColor: 'emerald' | 'amber' | 'cyan' | 'purple' | 'fuchsia' | 'teal' | 'indigo';
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

  return (
    <div className={cn(
      "bg-slate-950/80 backdrop-blur-md border rounded-2xl shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden",
      styles.border,
      styles.glow,
      className
    )}>
      <div className="p-5 border-b border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className={cn("w-5 h-5", styles.icon)}>{icon}</div>}
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-100">
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
