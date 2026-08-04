import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const GlowCard = ({ children, className, onClick, glowColor }: { children: React.ReactNode, className?: string, onClick?: () => void, glowColor?: 'orange' | 'yellow' | 'purple' | 'blue' | 'emerald' | 'slate' }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    onClick={onClick}
    className={cn(
      "bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl transition-all relative",
      glowColor && `glow-${glowColor}`,
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
      className={cn("h-full rounded-full transition-all duration-500", color)}
    />
  </div>
);
