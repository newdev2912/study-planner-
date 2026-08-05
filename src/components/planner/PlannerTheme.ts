import { PriorityLevel } from '../../types';

export interface PriorityThemeConfig {
  label: string;
  badge: string;
  cardGlow: string;
  progressClass: string;
  textClass: string;
  accentColor: string;
  glowColor: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'cyan';
}

export const priorityTheme: Record<PriorityLevel, PriorityThemeConfig> = {
  'high': { 
    label: 'High', 
    badge: 'bg-red-500/10 text-red-400 border border-red-500/30',
    cardGlow: 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
    progressClass: 'bg-red-500',
    textClass: 'text-red-400',
    accentColor: '#ef4444',
    glowColor: 'red'
  },
  'medium': { 
    label: 'Medium', 
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    cardGlow: 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]',
    progressClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    accentColor: '#f59e0b',
    glowColor: 'yellow'
  },
  'low': { 
    label: 'Low', 
    badge: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
    cardGlow: 'bg-slate-900/40 border-slate-800/50',
    progressClass: 'bg-slate-500',
    textClass: 'text-slate-400',
    accentColor: '#64748b',
    glowColor: 'blue'
  },
  'on-going': { 
    label: 'On-Going', 
    badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse',
    cardGlow: 'bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]',
    progressClass: 'bg-cyan-500',
    textClass: 'text-cyan-400',
    accentColor: '#06b6d4',
    glowColor: 'cyan'
  }
};
