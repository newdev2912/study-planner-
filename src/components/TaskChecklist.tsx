import { Zap, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { cn } from '../lib/utils';
import { DashboardPanel } from './DashboardPanel';

interface TaskChecklistProps {
  tasks: Task[];
  handleToggleTask: (taskId: string) => void;
  handleAddTask: () => void;
  handleRemoveTask: (taskId: string) => void;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  setView: (view: 'home' | 'planner') => void;
}

export const TaskChecklist = ({ 
  tasks, 
  handleToggleTask, 
  handleAddTask,
  handleRemoveTask,
  handleUpdateTask,
  setView 
}: TaskChecklistProps) => {
  return (
    <DashboardPanel 
      title="Today's Tasks" 
      icon={<Zap />} 
      accentColor="purple"
      headerAction={
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAddTask}
            className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setView('planner')} className="text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline">View All</button>
        </div>
      }
    >
      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 no-scrollbar">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                "p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 group",
                task.completed 
                  ? "bg-purple-500/5 border-purple-500/20 opacity-60" 
                  : "bg-slate-900/40 border-slate-800/50 hover:border-purple-500/30"
              )}
            >
              <button 
                onClick={() => handleToggleTask(task.id)}
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                  task.completed 
                    ? "bg-purple-500 border-purple-500" 
                    : "border-slate-700 hover:border-purple-500/50"
                )}
              >
                {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <input 
                    type="text"
                    value={task.subject}
                    onChange={(e) => handleUpdateTask(task.id, { subject: e.target.value })}
                    className="text-[8px] font-black text-purple-400 uppercase tracking-tighter px-1.5 py-0.5 bg-purple-500/10 rounded bg-transparent border-none focus:ring-0 w-20"
                  />
                  <span className="text-[9px] text-slate-500 font-bold">{task.estimated_minutes}m</span>
                  
                  {/* Priority Selector */}
                  <select 
                    value={task.priority || 'medium'}
                    onChange={(e) => handleUpdateTask(task.id, { priority: e.target.value as any })}
                    className={cn(
                      "text-[8px] font-black uppercase tracking-tighter px-1 rounded bg-slate-900 border-none focus:ring-0 cursor-pointer",
                      task.priority === 'high' ? 'text-red-400' : task.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    )}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <input 
                  type="text"
                  value={task.task_title}
                  onChange={(e) => handleUpdateTask(task.id, { task_title: e.target.value })}
                  className={cn(
                    "text-xs font-bold bg-transparent border-none p-0 focus:ring-0 w-full",
                    task.completed ? "text-slate-500 line-through" : "text-slate-200"
                  )}
                />
              </div>
              <button 
                onClick={() => handleRemoveTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </DashboardPanel>
  );
};
