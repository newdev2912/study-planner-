import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Target, Edit2, Check, X, ShieldAlert, Sparkles, Clock, Zap, PawPrint } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FocusModeProps {
  maxTimeMinutes: number;
  timeLeft: number;
  isRunning: boolean;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  activeSessionActive: boolean;
  onUpdateTime: (minutes: number) => void;
  currentThemeKey?: ColorThemeKey;
  onThemeChange?: (key: ColorThemeKey) => void;
}

export type ColorThemeKey = 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose';

export interface ColorTheme {
  name: string;
  textColor: string;
  glowColor: string;
  dropShadow: string;
  shadowGlow: string;
  bgBtn: string;
  borderActive: string;
  headerBadge: string;
  pulseDot: string;
  dotBg: string;
  telemetryColor: string;
  tabBg: string;
  tabShadow: string;
  glowLine: string;
}

export const COLOR_THEMES: Record<ColorThemeKey, ColorTheme> = {
  cyan: {
    name: 'Cyan',
    textColor: 'text-cyan-400',
    glowColor: 'from-cyan-500/10',
    dropShadow: 'drop-shadow-[0_0_35px_rgba(6,182,212,0.45)]',
    shadowGlow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    bgBtn: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
    borderActive: 'border-cyan-500/80 bg-cyan-500/20 text-cyan-300',
    headerBadge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    pulseDot: 'bg-cyan-400',
    dotBg: 'bg-cyan-400',
    telemetryColor: 'text-cyan-500/80',
    tabBg: 'bg-cyan-500',
    tabShadow: 'shadow-cyan-500/20',
    glowLine: 'bg-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
  },
  emerald: {
    name: 'Emerald',
    textColor: 'text-emerald-400',
    glowColor: 'from-emerald-500/10',
    dropShadow: 'drop-shadow-[0_0_35px_rgba(16,185,129,0.45)]',
    shadowGlow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    bgBtn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    borderActive: 'border-emerald-500/80 bg-emerald-500/20 text-emerald-300',
    headerBadge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    pulseDot: 'bg-emerald-400',
    dotBg: 'bg-emerald-400',
    telemetryColor: 'text-emerald-500/80',
    tabBg: 'bg-emerald-500',
    tabShadow: 'shadow-emerald-500/20',
    glowLine: 'bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
  },
  violet: {
    name: 'Violet',
    textColor: 'text-purple-400',
    glowColor: 'from-purple-500/10',
    dropShadow: 'drop-shadow-[0_0_35px_rgba(168,85,247,0.45)]',
    shadowGlow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    bgBtn: 'bg-purple-500 hover:bg-purple-400 text-slate-950',
    borderActive: 'border-purple-500/80 bg-purple-500/20 text-purple-300',
    headerBadge: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    pulseDot: 'bg-purple-400',
    dotBg: 'bg-purple-400',
    telemetryColor: 'text-purple-500/80',
    tabBg: 'bg-purple-500',
    tabShadow: 'shadow-purple-500/20',
    glowLine: 'bg-purple-500/80 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
  },
  amber: {
    name: 'Amber',
    textColor: 'text-amber-400',
    glowColor: 'from-amber-500/10',
    dropShadow: 'drop-shadow-[0_0_35px_rgba(245,158,11,0.45)]',
    shadowGlow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    bgBtn: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    borderActive: 'border-amber-500/80 bg-amber-500/20 text-amber-300',
    headerBadge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    pulseDot: 'bg-amber-400',
    dotBg: 'bg-amber-400',
    telemetryColor: 'text-amber-500/80',
    tabBg: 'bg-amber-500',
    tabShadow: 'shadow-amber-500/20',
    glowLine: 'bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  },
  rose: {
    name: 'Rose',
    textColor: 'text-rose-400',
    glowColor: 'from-rose-500/10',
    dropShadow: 'drop-shadow-[0_0_35px_rgba(244,63,94,0.45)]',
    shadowGlow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]',
    bgBtn: 'bg-rose-500 hover:bg-rose-400 text-slate-950',
    borderActive: 'border-rose-500/80 bg-rose-500/20 text-rose-300',
    headerBadge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    pulseDot: 'bg-rose-400',
    dotBg: 'bg-rose-400',
    telemetryColor: 'text-rose-500/80',
    tabBg: 'bg-rose-500',
    tabShadow: 'shadow-rose-500/20',
    glowLine: 'bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
  },
};

