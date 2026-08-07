import { Task } from '../../types';

/**
 * Subject Selection Logic
 * Manages the "Select All" and "Deselect All" logic for a Subject Card.
 * Selecting all stages all uncompleted topics in the subject.
 * Deselecting all unstages all topics in the subject.
 */

export const isSubjectFullySelected = (subject: any, activeSessionItems: any[] = []): boolean => {
  if (!subject || !subject.modules || subject.modules.length === 0) return false;
  
  const nonCompletedTopics = subject.modules.flatMap((m: any) => m.topics || []).filter((t: any) => !t.completed);
  if (nonCompletedTopics.length === 0) return true; // Treat as already handled if all are completed
  
  return nonCompletedTopics.every((t: any) => {
    return t.selected || 
      activeSessionItems.some((item: any) => 
        item.subjectId === subject.id && 
        item.topicId === t.id && 
        item.isStaged
      );
  });
};

export const isSubjectPartiallySelected = (subject: any, activeSessionItems: any[] = []): boolean => {
  if (!subject || !subject.modules || subject.modules.length === 0) return false;
  
  const nonCompletedTopics = subject.modules.flatMap((m: any) => m.topics || []).filter((t: any) => !t.completed);
  if (nonCompletedTopics.length === 0) return false;
  
  return nonCompletedTopics.some((t: any) => {
    return t.selected || 
      activeSessionItems.some((item: any) => 
        item.subjectId === subject.id && 
        item.topicId === t.id && 
        item.isStaged
      );
  });
};

export const getStagedTopicsCountForSubject = (subject: any, activeSessionItems: any[] = []): { staged: number; total: number } => {
  if (!subject || !subject.modules) return { staged: 0, total: 0 };
  const topics = subject.modules.flatMap((m: any) => m.topics || []);
  const staged = topics.filter((t: any) => {
    return t.selected || 
      activeSessionItems.some((item: any) => 
        item.subjectId === subject.id && 
        item.topicId === t.id && 
        item.isStaged
      );
  }).length;
  return { staged, total: topics.length };
};
