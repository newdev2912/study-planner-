import { StudyJourney, UserStats, SubjectData } from '../types';
import { DailyFocusBanner } from './DailyFocusBanner';
import { GamifiedProfile } from './GamifiedProfile';
import { RoadmapGenerator } from './RoadmapGenerator';
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
  setJourney: (journey: StudyJourney) => void;
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
  setJourney,
}: HomeViewProps) => {
  const todayTasks = journey.daily_tasks.slice(0, 6);

  return (
    <div className="h-full max-w-[1400px] mx-auto px-6 py-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
      {/* Interactive Focus Banner */}
      <DailyFocusBanner 
        focusGoal={stats.focusGoal || ""} 
        updateFocusGoal={updateFocusGoal} 
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Profile & Rank Summary */}
        <div className="col-span-12 lg:col-span-4">
          <GamifiedProfile 
            stats={stats} 
            journey={journey} 
            level={level} 
            levelProgress={levelProgress} 
          />
        </div>

        {/* AI Roadmap Generator */}
        <div className="col-span-12 lg:col-span-8">
          <RoadmapGenerator 
            onGenerateJourney={setJourney}
            onGenerateMastery={setSubjectMastery}
            currentMastery={subjectMastery}
          />
        </div>

        {/* Task Checklist */}
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

        {/* Progress Cards */}
        <div className="col-span-12 lg:col-span-6">
          <SubjectMastery 
            subjects={subjectMastery} 
            setSubjects={setSubjectMastery} 
          />
        </div>

        {/* Learning Journal */}
        <div className="col-span-12 lg:col-span-8">
          <LearningJournal 
            prompt={journey.daily_tasks[0]?.journal_prompt || ""} 
            downloadJournal={downloadJournal} 
          />
        </div>

        {/* Consistency Grid */}
        <div className="col-span-12 lg:col-span-4">
          <ConsistencyMatrix completionPercentage={completionPercentage} />
        </div>
      </div>
    </div>
  );
};
