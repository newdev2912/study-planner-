import React from 'react';
import { motion } from 'motion/react';
import { FocusModePanel, ColorThemeKey } from './FocusModePanel';

interface FocusViewProps {
  maxTimeMinutes: number;
  timeLeft: number;
  isRunning: boolean;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  activeSessionActive: boolean;
  onUpdateTime: (minutes: number) => void;
  focusThemeKey: ColorThemeKey;
  setFocusThemeKey: (key: ColorThemeKey) => void;
  onClearSession: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  maxTimeMinutes,
  timeLeft,
  isRunning,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  activeSessionActive,
  onUpdateTime,
  focusThemeKey,
  setFocusThemeKey,
  onClearSession
}) => {
  return (
    <motion.div 
      key="focus"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="h-full overflow-hidden"
    >
      <FocusModePanel 
        maxTimeMinutes={maxTimeMinutes}
        timeLeft={timeLeft}
        isRunning={isRunning}
        onStartTimer={onStartTimer}
        onPauseTimer={onPauseTimer}
        onResetTimer={onResetTimer}
        activeSessionActive={activeSessionActive}
        onUpdateTime={onUpdateTime}
        currentThemeKey={focusThemeKey}
        onThemeChange={setFocusThemeKey}
        onClearSession={onClearSession}
      />
    </motion.div>
  );
};