export const FocusModePanel: React.FC<FocusModeProps> = ({
  maxTimeMinutes,
  timeLeft,
  isRunning,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  activeSessionActive = false,
  onUpdateTime,
  currentThemeKey = 'cyan',
  onThemeChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState(maxTimeMinutes);
  const [estFinishTime, setEstFinishTime] = useState('');
  const [themeKey, setThemeKey] = useState<ColorThemeKey>(currentThemeKey);
  const [showColorMenu, setShowColorMenu] = useState(false);

  useEffect(() => {
    setThemeKey(currentThemeKey);
  }, [currentThemeKey]);

  const handleSelectTheme = (key: ColorThemeKey) => {
    setThemeKey(key);
    onThemeChange?.(key);
    setShowColorMenu(false);
  };

  const theme = COLOR_THEMES[themeKey];

  // Keep local input in sync with external configuration when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setEditMinutes(maxTimeMinutes);
    }
  }, [maxTimeMinutes, isEditing]);

  // Calculate estimated finish time dynamically
  useEffect(() => {
    const updateFinishTime = () => {
      const now = new Date();
      now.setSeconds(now.getSeconds() + timeLeft);
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setEstFinishTime(`${hours}:${mins}`);
    };

    updateFinishTime();
    const interval = setInterval(updateFinishTime, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    const mins = Math.max(1, Math.min(180, editMinutes));
    onUpdateTime(mins);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full justify-center items-center py-6 px-4 overflow-hidden select-none">
      
      {/* Background Radial Glow behind the clock */}
      <div className={cn("absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] via-slate-950/40 to-transparent pointer-events-none transition-colors duration-500", theme.glowColor)} />

      {/* HERO DIGITAL CLOCK DISPLAY */}
      <div className="z-10 flex flex-col items-center justify-center my-auto w-full max-w-lg">
        {isEditing ? (
          /* Editable Input Form */
          <div className="flex flex-col items-center justify-center animate-fadeIn w-full">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] mb-4">
              [ SET CUSTOM DURATION ]
            </span>
            
            <div className="flex items-center justify-center gap-4 my-2">
              <input
                type="number"
                value={editMinutes === 0 ? '' : editMinutes}
                onChange={(e) => setEditMinutes(Number(e.target.value))}
                onKeyDown={handleKeyDown}
                min={1}
                max={180}
                autoFocus
                className={cn(
                  "text-center font-mono font-black text-6xl sm:text-7xl bg-slate-900/90 border-2 rounded-2xl px-4 py-3 w-40 focus:outline-none focus:ring-4 transition-all",
                  theme.textColor,
                  theme.borderActive
                )}
              />
              <span className="text-sm font-black text-slate-400 tracking-wider uppercase">
                MIN
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-4 mb-6">
              {[15, 25, 45, 60].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setEditMinutes(preset)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                    editMinutes === preset
                      ? theme.borderActive
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className={cn("flex items-center gap-1.5 px-5 py-2 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg", theme.bgBtn)}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Apply Time
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 hover:text-white transition-all active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* High-contrast Digital Readout */
          <div className="flex flex-col items-center justify-center w-full">
            
            {/* Massive countdown digits */}
            <div 
              onClick={() => activeSessionActive && setIsEditing(true)}
              className={cn(
                "group relative font-mono text-[100px] sm:text-[120px] xl:text-[140px] font-black tracking-tighter leading-none my-2 transition-all duration-300 select-none",
                theme.textColor,
                theme.dropShadow,
                activeSessionActive ? 'cursor-pointer' : ''
              )}
              title={activeSessionActive ? "Click to set custom time" : undefined}
            >
              {formatTime(timeLeft)}
              
              {activeSessionActive && (
                <div className={cn("absolute -top-3 -right-6 bg-slate-900/90 border border-slate-800/80 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 shadow-xl", theme.textColor)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Interactive Duration Quick Bar */}
            {activeSessionActive && (
              <div className="flex items-center gap-2 mt-4 mb-6 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/60">
                {[15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    disabled={isRunning}
                    onClick={() => onUpdateTime(mins)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border disabled:opacity-40",
                      maxTimeMinutes === mins
                        ? theme.borderActive
                        : "bg-slate-950/80 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    )}
                  >
                    {mins}M
                  </button>
                ))}
                <button
                  disabled={isRunning}
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-950/80 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40"
                >
                  CUSTOM
                </button>
              </div>
            )}

            {/* Timer Controls & Paw Color Palette Selector */}
            <div className="flex items-center gap-2.5">
              
              {/* Paw Menu Selector Block (To the left of Start Button) */}
              <div className="relative flex items-center">
                {/* Horizontal Color Circles Menu (Positioned absolutely to the left without shifting buttons) */}
                {showColorMenu && (
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-900/95 border border-slate-800/80 px-2.5 py-1.5 rounded-xl transition-all duration-200 animate-fadeIn shadow-2xl backdrop-blur-md z-30 whitespace-nowrap">
                    {(Object.keys(COLOR_THEMES) as ColorThemeKey[]).map((key) => {
                      const t = COLOR_THEMES[key];
                      const isSelected = themeKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleSelectTheme(key)}
                          className={cn(
                            "w-4 h-4 rounded-full transition-all transform hover:scale-125 focus:outline-none",
                            t.dotBg,
                            isSelected
                              ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110"
                              : "opacity-75 hover:opacity-100"
                          )}
                          title={t.name}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Paw Print Toggle Button */}
                <button
                  onClick={() => setShowColorMenu(!showColorMenu)}
                  className={cn(
                    "p-2.5 bg-slate-900/90 border border-slate-800/80 rounded-xl transition-all duration-200 active:scale-95 group relative",
                    showColorMenu ? "border-slate-700 bg-slate-800" : "hover:bg-slate-850 hover:border-slate-700"
                  )}
                  title="Customize Theme Color"
                >
                  <PawPrint className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-110", theme.textColor)} />
                </button>
              </div>

              {/* Start/Pause Button */}
              <button
                onClick={isRunning ? onPauseTimer : onStartTimer}
                disabled={!activeSessionActive}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
                  theme.bgBtn,
                  theme.shadowGlow
                )}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5 fill-current"/> : <Play className="w-3.5 h-3.5 fill-current"/>}
                {isRunning ? 'Pause Clock' : 'Start Clock'}
              </button>

              {/* Reset Clock Button */}
              <button
                onClick={onResetTimer}
                className="p-2.5 bg-slate-900/90 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Warning overlay if no session active */}
      {!activeSessionActive && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20 rounded-2xl">
          <Target className="w-12 h-12 text-amber-500 animate-bounce mb-3" />
          <span className="text-xs font-black text-slate-200 tracking-[0.2em] uppercase block mb-2">SESSION NOT POPULATED</span>
          <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">
            Mark study tasks in your archive and click <strong className="text-purple-400">POPULATE & START SESSION</strong> on the left panel to unlock the interactive countdown system.
          </p>
        </div>
      )}
    </div>
  );
};

