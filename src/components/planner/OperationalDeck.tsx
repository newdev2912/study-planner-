import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SubjectItem {
  id: string;
  name: string;
  completed: number;
  total: number;
  status: 'completed' | 'active' | 'pending';
}

interface OperationalHeaderProps {
  initialTitle?: string;
  subjects?: SubjectItem[];
  overallProgress?: number;
  onNavigateBase?: () => void;
  onTitleChange?: (newTitle: string) => void;
}

const DEFAULT_SUBJECTS: SubjectItem[] = [];

export const OperationalHeader: React.FC<OperationalHeaderProps> = ({
  initialTitle = "My Academic Journey",
  subjects = DEFAULT_SUBJECTS,
  overallProgress = 0,
  onNavigateBase,
  onTitleChange
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(initialTitle);

  // Sync internal title state if external initialTitle prop changes
  React.useEffect(() => {
    setTitle(initialTitle);
    setTempTitle(initialTitle);
  }, [initialTitle]);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      setTitle(tempTitle.trim());
      if (onTitleChange) onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
    setIsEditing(false);
  };

  return (
    <div className="relative w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 min-h-[82px] flex flex-col justify-between backdrop-blur-xl overflow-hidden shadow-2xl shrink-0">
      
      {/* TOP CONTENT LAYER */}
      <div className="flex items-center justify-between gap-4 sm:gap-6">
        
        {/* 1. LEFT TITLE BLOCK */}
        <div className="flex items-center gap-2 shrink-0 max-w-[260px] sm:max-w-[300px]">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase leading-none mb-1">
              CURRENT PLAN
            </span>

            {isEditing ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                className="bg-slate-900 border border-cyan-500/60 rounded px-2 py-0.5 text-xs sm:text-sm font-bold text-white focus:outline-none w-full font-sans"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer group"
                title="Click to edit plan title"
              >
                <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight truncate group-hover:text-cyan-300 transition-colors">
                  {title}
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* 2. CENTERED SUBJECT PILLS TRACK */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          {subjects.map((sub) => {
            const isDone = sub.status === 'completed' || (sub.total > 0 && sub.completed === sub.total);
            const isActive = sub.status === 'active';

            return (
              <div
                key={sub.id}
                className={cn(
                  "flex items-center justify-between gap-2.5 px-3 py-1 rounded-xl border text-[11px] font-mono font-bold transition-all duration-200 shrink-0 cursor-pointer hover:scale-[1.04]",
                  isDone && "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/20",
                  isActive && "bg-cyan-950/20 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/10 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-500/20",
                  !isDone && !isActive && "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-purple-500/50 hover:text-slate-200 hover:shadow-md hover:shadow-purple-500/10"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {isDone && <Check className="w-3 h-3 text-emerald-400 stroke-[3]"/>}
                  <span className="uppercase font-bold tracking-wide font-sans text-slate-200">
                    {sub.name}
                  </span>
                </div>

                <span className={cn(
                  "text-[10px] font-mono",
                  isDone ? "text-emerald-400/80" : isActive ? "text-cyan-400/80" : "text-slate-500"
                )}>
                  {sub.completed}/{sub.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3. RIGHT PERCENTAGE LABEL */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse"/>
          <span className="font-mono text-xs font-black text-cyan-300 tracking-wider">
            {Math.round(overallProgress)}% Complete
          </span>
        </div>

      </div>

      {/* 3. BOTTOM SOLID RED PROGRESS BAR */}
      <div className="w-full mt-2 group cursor-pointer">
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 p-[0.5px]">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] group-hover:brightness-125 group-hover:shadow-[0_0_18px_rgba(244,63,94,0.95)]"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
      </div>

    </div>
  );
};

