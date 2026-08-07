/**
 * Subtopic Selection Logic
 * Logic for toggling, adding, or deleting individual subtopics/subtasks.
 */

export const toggleIndividualSubtask = (
  subtasks: any[],
  subtaskId: string
): any[] => {
  if (!subtasks) return [];
  return subtasks.map(st => {
    if (st.id === subtaskId) {
      return { ...st, selected: !st.selected };
    }
    return st;
  });
};

export const deleteIndividualSubtask = (
  subtasks: any[],
  subtaskId: string
): any[] => {
  if (!subtasks) return [];
  return subtasks.filter(st => st.id !== subtaskId);
};

export const addIndividualSubtask = (
  subtasks: any[],
  title: string
): any[] => {
  const currentSubTasks = subtasks || [];
  return [
    ...currentSubTasks,
    { id: `sub-${Date.now()}`, title, completed: false, selected: true }
  ];
};
