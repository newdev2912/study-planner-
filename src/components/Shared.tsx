import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const GlowCard = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    onClick={onClick}
    className={cn(
      "bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl glow-hover transition-all",
      className
    )}
  >
    {children}
  </motion.div>
);

export const ProgressBar = ({ progress, className, color = "bg-indigo-600" }: { progress: number, className?: string, color?: string }) => (
  <div className={cn("h-1.5 w-full bg-slate-800 rounded-full overflow-hidden", className)}>
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      className={cn("h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]", color)}
    />
  </div>
);
