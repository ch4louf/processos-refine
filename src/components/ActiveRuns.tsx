import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, ArrowRight, PlayCircle, Shield, CheckCircle2, AlertCircle, Clock, List, LayoutGrid, X, Users } from 'lucide-react';
import { resolveEffectiveUser, getProcessGovernance, canSeeRun } from '../services/governance';
import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { ProcessRun } from '../types';

interface ActiveRunsProps {
  onOpenRun: (runId: string) => void;
  initialFilter?: string | null;
}

// Renamed component for internal clarity, though filename is preserved for system compatibility
const RunController: React.FC<ActiveRunsProps> = ({ onOpenRun, initialFilter }) => {
  const { runs, processes, tasks } = useData();
  const { users, workspace, currentUser, teams, getUserColor } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIVE' | 'HISTORY'>(initialFilter ? 'HISTORY' : 'LIVE');
  const [historyFilterId, setHistoryFilterId] = useState<string | null>(initialFilter || null);

  useEffect(() => {
    if (initialFilter) {
        setViewMode('HISTORY');
        setHistoryFilterId(initialFilter);
    }
  }, [initialFilter]);

  // STRICT VISIBILITY FILTER using governance canSeeRun
  // Visibility: Initiator, Designated Executor, Designated Validator, 
  //             Step Assignee (OPEN or DONE), Entire Owning Team
  const visibleRuns = runs.filter(run => {
      const def = processes.find(p => p.id === run.versionId);
      if (!def) return false;

      return canSeeRun(
        currentUser,
        { startedBy: run.startedBy, versionId: run.versionId },
        def,
        tasks.map(t => ({
          runId: t.runId,
          assigneeUserId: t.assigneeUserId,
          assigneeJobTitle: t.assigneeJobTitle,
          assigneeTeamId: t.assigneeTeamId
        })),
        users,
        workspace,
        teams,
        run.id
      );
  });

  // DATA PREP: Live Runs
  const liveRuns = visibleRuns.filter(r => 
    r.status !== 'COMPLETED' && 
    r.status !== 'APPROVED' && 
    r.status !== 'CANCELLED' && 
    r.status !== 'NOT_STARTED' &&
    r.status !== 'REJECTED' // Rejected usually goes back to queue, but for now treating as 'Active' if corrected? Actually let's keep Rejected in History unless re-activated
  ).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  // DATA PREP: History Runs
  const historyRuns = visibleRuns.filter(r => 
    r.status === 'COMPLETED' || 
    r.status === 'APPROVED' || 
    r.status === 'CANCELLED' || 
    r.status === 'REJECTED'
  ).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()); // Newest first

  const filteredLiveRuns = liveRuns.filter(r => 
    r.runName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.processTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistoryRuns = historyRuns.filter(r => {
    const matchesSearch = r.runName.toLowerCase().includes(searchTerm.toLowerCase()) || r.processTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIdFilter = historyFilterId ? r.rootProcessId === historyFilterId : true;
    return matchesSearch && matchesIdFilter;
  });

  const getBottleneckUser = (run: ProcessRun) => {
    // 1. Validation Stage: The bottleneck is the Validator
    if (run.status === 'IN_REVIEW' || run.status === 'PENDING_VALIDATION') {
      const def = processes.find(p => p.id === run.versionId);
      if (!def) return null;
      const { runValidator } = getProcessGovernance(def, users, workspace, teams);
      return { user: runValidator, label: 'Validator' };
    }

    // 2. Ready to Submit: "The Baton Pass"
    // The responsibility falls on the last person who touched it, or the initiator.
    if (run.status === 'READY_TO_SUBMIT') {
        // Priority A: The last person who performed an action (Activity Log)
        if (run.activityLog && run.activityLog.length > 0) {
            const lastUserId = run.activityLog[0].userId;
            const lastUser = users.find(u => u.id === lastUserId);
            if (lastUser) return { user: lastUser, label: 'Submitter' };
        }
        
        // Priority B: The Initiator (Fallback if no history exists)
        const initiator = users.find(u => `${u.firstName} ${u.lastName}` === run.startedBy);
        if (initiator) return { user: initiator, label: 'Submitter' };
    }
    
    // 3. In Progress: Check open blocking Tasks
    if (run.status === 'IN_PROGRESS') {
        const runTasks = tasks.filter(t => t.runId === run.id && t.status === 'OPEN');
        if (runTasks.length > 0) {
            // Pick first blocking task
            const task = runTasks[0];
            const assignee = resolveEffectiveUser(task.assigneeUserId, task.assigneeJobTitle, task.assigneeTeamId, users, teams);
            return { user: assignee, label: task.assigneeJobTitle || 'Assignee' };
        }
    }
    
    return null;
  };

  const getProgress = (run: ProcessRun) => {
      const def = processes.find(p => p.id === run.versionId);
      if (!def) return { percent: 0, label: '0/0' };
      const total = def.steps.length;
      const completed = run.completedStepIds.length;
      return {
          percent: Math.round((completed / total) * 100),
          label: `${completed}/${total}`
      };
  };

  const getAge = (dateStr: string) => {
      const start = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays;
  };

  const filteredProcessTitle = historyFilterId ? processes.find(p => p.rootId === historyFilterId)?.title : null;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-10 h-24 flex items-center justify-between shrink-0">
            <div>
                <h1 className="text-2xl font-light text-slate-900 flex items-center gap-3">
                    <Activity className="text-indigo-600" /> Process Runs
                </h1>
                <p className="text-slate-500 text-xs mt-1">
                    Manage active runs and review runs history.
                </p>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                    <button 
                        onClick={() => { setViewMode('LIVE'); setHistoryFilterId(null); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'LIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={14} /> Active runs
                    </button>
                    <button 
                        onClick={() => setViewMode('HISTORY')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={14} /> Run history
                    </button>
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="Search runs..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                    />
                </div>
            </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-10 custom-scrollbar bg-[#F8FAFC]">
             {viewMode === 'LIVE' ? (
                 <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-w-[1000px] animate-in slide-in-from-right-4 fade-in duration-300">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Run Identification</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Team</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Momentum & Status</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Completion</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Current Assignee</th>
                                <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Age</th>
                                <th className="px-6 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLiveRuns.length > 0 ? filteredLiveRuns.map(run => {
                                const progress = getProgress(run);
                                const bottleneck = getBottleneckUser(run);
                                const age = getAge(run.startedAt);
                                const processDef = processes.find(p => p.id === run.versionId);

                                return (
                                    <tr key={run.id} onClick={() => onOpenRun(run.id)} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">{run.runName}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight flex items-center gap-1">
                                                    <PlayCircle size={10} /> {run.processTitle}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-tight border border-slate-100">
                                                <Users size={10} /> {processDef?.category || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                run.status === 'IN_PROGRESS' || run.status === 'READY_TO_SUBMIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                run.status === 'IN_REVIEW' || run.status === 'PENDING_VALIDATION' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {run.status === 'IN_PROGRESS' && <Activity size={12} />}
                                                {run.status === 'READY_TO_SUBMIT' && <CheckCircle2 size={12} />}
                                                {(run.status === 'IN_REVIEW' || run.status === 'PENDING_VALIDATION') && <Shield size={12} />}
                                                {run.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-32">
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                                    <span>Step {progress.label}</span>
                                                    <span>{progress.percent}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${
                                                        (run.status === 'IN_REVIEW' || run.status === 'PENDING_VALIDATION') ? 'bg-amber-400' : 'bg-indigo-500'
                                                    }`} style={{ width: `${progress.percent}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {bottleneck ? (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm ${bottleneck.user ? getUserColor(bottleneck.user.team) : 'bg-slate-200 text-slate-500'}`}>
                                                        {bottleneck.user ? `${bottleneck.user.firstName[0]}${bottleneck.user.lastName[0]}` : '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{bottleneck.user ? `${bottleneck.user.firstName} ${bottleneck.user.lastName}` : 'Unassigned'}</span>
                                                        <span className="text-[9px] text-slate-400 uppercase tracking-tighter font-bold">{bottleneck.label}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Processing...</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xs font-bold ${age > 7 ? 'text-amber-500' : 'text-slate-600'}`}>{age} days</span>
                                                <span className="text-[9px] text-slate-400">Since start</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                <ArrowRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400">
                                            <Activity size={48} className="opacity-20" />
                                            <p className="text-sm font-medium">No active runs in flight.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             ) : (
                 <div className="animate-in slide-in-from-left-4 fade-in duration-300 space-y-4">
                     {historyFilterId && (
                         <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                             <div className="flex items-center gap-3">
                                <Filter size={16} className="text-indigo-500" />
                                <span className="text-xs font-bold text-indigo-900">Filtered by Process: <span className="underline decoration-dotted">{filteredProcessTitle || historyFilterId}</span></span>
                             </div>
                             <button onClick={() => setHistoryFilterId(null)} className="p-1 hover:bg-indigo-200 rounded text-indigo-500"><X size={14} /></button>
                         </div>
                     )}
                     
                     <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-w-[1000px]">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">History Record</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Team</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Process Version</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Outcome</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Participants</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistoryRuns.length > 0 ? filteredHistoryRuns.map(run => {
                                    const processDef = processes.find(p => p.id === run.versionId);
                                    
                                    return (
                                        <tr key={run.id} onClick={() => onOpenRun(run.id)} className="hover:bg-slate-50/80 transition-all cursor-pointer group">
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-indigo-600 transition-colors">{run.runName}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono tracking-tight">{run.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-tight border border-slate-100">
                                                    <Users size={10} /> {processDef?.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{processDef?.title}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tight">Version {processDef?.versionNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                    run.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    run.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    run.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                    {run.status === 'APPROVED' && <CheckCircle2 size={12} />}
                                                    {run.status === 'REJECTED' && <AlertCircle size={12} />}
                                                    {run.status === 'CANCELLED' && <X size={12} />}
                                                    {run.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tight font-bold mb-1">Initiator</span>
                                                    <span className="text-xs font-medium text-slate-700">{run.startedBy}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-slate-600">{new Date(run.startedAt).toLocaleDateString()}</span>
                                                    <span className="text-[9px] text-slate-400">
                                                        {run.completedAt || run.validatedAt ? 
                                                            `Closed ${new Date(run.validatedAt || run.completedAt || '').toLocaleDateString()}` : 
                                                            'Terminated'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                    <ArrowRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                                <Clock size={48} className="opacity-20" />
                                                <p className="text-sm font-medium">No history records found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                 </div>
             )}
        </div>
    </div>
  );
};

export default RunController;
