
import React, { useMemo } from 'react';
import { 
  ShieldAlert, Activity, ClipboardList, 
  ArrowRight, BadgeCheck, UserCheck, AlertCircle,
  HeartPulse, Zap, TrendingUp, Bell
} from 'lucide-react';
import { calculateStatus, resolveEffectiveUser, getProcessGovernance } from '../services/governance';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';

interface DashboardProps {
  onAction: (type: 'RUN' | 'PROCESS', id: string) => void;
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onAction, onNavigate }) => {
  const { currentUser: user, users, workspace, teams } = useUser();
  const { processes, runs, tasks } = useData();
  const { notifications } = useUI();

  // --- 1. DATA PROCESSING ---

  // Filter processes visible to this user
  const visibleProcesses = useMemo(() => processes.filter(p => {
    if (user.permissions.canManageTeam) return true;
    if (user.team === 'External') return true;
    if (p.category === user.team) return true;
    if (p.isPublic) return true;
    return false;
  }), [processes, user]);

  // Outdated Processes (Governance)
  const outdatedProcesses = useMemo(() => visibleProcesses.filter(p => p.status === 'PUBLISHED' && calculateStatus(p) === 'OUTDATED'), [visibleProcesses]);
  
  // My Open Tasks
  const myOpenTasks = useMemo(() => tasks.filter(t => {
    if (t.status !== 'OPEN') return false;
    const effective = resolveEffectiveUser(t.assigneeUserId, t.assigneeJobTitle, t.assigneeTeamId, users, teams);
    return effective.id === user.id;
  }), [tasks, user, users, teams]);

  // Pending Validations (For Validators)
  const pendingValidations = useMemo(() => runs.filter(run => {
    if (run.status !== 'IN_REVIEW' && run.status !== 'PENDING_VALIDATION') return false;
    const template = processes.find(p => p.id === run.versionId);
    if (!template) return false;
    
    // Updated to use runValidator specifically
    const { runValidator } = getProcessGovernance(template, users, workspace, teams);
    const isAdmin = user.permissions.canManageTeam; 
    return runValidator.id === user.id || isAdmin;
  }), [runs, processes, user, users, workspace, teams]);

  // Active Runs (For Health Calc)
  const activeRuns = useMemo(() => runs.filter(r => r.status === 'IN_PROGRESS' || r.status === 'READY_TO_SUBMIT'), [runs]);
  
  // Health Calculations
  const averageHealth = useMemo(() => {
    if (activeRuns.length === 0) return 100;
    const total = activeRuns.reduce((acc, r) => acc + (r.healthScore || 100), 0);
    return Math.round(total / activeRuns.length);
  }, [activeRuns]);

  const atRiskRuns = useMemo(() => activeRuns.filter(r => (r.healthScore || 100) < 70), [activeRuns]);

  // Recent Live Feed (Last 5 notifications relevant to user)
  const recentActivity = useMemo(() => notifications
    .filter(n => !n.userId || n.userId === user.id)
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5), 
  [notifications, user]);

  const totalActions = myOpenTasks.length + pendingValidations.length;

  return (
    <div className="p-12 max-w-7xl mx-auto animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="mb-12">
        <h1 className="text-4xl font-light text-slate-900 tracking-tighter mb-4">Dashboard</h1>
        <p className="text-slate-500 italic flex items-center gap-2 text-lg">
          <UserCheck size={20} className="text-indigo-400" />
          Welcome back, {user.firstName}. 
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* KPI 1: Pending Actions */}
        <div 
          onClick={() => onNavigate('MY_TASKS')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer hover:border-indigo-200"
        >
           <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><Zap size={20} /></div>
              {totalActions > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
           </div>
           <div className="relative z-10">
              <div className="text-3xl font-bold text-slate-900">{totalActions}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-indigo-600 transition-colors">Pending Actions</div>
           </div>
        </div>

        {/* KPI 2: System Health */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-all cursor-default">
           {averageHealth < 80 && <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 z-0 pointer-events-none"></div>}
           <div className="flex justify-between items-start relative z-10">
              <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${averageHealth < 70 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <HeartPulse size={20} />
              </div>
           </div>
           <div className="relative z-10">
              <div className={`text-3xl font-bold ${averageHealth < 70 ? 'text-red-600' : 'text-slate-900'}`}>{averageHealth}%</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Fleet Health Score</div>
           </div>
        </div>

        {/* KPI 3: Active Runs */}
        <div 
          onClick={() => onNavigate('PROCESS_RUNS')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer hover:border-indigo-200"
        >
           <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:scale-110 transition-transform"><Activity size={20} /></div>
           </div>
           <div className="relative z-10">
              <div className="text-3xl font-bold text-slate-900">{activeRuns.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-indigo-600 transition-colors">Active Runs</div>
           </div>
        </div>

        {/* KPI 4: Governance */}
        <div 
          onClick={() => onNavigate('REVIEWS')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer hover:border-indigo-200"
        >
           <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:scale-110 transition-transform"><ShieldAlert size={20} /></div>
           </div>
           <div className="relative z-10">
              <div className="text-3xl font-bold text-slate-900">{outdatedProcesses.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-indigo-600 transition-colors">Audit Reviews Due</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT COLUMN: ACTIONS (2/3 width) */}
        <div className="lg:col-span-2 space-y-10">
            
            {/* AT RISK SECTION (Conditional) */}
            {atRiskRuns.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={16} className="text-red-500 animate-pulse" />
                        <h2 className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em]">Critical Attention Needed</h2>
                    </div>
                    <div className="space-y-4">
                        {atRiskRuns.map(run => (
                            <div 
                                key={run.id} 
                                onClick={() => onAction('RUN', run.id)}
                                className="bg-red-50/50 border border-red-100 rounded-[2rem] p-6 flex items-center justify-between cursor-pointer hover:bg-red-50 hover:shadow-md transition-all group"
                            >
                                <div>
                                    <h3 className="font-bold text-slate-900">{run.runName}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                        <span className="font-bold text-red-600">Health: {run.healthScore}%</span>
                                        <span className="text-slate-400">|</span>
                                        <span className="text-slate-500">{run.processTitle}</span>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold uppercase rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                                    Fix Now
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* MY TASKS */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <ClipboardList size={16} /> My Tasks
                    </h2>
                </div>

                <div className="space-y-4">
                    {myOpenTasks.length === 0 && pendingValidations.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-slate-100 rounded-[2.5rem]">
                            <p className="text-slate-400 italic">You're all caught up! No pending actions.</p>
                        </div>
                    ) : (
                        <>
                            {pendingValidations.map(run => (
                                <div 
                                    key={run.id} 
                                    onClick={() => onAction('RUN', run.id)}
                                    className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-6 flex items-center justify-between group hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-amber-200 text-amber-800 rounded-2xl group-hover:scale-110 transition-transform">
                                            <BadgeCheck size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Sign-off Required</h3>
                                            <p className="text-xs text-amber-700/80 mt-1 font-medium">{run.runName}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            ))}

                            {myOpenTasks.map(task => {
                                const run = runs.find(i => i.id === task.runId);
                                const template = processes.find(p => p.id === run?.versionId);
                                const step = template?.steps.find(s => s.id === task.stepId);
                                
                                return (
                                    <div 
                                        key={task.id} 
                                        onClick={() => run && onAction('RUN', run.id)}
                                        className="bg-white border border-slate-100 rounded-[2.5rem] p-6 flex items-center justify-between group hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-5 min-w-0 flex-1">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <ClipboardList size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 truncate">{step?.text}</h3>
                                                <div className="flex items-center gap-2 mt-1 opacity-60">
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{run?.runName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm ml-4">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </section>
        </div>

        {/* RIGHT COLUMN: LIVE FEED & GOVERNANCE (1/3 width) */}
        <div className="space-y-10">
            
            {/* LIVE FEED (New Reactor Visualization) */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-full max-h-[500px] flex flex-col">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
                    <Bell size={16} /> Live Feed
                </h2>
                <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {recentActivity.length > 0 ? recentActivity.map(n => (
                        <div key={n.id} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${n.read ? 'bg-slate-200' : 'bg-indigo-500'}`}></div>
                                <div className="w-px h-full bg-slate-100 mt-1 group-last:hidden"></div>
                            </div>
                            <div className="pb-2">
                                <p className="text-xs text-slate-800 font-medium leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    )) : (
                         <div className="text-center text-slate-400 italic text-xs py-10">System quiet. No recent events.</div>
                    )}
                </div>
            </section>

            {/* GOVERNANCE ALERTS */}
            {outdatedProcesses.length > 0 && (
                <section>
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                        <ShieldAlert size={16} /> Governance
                    </h2>
                    <div className="space-y-3">
                        {outdatedProcesses.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => onAction('PROCESS', p.id)}
                                className="bg-white border-l-4 border-l-red-500 border border-slate-100 rounded-2xl p-5 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                            >
                                <div>
                                    <h3 className="font-bold text-slate-900 text-xs">Review Overdue</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">{p.title}</p>
                                </div>
                                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all">
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
