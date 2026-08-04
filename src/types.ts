export interface Task {
  id: string;
  day_number: number;
  subject: string;
  task_title: string;
  description: string;
  estimated_minutes: number;
  xp_reward: 50 | 100 | 250;
  category: 'Theory' | 'Practical Application' | 'Review Day' | 'Boss Battle Project';
  tags: string[];
  ai_daily_summary: string;
  journal_prompt: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  completedAt?: string;
}

export interface StudyJourney {
  journey_title: string;
  current_milestone: string;
  total_estimated_days: number;
  daily_tasks: Task[];
}

export interface UserStats {
  totalXP: number;
  level: number;
  streak: number;
  tasksCompleted: number;
  lastActiveDate: string;
  focusGoal?: string;
  journalEntries: JournalEntry[];
}

export interface JournalEntry {
  date: string;
  content: string;
  prompt: string;
}

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
}

export interface Module {
  id: string;
  name: string;
  topics: Topic[];
}

export interface SubjectData {
  id: string;
  name: string;
  modules: Module[];
}

export interface SubjectMasteryState {
  subjects: SubjectData[];
}
