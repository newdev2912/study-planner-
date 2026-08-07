import { Task } from '../../types';

/**
 * Daily Task Selection Logic
 * Manages staging and selection for simple daily/roadmap tasks that are NOT subject cards.
 * These tasks do not have individual complex modules and subtopic taxonomies.
 */

export const isDailyTaskFullySelected = (task: Task, selectedTaskIds: string[]): boolean => {
  if (!task.subTasks || task.subTasks.length === 0) {
    return selectedTaskIds.includes(task.id);
  }
  const nonCompletedSubTasks = task.subTasks.filter(st => !st.completed);
  if (nonCompletedSubTasks.length === 0) return false;
  return nonCompletedSubTasks.every(st => st.selected);
};

export const isDailyTaskPartiallySelected = (task: Task, selectedTaskIds: string[]): boolean => {
  if (!task.subTasks || task.subTasks.length === 0) {
    return false;
  }
  const nonCompletedSubTasks = task.subTasks.filter(st => !st.completed);
  if (nonCompletedSubTasks.length === 0) return false;
  const fully = nonCompletedSubTasks.every(st => st.selected);
  const any = nonCompletedSubTasks.some(st => st.selected);
  return any && !fully;
};

/**
 * Toggles selection of all eligible subtasks in a daily task
 */
export const toggleAllDailySubtasks = (task: Task, selectAll: boolean): Task => {
  if (!task.subTasks) return task;
  return {
    ...task,
    subTasks: task.subTasks.map(st => {
      if (st.completed) return st;
      return { ...st, selected: selectAll };
    })
  };
};
