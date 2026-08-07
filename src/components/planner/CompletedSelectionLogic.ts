/**
 * Completed Selection Logic
 * Ensures that previously completed sub-topics/topics/subtasks remain completely unaffected.
 * Completed topics do not participate in staging/selection and are filtered or kept in their completed status.
 */

export const filterCompletedTopicsForStaging = (topics: any[]): any[] => {
  if (!topics) return [];
  // Returns only the topics that are eligible for selection (i.e. not completed)
  return topics.filter(t => !t.completed);
};

export const isTopicCompletedAndUnaffected = (topic: any): boolean => {
  return !!(topic && topic.completed);
};

/**
 * Safe update rule: ensures that when we change task status or selections,
 * completed tasks are preserved and cannot be mistakenly uncompleted or restaged
 */
export const preserveCompletedStatus = <T extends { completed?: boolean; selected?: boolean }>(
  item: T,
  updates: Partial<T>
): T => {
  if (item.completed) {
    return {
      ...item,
      selected: false, // Completed tasks shouldn't be staged
      completed: true
    } as T;
  }
  return {
    ...item,
    ...updates
  };
};
