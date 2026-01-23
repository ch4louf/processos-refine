
import React, { useState, useMemo } from 'react';
import { 
  Play, BookOpen, Settings2, Activity,
  AlertCircle, Plus, ArrowRight, Pencil, CheckCircle2, 
  Trash2, RotateCcw,
  ArrowUpDown, ArrowUp, ArrowDown, ListFilter, Info as InfoIcon,
  ReceiptText,
  ChevronDown,
  History,
  X,
  Search,
  Lock,
  Globe,
  Shield
} from 'lucide-react';
import { calculateStatus, resolveEffectiveUser, getProcessGovernance, hasGovernancePermission } from './services/governance';
import { ProcessDefinition, ProcessRun, VersionStatus, StepType, Notification } from './types';
import RectoEditor from './components/RectoEditor';
import VersoExecution from './components/VersoExecution';
import RunProcessModal from './components/RunProcessModal';
import TaskCenter from './components/TaskCenter';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import Layout from './components/Layout';
import ActiveRuns from './components/ActiveRuns';

// Context Imports
import { UserProvider, useUser } from './contexts/UserContext';
import { DataProvider, useData } from './contexts/DataContext';
import { UIProvider, useUI } from './contexts/UIContext';

type ViewState = 'DASHBOARD' | 'RECTO_EDITOR' | 'VERSO_EXECUTION';
type TabState = 'MY_TASKS' | 'DASHBOARD' | 'LIBRARY' | 'PROCESS_RUNS' | 'COMPLETED_RUNS' | 'TEAM' | 'REVIEWS' | 'BILLING';
type LibraryContext = 'DESIGN' | 'RUN';

const ColumnHeader = ({ 
  label, onSort, onFilter, isSorted, sortDir, isFiltered 
}: { 
  label: string, onSort: () => void, onFilter: (e: React.MouseEvent) => void,
  isSorted: boolean, sortDir: 'asc' | 'desc', isFiltered: boolean
}) => {
  const isActive = isSorted || isFiltered;
  return (
    <th className={`px-6 py-4 text-left transition-all relative border-r border-white/5 last:border-r-0 ${
      isActive ? 'bg-indigo-600 text-white shadow-inner' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
    }`}>
      <div className="flex items-center justify-between gap-2 min-w-[120px]">
        <span className="text-[11px] font-black uppercase tracking-wider truncate">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onSort(); }} className={`p-1 rounded transition-colors ${isActive ? 'hover:bg-indigo-500' : 'hover:bg-slate-200'}`}>
            {isSorted ? (sortDir === 'asc' ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />) : <ArrowUpDown size={12} className="opacity-40" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onFilter(e); }} className={`p-1 rounded transition-colors ${isFiltered ? 'bg-indigo-400 text-white' : (isActive ? 'hover:bg-indigo-500' : 'hover:bg-slate-200')}`}>
            <ListFilter size={12} strokeWidth={isFiltered ? 3 : 2} className={!isFiltered && !isActive ? 'opacity-40' : ''} />
          </button>
        </div>
      </div>
    </th>
  );
};

