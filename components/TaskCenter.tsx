
import React from 'react';
import { ClipboardList, ChevronRight, CheckSquare, ShieldCheck, Activity } from 'lucide-react';
import { resolveEffectiveUser } from '../services/governance';
import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';

interface TaskCenterProps {
  onOpenRun: (runId: string) => void;
  // Legacy props removed: tasks, runs, processes, users, workspace, currentUser
}

const TaskCenter: React.FC<TaskCenterProps> = ({ onOpenRun }) => {
  const { tasks, runs, processes } = useData();
  const { users, currentUser, teams } = useUser();

  const openTasks = tasks.filter(t => {
    if (t.status !== 'OPEN') return false;
    const effective = resolveEffectiveUser(
      t.assigneeUserId,
      t.assigneeJobTitle,
      t.assigneeTeamId,
      users,
      teams
    );
    return effective.id === currentUser.id;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light text-slate-900 flex items-center gap-3">
            <ClipboardList className="text-indigo-600" />
            Execution Queue
          </h1>
          <p className="text-slate-500 mt-1 italic text-sm">
            Pending responsibilities assigned via SaaS waterfall (B1-B5).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {openTasks.length > 0 ? openTasks.map(task => {
            const run = runs.find(r => r.id === task.runId);
            const template = processes.find(p => p.id === run?.versionId);
            const step = template?.steps.find(s => s.id === task.stepId);
            
            if (!run || !template || !step) return null;

            return (
              <div 
                key={task.id} 
                onClick={() => onOpenRun(run.id)}
                className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-8 flex-1">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <CheckSquare size={24} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors whitespace-pre-wrap">
                        {step.text}
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Activity size={12} className="text-indigo-400" /> {run.runName}
                         </span>
                         <span className="text-slate-200">|</span>
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">
                            Context: {task.assigneeTeamId ? `Team: ${task.assigneeTeamId}` : (task.assigneeJobTitle || 'Direct')}
                         </span>
                      </div>
                   </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </div>
            );
        }) : (
            <div className="py-32 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
                <ShieldCheck size={64} className="text-emerald-100 mb-6" />
                <h3 className="text-xl font-light text-slate-900">Queue Cleared</h3>
            </div>
        )}
      </div>
    </div>
  );
};

export default TaskCenter;
