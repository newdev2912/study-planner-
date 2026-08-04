import { StudyJourney, UserStats, SubjectData } from '../types';
import { DailyFocusBanner } from './DailyFocusBanner';
import { GamifiedProfile } from './GamifiedProfile';
import { SubjectAnalyticsGraph } from './SubjectAnalyticsGraph';
import { TaskChecklist } from './TaskChecklist';
import { SubjectMastery } from './SubjectMastery';
import { LearningJournal } from './LearningJournal';
import { ConsistencyMatrix } from './ConsistencyMatrix';

interface HomeViewProps {
  journey: StudyJourney;
  stats: UserStats;
  completionPercentage: number;
  level: number;
  levelProgress: number;
  subjectMastery: SubjectData[];
  setSubjectMastery: (subjects: SubjectData[]) => void;
  setView: (view: 'home' | 'planner') => void;
  downloadJournal: () => void;
  updateFocusGoal: (goal: string) => void;
  handleToggleTask: (taskId: string) => void;
  handleAddTask: () => void;
  handleRemoveTask: (taskId: string) => void;
  handleUpdateTask: (taskId: string, updates: Partial<any>) => void;
}

export const HomeView = ({ 
  journey, 
  stats, 
  completionPercentage, 
  level,
  levelProgress,
  subjectMastery,
  setSubjectMastery,
  setView, 
  downloadJournal, 
  updateFocusGoal,
  handleToggleTask,
  handleAddTask,
  handleRemoveTask,
  handleUpdateTask,
}: HomeViewProps) => {
  const todayTasks = journey.daily_tasks.slice(0, 6);

  return (
    <div className="h-full max-w-[1400px] mx-auto px-6 py-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
      <div className="grid grid-cols-12 gap-6">
        {/* Row 0: Top Header Row */}
        <div className="col-span-12">
          <DailyFocusBanner 
            focusGoal={stats.focusGoal || ""} 
            updateFocusGoal={updateFocusGoal} 
          />
        </div>

        {/* Row 1: Hero Analytics & Analysis */}
        <div className="col-span-12 lg:col-span-4 h-[320px]">
          <GamifiedProfile 
            stats={stats} 
            journey={journey} 
            level={level} 
            levelProgress={levelProgress} 
          />
        </div>

        <div className="col-span-12 lg:col-span-8 h-[320px]">
          <SubjectAnalyticsGraph subjects={subjectMastery} />
        </div>

        {/* Row 2: Active Learning & Progression */}
        <div className="col-span-12 lg:col-span-6">
          <TaskChecklist 
            tasks={todayTasks} 
            handleToggleTask={handleToggleTask}
            handleAddTask={handleAddTask}
            handleRemoveTask={handleRemoveTask}
            handleUpdateTask={handleUpdateTask}
            setView={setView} 
          />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <SubjectMastery 
            subjects={subjectMastery} 
            setSubjects={setSubjectMastery} 
          />
        </div>

        {/* Row 3: Reflection & Analytics */}
        <div className="col-span-12 lg:col-span-7">
          <LearningJournal 
            prompt={journey.daily_tasks[0]?.journal_prompt || ""} 
            downloadJournal={downloadJournal} 
          />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <ConsistencyMatrix completionPercentage={completionPercentage} />
        </div>
      </div>
    </div>
  );
};
