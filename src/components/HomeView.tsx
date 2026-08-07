import { StudyJourney, UserStats, SubjectData, Task } from '../types';
import { DailyFocusBanner } from './DailyFocusBanner';
import { GamifiedProfile } from './GamifiedProfile';
import { SubjectAnalyticsGraph } from './SubjectAnalyticsGraph';
import { TaskChecklistContainer } from './tasks/TaskChecklistContainer';
import { SubjectsPanel } from './SubjectsPanel';

interface HomeViewProps {
  journey: StudyJourney;
  stats: UserStats;
  tasks: Task[];
  completionPercentage: number;
  level: number;
  levelProgress: number;
  subjectMastery: SubjectData[];
  setSubjectMastery: (subjects: SubjectData[]) => void;
  setView: (view: 'home' | 'planner') => void;
  updateFocusGoal: (goal: string) => void;
  handleToggleTask: (taskId: string) => void;
  handleAddTask: (type: 'regular' | 'subject') => void;
  handleRemoveTask: (taskId: string) => void;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  setStats?: React.Dispatch<React.SetStateAction<UserStats>>;
}

export const HomeView = ({ 
  journey, 
  stats, 
  tasks,
  completionPercentage, 
  level,
  levelProgress,
  subjectMastery,
  setSubjectMastery,
  setView, 
  updateFocusGoal,
  handleToggleTask,
  handleAddTask,
  handleRemoveTask,
  handleUpdateTask,
  setStats,
}: HomeViewProps) => {
  return (
    <div className="h-full relative overflow-hidden">
      {/* Penetrating Ambient Backlights */}
      <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[20%] w-[35%] h-[35%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="h-full max-w-[1400px] mx-auto px-6 py-6 flex flex-col gap-6 overflow-y-auto no-scrollbar relative z-10">
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
        <div className="col-span-12 lg:col-span-5">
          <TaskChecklistContainer 
            tasks={tasks} 
            subjects={subjectMastery}
            handleToggleTask={handleToggleTask}
            handleAddTask={handleAddTask}
            handleRemoveTask={handleRemoveTask}
            handleUpdateTask={handleUpdateTask}
            setView={setView} 
          />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <SubjectsPanel 
            subjects={subjectMastery} 
            setSubjects={setSubjectMastery} 
            setStats={setStats}
          />
        </div>

        </div>
      </div>
    </div>
  );
};
