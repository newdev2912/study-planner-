import { Task, DailyFocusSession, SubjectData } from '../../types';

export interface CompletedItem {
  id: string;
  topicTitle: string;
  isCompleted: boolean;
}

export interface CompletedGroup {
  moduleId: string;
  moduleName: string;
  subjectName: string;
  priority: string;
  taskCategory: string;
  items: CompletedItem[];
  totalCount: number;
}

export const getCompletedGroups = (
  activeSession: DailyFocusSession | null,
  activeSessionTasks: Task[],
  subjectMastery: SubjectData[] = []
): CompletedGroup[] => {
  const groupsMap: { [key: string]: CompletedGroup } = {};

  // 1. Collect from activeSession items
  if (activeSession && activeSession.items) {
    activeSession.items.forEach((item: any) => {
      if (!item.isStaged) return;
      const key = `${item.subjectName || 'General'}_${item.moduleName || 'Module'}`;
      if (!groupsMap[key]) {
        groupsMap[key] = {
          moduleId: item.moduleId || item.id,
          moduleName: item.moduleName || item.subjectName || 'Module',
          subjectName: item.subjectName || 'General',
          priority: item.priority || 'low',
          taskCategory: item.taskCategory || 'STUDY',
          items: [],
          totalCount: 0
        };
      }
      groupsMap[key].totalCount++;
      if (item.isCompleted) {
        if (!groupsMap[key].items.some((i) => i.id === item.id)) {
          groupsMap[key].items.push({
            id: item.id,
            topicTitle: item.topicTitle || item.moduleName,
            isCompleted: true
          });
        }
      }
    });
  }

  // 2. Collect from subjectMastery completed topics
  if (subjectMastery && subjectMastery.length > 0) {
    subjectMastery.forEach((subject) => {
      const priority = subject.priority || 'low';
      const taskCategory = subject.taskType || 'STUDY';
      (subject.modules || []).forEach((mod) => {
        const key = `${subject.name}_${mod.name}`;
        const completedTopics = (mod.topics || []).filter(t => t.completed);
        if (completedTopics.length > 0) {
          if (!groupsMap[key]) {
            groupsMap[key] = {
              moduleId: mod.id,
              moduleName: mod.name,
              subjectName: subject.name,
              priority,
              taskCategory,
              items: [],
              totalCount: mod.topics.length
            };
          }
          completedTopics.forEach(topic => {
            const itemId = `${subject.id}_${mod.id}_${topic.id}`;
            if (!groupsMap[key].items.some((i) => i.id === itemId || i.topicTitle === topic.title)) {
              groupsMap[key].items.push({
                id: itemId,
                topicTitle: topic.title,
                isCompleted: true
              });
            }
          });
          groupsMap[key].totalCount = Math.max(groupsMap[key].totalCount, mod.topics.length);
        }
      });
    });
  }

  // 3. Collect from activeSessionTasks
  if (activeSessionTasks && activeSessionTasks.length > 0) {
    activeSessionTasks.forEach((task: any) => {
      const selectedSubTasks = task.subTasks?.filter((st: any) => st.selected) || [];
      const completedSubTasks = selectedSubTasks.filter((st: any) => st.completed);
      const isCompleted = selectedSubTasks.length > 0 
        ? completedSubTasks.length > 0 
        : task.completed;

      if (isCompleted) {
        const key = `${task.subject || 'General'}_${task.task_title}`;
        if (!groupsMap[key]) {
          groupsMap[key] = {
            moduleId: task.id,
            moduleName: task.task_title,
            subjectName: task.subject || 'General',
            priority: task.priority || 'low',
            taskCategory: task.taskType || 'DAILY',
            items: [],
            totalCount: selectedSubTasks.length || 1
          };
        }
        const itemsToPush = selectedSubTasks.length > 0 
          ? completedSubTasks.map((st: any) => ({
              id: `${task.id}_${st.id}`,
              topicTitle: st.title,
              isCompleted: true
            }))
          : [{ id: `${task.id}_default`, topicTitle: task.task_title, isCompleted: true }];

        itemsToPush.forEach(item => {
          if (!groupsMap[key].items.some((i) => i.id === item.id)) {
            groupsMap[key].items.push(item);
          }
        });
      }
    });
  }

  return Object.values(groupsMap).filter(g => g.items.length > 0);
};
