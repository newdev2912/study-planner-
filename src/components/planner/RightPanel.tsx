import React from 'react';
import { Task, DailyFocusSession, SubjectData } from '../../types';
import { CompletedPanel } from './CompletedPanel';
import { ConsistencyPanel } from './ConsistencyPanel';

interface RightPanelProps {
  activeSession: DailyFocusSession | null;
  activeSessionTasks: Task[];
  onToggleSubTask: (taskId: string, subTaskId: string, forceState?: boolean) => void;
  stats?: any;
  subjectMastery?: SubjectData[];
}

export const RightPanel = ({
  activeSession,
  activeSessionTasks,
  onToggleSubTask,
  stats = null,
  subjectMastery = []
}: RightPanelProps) => {
  return (
    <div className="w-full h-full flex flex-col gap-4 min-h-0">
      {/* Upper Panel: Completed Objectives */}
      <CompletedPanel 
        activeSession={activeSession}
        activeSessionTasks={activeSessionTasks}
        onToggleSubTask={onToggleSubTask}
        subjectMastery={subjectMastery}
      />

      {/* Lower Panel: Consistency Tracker */}
      <ConsistencyPanel stats={stats} />
    </div>
  );
};
