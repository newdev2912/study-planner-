export interface Task {
  id: string;
  day_number: number;
  subject: string;
  task_title: string;
  description: string;
  estimated_minutes: number;
  xp_reward: 50 | 100 | 250;
  category: 'Theory' | 'Practical Application' | 'Review Day' | 'Boss Battle Project';
  ai_daily_summary: string;
  journal_prompt: string;
  completed: boolean;
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
  lastActiveDate?: string;
  journalEntries: JournalEntry[];
}

export interface JournalEntry {
  date: string;
  content: string;
  prompt: string;
}
