import { Task } from '../../types';

/**
 * Uniformity & Synchronicity Engine
 * Maintained from the central panel to the entire planner view.
 * Ensures the populate button and staging functionalities keep all components perfectly in sync.
 */

/**
 * Generates regular daily tasks list merged with subjects to compile the list of unified tasks
 */
export const getUnifiedTasksList = (
  tasks: Task[] = [],
  subjectMastery: any[] = [],
  selectedTaskIds: string[] = [],
  activeSessionTaskIds: string[] = [],
  activeSession: any = null
): Task[] => {
  const list: Task[] = [];

  // Add regular tasks from tasks prop if they don't already exist in list
  if (tasks) {
    tasks.forEach(t => {
      if (!list.some(item => item.id === t.id)) {
        list.push({
          ...t,
          taskType: t.taskType || 'DAILY'
        });
      }
    });
  }

  // Add subjects from subjectMastery prop formatted as tasks
  if (subjectMastery) {
    subjectMastery.forEach(s => {
      const sTaskId = `subject-${s.id}`;
      if (!list.some(item => item.id === sTaskId)) {
        const isSubjectStagedInSession = 
          selectedTaskIds.includes(sTaskId) || 
          selectedTaskIds.includes(s.id) ||
          activeSessionTaskIds.includes(sTaskId);

        list.push({
          id: sTaskId,
          subject: s.name,
          task_title: s.name,
          completed: false,
          priority: s.priority || 'low',
          taskType: s.taskType || 'STUDY',
          estimated_minutes: 60,
          xp_reward: 100,
          type: 'subject',
          subTasks: (s.modules || []).flatMap((m: any, mIdx: number) => 
            (m.topics || []).map((topic: any, tIdx: number) => {
              const isTopicStagedInSession = 
                topic.selected || 
                isSubjectStagedInSession ||
                (activeSession?.items?.some((item: any) => 
                  item.subjectId === s.id && 
                  item.moduleId === m.id && 
                  item.topicId === topic.id && 
                  item.isStaged
                )) || false;

              return {
                id: `sub-topic-${s.id}-${mIdx}-${tIdx}`,
                title: `${m.name}: ${topic.title}`,
                completed: topic.completed,
                selected: isTopicStagedInSession
              };
            })
          )
        });
      }
    });
  }

  return list;
};

/**
 * Helper to compute active tasks for the spotlight queue in focus mode
 */
export const getFocusActiveTasksList = (
  activeSession: any,
  activeSessionTasks: Task[],
  activeSessionTaskIds: string[],
  tasks: Task[]
): Task[] => {
  const hasFirestoreSession = activeSession && activeSession.items && activeSession.items.length > 0;

  if (hasFirestoreSession) {
    const items = activeSession.items.filter((i: any) => i.isStaged);
    const groups: { [key: string]: Task } = {};
    items.forEach((item: any) => {
      const key = `${item.subjectId}_${item.moduleId}`;
      if (!groups[key]) {
        groups[key] = {
          id: item.subjectId,
          subject: item.subjectName,
          task_title: item.moduleName,
          completed: false,
          priority: item.priority || 'medium',
          type: 'subject',
          estimated_minutes: 60,
          subTasks: []
        };
      }
      groups[key].subTasks!.push({
        id: item.id,
        title: item.topicTitle,
        completed: item.isCompleted,
        selected: true
      });
    });
    return Object.values(groups).map(g => {
      const total = g.subTasks?.length || 0;
      const completed = g.subTasks?.filter(st => st.completed).length || 0;
      return {
        ...g,
        completed: total > 0 && completed === total
      };
    });
  } else {
    return activeSessionTasks.map(t => ({
      ...t,
      subTasks: t.subTasks?.filter(st => st.selected).map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed,
        selected: true
      })) || []
    }));
  }
};
