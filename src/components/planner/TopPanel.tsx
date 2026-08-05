import React from 'react';
import { Task } from '../../types';
import { OperationalHeader, SubjectItem } from './OperationalDeck';

interface TopPanelProps {
  journeyTitle: string;
  activeSessionTasks: Task[];
  completionPercentage: number;
  setView: (view: 'home' | 'planner') => void;
  activeSession?: any | null;
  onTitleChange?: (newTitle: string) => void;
}

export const TopPanel = ({
  journeyTitle,
  activeSessionTasks,
  completionPercentage,
  setView,
  activeSession = null,
  onTitleChange
}: TopPanelProps) => {
  // Convert live session data or tasks into SubjectItem format for OperationalHeader
  const getSubjectItems = (): SubjectItem[] => {
    if (activeSession && activeSession.items && activeSession.items.length > 0) {
      const items = activeSession.items.filter((i: any) => i.isStaged);
      const subjectMap: { [key: string]: { id: string; name: string; completed: number; total: number } } = {};
      
      items.forEach((item: any) => {
        const sId = item.subjectId || item.subjectName || 'general';
        if (!subjectMap[sId]) {
          subjectMap[sId] = {
            id: sId,
            name: item.subjectName || sId,
            completed: 0,
            total: 0
          };
        }
        subjectMap[sId].total++;
        if (item.isCompleted) {
          subjectMap[sId].completed++;
        }
      });
      
      return Object.values(subjectMap).map(sub => {
        let status: 'completed' | 'active' | 'pending' = 'pending';
        if (sub.total > 0 && sub.completed === sub.total) {
          status = 'completed';
        } else if (sub.completed > 0) {
          status = 'active';
        }
        return {
          id: sub.id,
          name: sub.name,
          completed: sub.completed,
          total: sub.total,
          status
        };
      });
    }

    if (activeSessionTasks && activeSessionTasks.length > 0) {
      const subjectMap: { [key: string]: { id: string; name: string; completed: number; total: number } } = {};
      activeSessionTasks.forEach(task => {
        const sName = task.subject || 'general';
        if (!subjectMap[sName]) {
          subjectMap[sName] = { id: sName, name: sName, completed: 0, total: 0 };
        }
        const selectedSub = task.subTasks?.filter(st => st.selected) || [];
        if (selectedSub.length > 0) {
          subjectMap[sName].total += selectedSub.length;
          subjectMap[sName].completed += selectedSub.filter(st => st.completed).length;
        } else {
          subjectMap[sName].total += 1;
          if (task.completed) subjectMap[sName].completed += 1;
        }
      });

      return Object.values(subjectMap).map(sub => {
        let status: 'completed' | 'active' | 'pending' = 'pending';
        if (sub.total > 0 && sub.completed === sub.total) {
          status = 'completed';
        } else if (sub.completed > 0) {
          status = 'active';
        }
        return {
          id: sub.id,
          name: sub.name,
          completed: sub.completed,
          total: sub.total,
          status
        };
      });
    }

    // Default fallback subject items matching demo specification
    return [
      { id: '1', name: 'evs', completed: 9, total: 12, status: 'active' },
      { id: '2', name: 'dsa', completed: 1, total: 6, status: 'pending' },
      { id: '3', name: 'civics', completed: 1, total: 2, status: 'pending' },
      { id: '4', name: 'geography', completed: 3, total: 3, status: 'completed' },
    ];
  };

  const subjectItems = getSubjectItems();

  return (
    <OperationalHeader
      initialTitle={journeyTitle || "Engineering & CS • Fall Semester"}
      subjects={subjectItems}
      overallProgress={completionPercentage}
      onNavigateBase={() => setView('home')}
      onTitleChange={onTitleChange}
    />
  );
};