// --- INNER APP COMPONENT (Consumed inside Providers) ---
function InnerApp() {
  const { currentUser, users, workspace, teams } = useUser();
  const { processes, runs, tasks, saveProcess, saveProcesses, addRun, updateRun } = useData();
  const { showToast } = useUI();

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<TabState>('DASHBOARD');
  const [libraryContext, setLibraryContext] = useState<LibraryContext>('RUN');
  const [activeVersionSelector, setActiveVersionSelector] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, dir: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterMenu, setActiveFilterMenu] = useState<{ key: string, x: number, y: number } | null>(null);

  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(true);
  
  // Logic state that might stay here or move to a specific hook later
  const [draftConflict, setDraftConflict] = useState<{ existingDraft: ProcessDefinition, targetBaseVersion: ProcessDefinition } | null>(null);
  const [runModalProcess, setRunModalProcess] = useState<ProcessDefinition | null>(null);
  
  // Filter state passed to ActiveRuns when navigating from a specific process
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  const handleNavigate = (tab: TabState, context: LibraryContext = 'RUN') => {
    setActiveTab(tab); 
    setLibraryContext(context); 
    setCurrentView('DASHBOARD'); 
    setDraftConflict(null);
    setSearchTerm('');
    setSortConfig(null);
    setColumnFilters({});
    setActiveVersionSelector(null);
    setHistoryFilter(null); // Clear specific filter when navigating via menu
  };

  const openProcess = (p: ProcessDefinition, readOnly = true) => {
    setSelectedProcessId(p.id);
    setIsEditorReadOnly(readOnly);
    setCurrentView('RECTO_EDITOR');
    setDraftConflict(null);
    setActiveVersionSelector(null);
  };

  const openRun = (run: ProcessRun) => {
    setSelectedRunId(run.id);
    setCurrentView('VERSO_EXECUTION');
  };

  const handleViewHistory = (rootId: string) => {
    setHistoryFilter(rootId);
    setActiveTab('PROCESS_RUNS');
    setCurrentView('DASHBOARD');
  };

  const handleNotificationAction = (n: Notification) => {
    if (!n.linkId) return;
    
    if (n.linkType === 'RUN') {
      const run = runs.find(i => i.id === n.linkId);
      if (run) {
        openRun(run);
      } else {
        showToast("Run not found or access denied.", 'ERROR');
      }
    } else if (n.linkType === 'PROCESS') {
      const p = processes.find(v => v.id === n.linkId);
      if (p) {
        openProcess(p, true);
      } else {
        showToast("Process not found or access denied.", 'ERROR');
      }
    }
  };

  const handleEditIntent = (p: ProcessDefinition) => {
    const hasPermission = currentUser.permissions.canDesign;
    if (!hasPermission) {
      showToast("Access Denied: Restricted capability.", 'ERROR');
      openProcess(p, true);
      return;
    }

    const isDesignatedEditor = hasGovernancePermission(currentUser, p, 'EDITOR', workspace, teams);

    if (p.status === 'DRAFT') {
      openProcess(p, !isDesignatedEditor);
      return;
    }
    
    if (!isDesignatedEditor) {
      const { editor } = getProcessGovernance(p, users, workspace, teams);
      showToast(`Governance Alert: Restricted to ${editor.jobTitle} or Admin.`, 'ERROR');
      openProcess(p, true);
      return;
    }

    const existingDraft = processes.find(v => v.rootId === p.rootId && (v.status === 'DRAFT' || v.status === 'IN_REVIEW'));
    if (existingDraft) {
      setDraftConflict({ existingDraft, targetBaseVersion: p });
    } else {
      createNewDraft(p);
    }
  };

  const createNewDraft = (base: ProcessDefinition, overwriteDraftId?: string) => {
    const family = processes.filter(v => v.rootId === base.rootId);
    
    const calculationFamily = overwriteDraftId 
        ? family.filter(v => v.id !== overwriteDraftId) 
        : family;

    const nextVerNum = calculationFamily.length > 0 
        ? Math.max(...calculationFamily.map(v => v.versionNumber)) + 1 
        : 1;
    
    const newDraft: ProcessDefinition = {
      ...base,
      id: `pv-${Math.random().toString(36).substr(2, 9)}`,
      rootId: base.rootId,
      versionNumber: nextVerNum,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      createdBy: `${currentUser.firstName} ${currentUser.lastName}`,
      publishedAt: undefined,
      publishedBy: undefined,
      steps: base.steps.map(s => ({ ...s }))
    };

    let nextProcesses = [...processes];
    if (overwriteDraftId) {
      nextProcesses = nextProcesses.filter(v => v.id !== overwriteDraftId);
    }
    saveProcesses([newDraft, ...nextProcesses]);
    setDraftConflict(null);
    openProcess(newDraft, false);
    showToast(`Draft v${nextVerNum} created.`);
  };

  const updateProcessStatus = (id: string, newStatus: VersionStatus, toastMsg: string) => {
    const updatedProcesses = processes.map(p => {
      if (p.id === id) {
        return { ...p, status: newStatus };
      }
      if (newStatus === 'PUBLISHED' && p.rootId === processes.find(proc => proc.id === id)?.rootId && p.status === 'PUBLISHED' && p.id !== id) {
        return { ...p, status: 'ARCHIVED' as VersionStatus };
      }
      return p;
    });
    saveProcesses(updatedProcesses);
    showToast(toastMsg);
    if (selectedProcessId === id) {
        setIsEditorReadOnly(newStatus !== 'DRAFT');
    }
  };

  const submitForReview = (p: ProcessDefinition) => {
      updateProcessStatus(p.id, 'IN_REVIEW', "Submitted for review.");
  };

  const recallToDraft = (p: ProcessDefinition) => {
      updateProcessStatus(p.id, 'DRAFT', "Recalled to Draft.");
  };

  const publishDraft = (draft: ProcessDefinition) => {
    // PBAC: Check pure permissions
    const hasPermission = currentUser.permissions.canVerifyDesign;
    if (!hasPermission) {
      showToast("Access Denied: Verification permission required.", 'ERROR');
      return;
    }

    const canPublish = hasGovernancePermission(currentUser, draft, 'PUBLISHER', workspace, teams);

    if (!canPublish) {
      const { publisher } = getProcessGovernance(draft, users, workspace, teams);
      showToast(`Governance Alert: Only ${publisher.jobTitle} or Admin can publish.`, 'ERROR');
      return;
    }

    const updated = processes.map(v => {
      if (v.rootId === draft.rootId) {
        if (v.id === draft.id) {
          return {
            ...v,
            status: 'PUBLISHED' as VersionStatus,
            publishedAt: new Date().toISOString(),
            publishedBy: `${currentUser.firstName} ${currentUser.lastName}`,
            lastReviewedAt: new Date().toISOString(),
            lastReviewedBy: `${currentUser.firstName} ${currentUser.lastName}`,
          };
        }
        if (v.status === 'PUBLISHED') {
          return { ...v, status: 'ARCHIVED' as VersionStatus };
        }
      }
      return v;
    });
    saveProcesses(updated);
    setIsEditorReadOnly(true);
    showToast(`v${draft.versionNumber} published.`);
  };

  const handleCreateRun = (process: ProcessDefinition, runName: string) => {
    if (!currentUser.permissions.canExecute) {
      showToast("Access Denied: Operation restricted.", 'ERROR');
      return;
    }

    const runId = `run-${Date.now()}`;
    const newRun: ProcessRun = {
      id: runId,
      rootProcessId: process.rootId,
      versionId: process.id,
      processTitle: process.title,
      runName,
      startedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      startedAt: new Date().toISOString(),
      stepValues: {},
      completedStepIds: [],
      stepFeedback: {},
      status: 'NOT_STARTED',
      activityLog: [{
        id: `l-${Date.now()}`,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        action: 'Run initiated',
        timestamp: new Date().toISOString()
      }]
    };

    addRun(newRun);
    setRunModalProcess(null);
    showToast(`Run started.`);
    openRun(newRun);
  };

  const handleUpdateRun = (updated: ProcessRun) => {
    updateRun(updated);
    if (updated.status === 'IN_REVIEW') showToast("Submitted for verification.");
    if (updated.status === 'APPROVED') showToast("Approved.", 'SUCCESS');
  };

  const handleReviewAttestation = (id: string) => {
    saveProcess({
      ...processes.find(p => p.id === id)!,
      lastReviewedAt: new Date().toISOString(),
      lastReviewedBy: `${currentUser.firstName} ${currentUser.lastName}`
    });
    showToast("Audit cycle reset.");
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.dir === 'asc') return { key, dir: 'desc' };
        return null;
      }
      return { key, dir: 'asc' };
    });
  };

  // VISIBILITY FILTERING LOGIC - STRICT PRIVACY
  const visibleProcesses = useMemo(() => {
    return processes.filter(p => {
        // 1. Public (Company-wide)
        if (p.isPublic) return true;

        // 2. Owning Team
        if (p.category === currentUser.team) return true;

        // 3. Explicit Governance Assignment (Cross-functional access)
        // If the user is explicitly named as Editor/Publisher/etc on a private process
        const governance = getProcessGovernance(p, users, workspace, teams);
        if ([governance.editor.id, governance.publisher.id, governance.runValidator.id, governance.executor.id].includes(currentUser.id)) return true;

        return false;
    });
  }, [processes, currentUser, users, workspace, teams]);

  const groupedProcesses = useMemo(() => {
    const latestVersions: Record<string, ProcessDefinition> = {};
    visibleProcesses.forEach(p => {
      const current = latestVersions[p.rootId];
      if (libraryContext === 'RUN') {
        if (p.status === 'PUBLISHED') {
          if (!current || p.versionNumber > current.versionNumber) {
            latestVersions[p.rootId] = p;
          }
        }
      } else {
        if (!current) {
          latestVersions[p.rootId] = p;
        } else {
          const priorityMap: Record<VersionStatus, number> = { DRAFT: 4, IN_REVIEW: 3, PUBLISHED: 2, ARCHIVED: 1 };
          const pPrio = priorityMap[p.status] || 0;
          const cPrio = priorityMap[current.status] || 0;
          if (pPrio > cPrio) {
            latestVersions[p.rootId] = p;
          } else if (pPrio === cPrio && p.versionNumber > current.versionNumber) {
            latestVersions[p.rootId] = p;
          }
        }
      }
    });
    return Object.values(latestVersions);
  }, [visibleProcesses, libraryContext]);

  const filteredData = useMemo(() => {
    let result = [...groupedProcesses];
    if (searchTerm) result = result.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (!val) return;
      result = result.filter(p => {
        const d = p as any;
        return (d[key]?.toString() || '').toLowerCase().includes(String(val).toLowerCase());
      });
    });
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = ((a as any)[sortConfig.key]?.toString() || '').toLowerCase();
        const valB = ((b as any)[sortConfig.key]?.toString() || '').toLowerCase();
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [groupedProcesses, searchTerm, sortConfig, columnFilters]);

  return (
    <Layout 
      activeTab={activeTab} 
      onNavigate={handleNavigate} 
      libraryContext={libraryContext} 
      reviewRequiredCount={processes.filter(p => p.status === 'PUBLISHED' && (calculateStatus(p) === 'EXPIRED' || calculateStatus(p) === 'DUE_SOON')).length} 
      myTasksCount={tasks.filter(t => t.status === 'OPEN' && resolveEffectiveUser(t.assigneeUserId, t.assigneeJobTitle, t.assigneeTeamId, users, teams).id === currentUser.id).length}
      onNotificationClick={handleNotificationAction}
    >
      {currentView === 'RECTO_EDITOR' && selectedProcessId ? (
        <RectoEditor 
          process={processes.find(p => p.id === selectedProcessId)!} 
          allVersions={processes.filter(p => p.rootId === processes.find(v => v.id === selectedProcessId)?.rootId)} 
          onSwitchVersion={(id) => setSelectedProcessId(id)} 
          onSave={saveProcess} 
          onSubmitReview={submitForReview}
          onRecallDraft={recallToDraft}
          onPublish={publishDraft} 
          onRejectReview={recallToDraft}
          onReview={handleReviewAttestation} 
          onBack={() => setCurrentView('DASHBOARD')} 
          readOnly={isEditorReadOnly} 
          onEdit={() => handleEditIntent(processes.find(p => p.id === selectedProcessId)!)} 
          onViewHistory={(rootId) => handleViewHistory(rootId)}
          onRun={libraryContext === 'RUN' && currentUser.permissions.canExecute ? () => setRunModalProcess(processes.find(p => p.id === selectedProcessId)!) : undefined}
        />
      ) : currentView === 'VERSO_EXECUTION' && selectedRunId ? (
        <VersoExecution 
          process={processes.find(p => p.id === runs.find(i => i.id === selectedRunId)?.versionId)!} 
          instance={runs.find(i => i.id === selectedRunId)!} 
          onUpdateInstance={handleUpdateRun} 
          onBack={() => setCurrentView('DASHBOARD')} 
        />
      ) : (
        activeTab === 'DASHBOARD' ? <Dashboard 
          onAction={(type, id) => { if (type === 'RUN') { const run = runs.find(i => i.id === id); if (run) openRun(run); } else if (type === 'PROCESS') { const p = processes.find(v => v.id === id); if (p) openProcess(p, true); } }}
          onNavigate={(tab) => handleNavigate(tab as TabState)} 
        /> :
        activeTab === 'MY_TASKS' ? <TaskCenter onOpenRun={(id) => { const run = runs.find(i => i.id === id); if (run) openRun(run); }} /> :
        activeTab === 'TEAM' ? (
            currentUser.permissions.canManageTeam ? (
                <TeamManagement searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterRole={null} setFilterRole={() => {}} filterStatus={null} setFilterStatus={() => {}} isFilterOpen={false} setIsFilterOpen={() => {}} isSortOpen={false} setIsSortOpen={() => {}} sortConfig={{key: 'lastName', direction: 'asc'}} onSort={handleSort} activeHeaderMenu={null} onToggleHeaderMenu={() => {}} onClearFilters={() => setColumnFilters({})} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-20 animate-in fade-in">
                    <Shield size={64} className="mb-6 opacity-20" />
                    <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
                    <p className="text-sm mt-2">You do not have permission to view Team Management settings.</p>
                </div>
            )
        ) :
        activeTab === 'PROCESS_RUNS' ? <ActiveRuns onOpenRun={(id) => { const r = runs.find(i => i.id === id); if(r) openRun(r); }} initialFilter={historyFilter} /> :
        activeTab === 'BILLING' ? (
          <div className="p-20 flex flex-col items-center justify-center animate-in fade-in duration-700">
             <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10"><ReceiptText size={48} /></div>
             <h1 className="text-4xl font-light text-slate-900 tracking-tighter mb-4">Finance & Subscription</h1>
             <p className="text-slate-500 text-lg max-w-lg text-center leading-relaxed">
                Centralized management of your SaaS subscription, invoices, and payment methods. 
                This view is only accessible to <strong>Admins</strong> and <strong>Finance Administrators</strong>.
             </p>
             <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Plan</div>
                    <div className="text-2xl font-bold text-indigo-600">Enterprise Scale</div>
                    <div className="text-xs text-slate-400">Unlimited users & processes</div>
                    <button className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">Manage Subscription</button>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Invoice</div>
                    <div className="text-2xl font-bold text-slate-900">$2,499.00</div>
                    <div className="text-xs text-slate-400">Scheduled for April 1st, 2025</div>
                    <button className="mt-4 px-6 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 justify-center"><ReceiptText size={14}/> View History</button>
                </div>
             </div>
          </div>
        ) :
        activeTab === 'LIBRARY' ? (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="bg-white border-b border-slate-200 px-10 h-24 flex items-center shrink-0">
              <div className="flex items-center gap-3 flex-1">
                <button onClick={() => handleSort('title')} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all whitespace-nowrap"><ArrowUpDown size={14} /> Sort</button>
                {Object.keys(columnFilters).length > 0 && <button onClick={() => setColumnFilters({})} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"><RotateCcw size={14} /> Reset Filters</button>}
              </div>
              <div className="flex justify-center flex-1">
                <div className="relative w-full max-w-[400px]">
                  <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search templates..." className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" />
                </div>
              </div>
              <div className="flex justify-end flex-1">
                {libraryContext === 'DESIGN' && (currentUser.permissions.canDesign || currentUser.permissions.canManageTeam) && (
                  <button onClick={() => {
                    const newId = `p-${Date.now()}`;
                    const newP: ProcessDefinition = { 
                      id: `${newId}-v1-draft`, rootId: newId, versionNumber: 1, status: 'DRAFT', title: '', description: '', category: currentUser.team, isPublic: false, // Default to Private Team
                      createdAt: new Date().toISOString(), createdBy: `${currentUser.firstName} ${currentUser.lastName}`, 
                      lastReviewedAt: new Date().toISOString(), lastReviewedBy: `${currentUser.firstName} ${currentUser.lastName}`,
                      review_frequency_days: 180, review_due_lead_days: 30, sequential_execution: false,
                      // GOVERNANCE DEFAULT: Split Brain
                      editor_team_id: currentUser.team, // Doer -> Team
                      publisher_team_id: undefined, // Approver -> Lead (undefined resolves to lead)
                      run_validator_team_id: undefined, // Approver -> Lead (undefined resolves to lead)
                      executor_team_id: currentUser.team, // Doer -> Team
                      steps: [{ id: `s-${Date.now()}`, orderIndex: 0, text: '', inputType: StepType.CHECKBOX, required: true }] 
                    };
                    saveProcesses([newP, ...processes]); openProcess(newP, false);
                  }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"><Plus size={18} /> New Process</button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-10 custom-scrollbar">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-[1000px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <ColumnHeader label="Process Name" onSort={() => handleSort('title')} onFilter={(e) => setActiveFilterMenu({ key: 'title', x: e.clientX, y: e.clientY })} isSorted={sortConfig?.key === 'title'} sortDir={sortConfig?.dir || 'asc'} isFiltered={!!columnFilters.title} />
                      <ColumnHeader label="Category" onSort={() => handleSort('category')} onFilter={(e) => setActiveFilterMenu({ key: 'category', x: e.clientX, y: e.clientY })} isSorted={sortConfig?.key === 'category'} sortDir={sortConfig?.dir || 'asc'} isFiltered={!!columnFilters.category} />
                      <ColumnHeader label="Version" onSort={() => handleSort('versionNumber')} onFilter={(e) => setActiveFilterMenu({ key: 'versionNumber', x: e.clientX, y: e.clientY })} isSorted={sortConfig?.key === 'versionNumber'} sortDir={sortConfig?.dir || 'asc'} isFiltered={!!columnFilters.versionNumber} />
                      <th className="px-6 py-4 bg-slate-50 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">Resolution Hub</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? filteredData.map(p => {
                      const family = processes.filter(v => v.rootId === p.rootId).sort((a,b) => b.versionNumber - a.versionNumber);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group h-16">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                {p.title || 'Untitled Template'}
                                {p.isPublic ? (
                                  <span title="Public" className="flex items-center">
                                    <Globe size={10} className="text-emerald-500" />
                                  </span>
                                ) : (
                                  <span title="Private to Team" className="flex items-center">
                                    <Lock size={10} className="text-slate-300" />
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter truncate max-w-[200px]">ID: {p.rootId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-tight">{p.category}</span>
                          </td>
                          <td className="px-6 py-4 relative">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveVersionSelector(activeVersionSelector === p.id ? null : p.id);
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black transition-all ${
                                  p.status === 'DRAFT' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                                  p.status === 'IN_REVIEW' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                                  p.status === 'PUBLISHED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                  'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                              >
                                v{p.versionNumber} &middot; {p.status}
                                <ChevronDown size={14} className={`transition-transform ${activeVersionSelector === p.id ? 'rotate-180' : ''}`} />
                              </button>
                              
                              {activeVersionSelector === p.id && (
                                <div 
                                    className="absolute top-full left-6 mt-1 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-1 animate-in fade-in zoom-in-95 origin-top"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">History Explorer</span>
                                      <X size={12} className="cursor-pointer text-slate-300 hover:text-slate-600" onClick={() => setActiveVersionSelector(null)} />
                                  </div>
                                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {family.map(v => (
                                      <button 
                                        key={v.id} 
                                        onClick={() => {
                                            openProcess(v, true);
                                            setActiveVersionSelector(null);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group/v transition-colors ${v.id === p.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50'}`}
                                      >
                                        <div className="flex flex-col">
                                          <div className="text-[10px] font-black uppercase tracking-tight">
                                            v{v.versionNumber} &middot; <span className={v.status === 'DRAFT' ? 'text-amber-500' : v.status === 'IN_REVIEW' ? 'text-amber-600' : v.status === 'PUBLISHED' ? 'text-emerald-500' : 'text-slate-400'}>{v.status}</span>
                                          </div>
                                          <div className="text-[9px] text-slate-400 font-medium">Created {new Date(v.createdAt).toLocaleDateString()} by {v.createdBy.split(' ')[0]}</div>
                                        </div>
                                        <History size={12} className="text-slate-300 group-hover/v:text-indigo-400 transition-colors" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {libraryContext === 'RUN' ? (
                                currentUser.permissions.canExecute && (
                                    <button onClick={() => setRunModalProcess(p)} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"><Play size={14} fill="currentColor" /> Run</button>
                                )
                              ) : (
                                <>
                                  <button onClick={() => handleEditIntent(p)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"><Pencil size={14} /></button>
                                  <button onClick={() => openProcess(p, true)} className="p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:text-indigo-600 transition-all"><ArrowRight size={16} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-400 italic">No processes found in this view.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {activeFilterMenu && (
              <div className="fixed z-[100] bg-white border border-slate-200 shadow-2xl rounded-xl p-4 w-64 animate-in zoom-in-95 duration-200" style={{ left: activeFilterMenu.x, top: activeFilterMenu.y + 10 }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase text-slate-400">Filter {activeFilterMenu.key}</span>
                  <button onClick={() => setActiveFilterMenu(null)}><X size={14} /></button>
                </div>
                <input 
                  autoFocus 
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs" 
                  placeholder="Type to filter..." 
                  value={columnFilters[activeFilterMenu.key] || ''} 
                  onChange={(e) => setColumnFilters({...columnFilters, [activeFilterMenu.key]: e.target.value})}
                />
              </div>
            )}
          </div>
        ) :
        <div className="p-20 text-center text-slate-400 italic flex flex-col items-center gap-4"><InfoIcon size={48} className="opacity-20" />Module loading...</div>
      )}
      
      {runModalProcess && <RunProcessModal process={runModalProcess} activeRunsCount={runs.filter(i => i.rootProcessId === runModalProcess.rootId && (i.status === 'IN_PROGRESS' || i.status === 'READY_TO_SUBMIT')).length} onClose={() => setRunModalProcess(null)} onConfirm={(name) => handleCreateRun(runModalProcess, name)} />}
      
      {draftConflict && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
            <div className="p-10 text-center bg-amber-50/30 border-b border-amber-100 relative">
              <button onClick={() => setDraftConflict(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-3xl text-amber-600 flex items-center justify-center mb-6"><AlertCircle size={40} /></div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Draft Conflict Detected</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                An active draft or version in review for this process family (v{draftConflict.existingDraft.versionNumber}) already exists.<br/>
                <span className="font-bold">Author: {draftConflict.existingDraft.createdBy}</span><br/>
              </p>
            </div>
            <div className="p-10 space-y-4">
              <button 
                onClick={() => openProcess(draftConflict.existingDraft, draftConflict.existingDraft.status !== 'DRAFT')} 
                className="w-full flex items-center justify-between p-5 bg-indigo-600 text-white rounded-3xl hover:bg-indigo-700 font-bold transition-all shadow-lg"
              >
                Continue existing {draftConflict.existingDraft.status} v{draftConflict.existingDraft.versionNumber} <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => createNewDraft(draftConflict.targetBaseVersion, draftConflict.existingDraft.id)} 
                className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-3xl hover:border-red-200 hover:bg-red-50 text-slate-600 font-bold transition-all"
              >
                Discard v{draftConflict.existingDraft.versionNumber} and branch from v{draftConflict.targetBaseVersion.versionNumber}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  return (
    <UserProvider>
      <DataProvider>
        <UIProvider>
          <InnerApp />
        </UIProvider>
      </DataProvider>
    </UserProvider>
  );
}

export default App;
