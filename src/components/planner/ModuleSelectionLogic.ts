/**
 * Module Selection Logic
 * Selecting all topics in a module.
 * Deselecting the module checklist will deselect all the unfinished/uncompleted topics that were selected in that module.
 * Completed topics remain unchanged and unaffected.
 */

export const isModuleFullySelected = (module: any, subjectId: string, activeSessionItems: any[] = []): boolean => {
  if (!module || !module.topics) return false;
  const topics = module.topics || [];
  const nonCompletedTopics = topics.filter((t: any) => !t.completed);
  if (nonCompletedTopics.length === 0) return topics.length > 0;
  
  return nonCompletedTopics.every((t: any) => {
    return t.selected || 
      activeSessionItems.some((item: any) => 
        item.subjectId === subjectId && 
        item.moduleId === module.id && 
        item.topicId === t.id && 
        item.isStaged
      );
  });
};

export const isModulePartiallySelected = (module: any, subjectId: string, activeSessionItems: any[] = []): boolean => {
  if (!module || !module.topics) return false;
  const topics = module.topics || [];
  const nonCompletedTopics = topics.filter((t: any) => !t.completed);
  if (nonCompletedTopics.length === 0) return false;
  
  return nonCompletedTopics.some((t: any) => {
    return t.selected || 
      activeSessionItems.some((item: any) => 
        item.subjectId === subjectId && 
        item.moduleId === module.id && 
        item.topicId === t.id && 
        item.isStaged
      );
  });
};

/**
 * Returns updated modules array after performing stage-all or unstage-all inside a module.
 * When deselecting the module, it deselects all unfinished/uncompleted topics that were selected.
 */
export const toggleModuleSelection = (
  modules: any[],
  moduleId: string,
  shouldSelectAll: boolean
): any[] => {
  return modules.map(m => {
    if (m.id === moduleId) {
      return {
        ...m,
        topics: (m.topics || []).map((t: any) => {
          // Completed topics remain unaffected
          if (t.completed) {
            return t;
          }
          return { ...t, selected: shouldSelectAll };
        })
      };
    }
    return m;
  });
};
