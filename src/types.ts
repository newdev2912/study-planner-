export interface Task {
  id: string;
  day_number?: number;
  subject: string;
  task_title: string;
  description?: string;
  estimated_minutes: number;
  xp_reward?: 50 | 100 | 250;
  category?: 'Theory' | 'Practical Application' | 'Review Day' | 'Boss Battle Project';
  tags?: string[];
  ai_daily_summary?: string;
  journal_prompt?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high' | 'on-going';
  count?: number;
  limit?: number;
  targetCount?: number;      // Number of times it needs to be repeated in a day
  currentCount?: number;     // Current completed count for today
  isCompleted?: boolean;     // Turns true when currentCount >= targetCount
  completedAt?: string;
  type: 'regular' | 'subject';
  createdAt?: string;
  lastResetDate?: string;    // ISO date string 'YYYY-MM-DD' to handle daily resets
  taskType?: 'DAILY' | 'CODE' | 'STUDY';
  subTasks?: { id: string; title: string; completed: boolean; selected?: boolean }[];
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

export type PriorityLevel = 'high' | 'medium' | 'low' | 'on-going';

export interface TopicData {
  id: string;
  title: string;
  completed: boolean;
  selected?: boolean;
}

export interface ModuleData {
  id: string;
  name: string;
  deadline?: string; // ISO date string or YYYY-MM-DD
  topics: TopicData[];
}

export interface DailyActivityLog {
  date: string; // ISO string format 'YYYY-MM-DD' or short label 'Day X'
  topicsCovered: number;
  remainingModules?: number;
  daysRemaining?: number;
}

export interface SubjectData {
  id: string;
  name: string;
  deadline?: string; // Optional overall subject target deadline
  priority?: PriorityLevel;
  taskType?: 'DAILY' | 'CODE' | 'STUDY';
  modules: ModuleData[];
  activityHistory?: DailyActivityLog[]; // Array tracking last 10 days of topic completion
  createdAt?: string;
}

export interface SubjectMasteryState {
  subjects: SubjectData[];
}

export interface StagedFocusItem {
  id: string;             // Unique identifier `${subjectId}_${moduleId}_${topicId}` or regular task id
  subjectId: string;
  subjectName: string;    // e.g., "Data Structures & Algorithms"
  taskCategory: 'CODE' | 'STUDY' | 'DAILY' | string; // e.g., "CODE"
  priority: 'high' | 'medium' | 'low' | 'on-going';
  moduleId: string;
  moduleName: string;     // e.g., "Module 2: Linked Lists"
  topicId: string;
  topicTitle: string;     // e.g., "Doubly Linked List Insertion"
  isStaged: boolean;      // True when staged in Central Panel (Yellow check)
  isCompleted: boolean;   // True when completed in Left Panel Session (Green check)
  stagedAt: string;       // ISO Date timestamp
}

export interface DailyFocusSession {
  date: string;           // Key: "YYYY-MM-DD"
  items: StagedFocusItem[];
  isActive: boolean;
  totalTasks: number;
  completedTasks: number;
}

