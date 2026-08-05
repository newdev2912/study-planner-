import React from 'react';
import { Task, DailyFocusSession } from '../../types';
import { CompletedPanel } from './CompletedPanel';
import { ConsistencyPanel } from './ConsistencyPanel';

interface RightPanelProps {
  activeSession: DailyFocusSession | null;
  activeSessionTasks: Task[];
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  stats?: any;
}

export const RightPanel = ({
  activeSession,
  activeSessionTasks,
  onToggleSubTask,
  stats = null
}: RightPanelProps) => {
  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      {/* Upper Panel: Completed Objectives */}
      <CompletedPanel 
        activeSession={activeSession}
        activeSessionTasks={activeSessionTasks}
        onToggleSubTask={onToggleSubTask}
      />

      {/* Lower Panel: Consistency Tracker */}
      <ConsistencyPanel stats={stats} />
    </div>
  );
};
