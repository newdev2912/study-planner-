import { Zap, Plus } from 'lucide-react';
import { Task, SubjectData } from '../../types';
import { cn } from '../../lib/utils';
import { DashboardPanel } from '../DashboardPanel';
import { useState } from 'react';
import { DailyRefreshList } from './DailyRefreshList';
import { SubjectGoalsList } from './SubjectGoalsList';

interface TaskChecklistProps {
  tasks: Task[];
  subjects: SubjectData[];
  handleToggleTask: (taskId: string) => void;
  handleAddTask: (type: 'regular' | 'subject') => void;
  handleRemoveTask: (taskId: string) => void;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  setView: (view: 'home' | 'planner') => void;
}

export const TaskChecklistContainer = ({ 
  tasks, 
  subjects,
  handleToggleTask, 
  handleAddTask,
  handleRemoveTask,
  handleUpdateTask,
  setView 
}: TaskChecklistProps) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'goals'>('daily');

  return (
    <DashboardPanel 
      title="Today's Tasks" 
      icon={<Zap />} 
      accentColor="purple"
      headerAction={
        <div className="flex items-center gap-3">
          {activeTab === 'daily' && (
            <button 
              onClick={() => handleAddTask('regular')}
              className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setView('planner')} className="text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline">View All</button>
        </div>
      }
    >
      {/* Primary Tabs */}
      <div className="flex bg-slate-900/40 p-1 rounded-xl border border-slate-800/60 mb-4">
        <button
          onClick={() => setActiveTab('daily')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
            activeTab === 'daily' 
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          Daily Refresh
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
            activeTab === 'goals' 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
              : "text-slate-500 hover:text-slate-300"
          )}
        >
          Subject Goals
        </button>
      </div>

      {activeTab === 'daily' ? (
        <DailyRefreshList 
          tasks={tasks}
          subjects={subjects}
          handleToggleTask={handleToggleTask}
          handleRemoveTask={handleRemoveTask}
          handleUpdateTask={handleUpdateTask}
          handleAddTask={handleAddTask}
        />
      ) : (
        <SubjectGoalsList subjects={subjects} />
      )}
    </DashboardPanel>
  );
};
