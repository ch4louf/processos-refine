import React, { useState } from 'react';
import { AlertCircle, ArrowRight, X, Info as InfoIcon } from 'lucide-react';
import { calculateStatus, resolveEffectiveUser } from './services/governance';
import { ProcessDefinition, Notification } from './types';

// Components
import RectoEditor from './components/RectoEditor';
import VersoExecution from './components/VersoExecution';
import RunProcessModal from './components/RunProcessModal';
import TaskCenter from './components/TaskCenter';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import Layout from './components/Layout';
import ActiveRuns from './components/ActiveRuns';

// Pages
import BillingPage from './pages/BillingPage';
import LibraryPage from './pages/LibraryPage';

// Context Providers
import { UserProvider, useUser } from './contexts/UserContext';
import { DataProvider, useData } from './contexts/DataContext';
import { UIProvider } from './contexts/UIContext';

// Hooks
import { useAppNavigation, TabState } from './hooks/useAppNavigation';
import { useProcessActions } from './hooks/useProcessActions';

// --- INNER APP COMPONENT (Consumed inside Providers) ---
function InnerApp() {
  const { currentUser, users, teams } = useUser();
  const { processes, runs, tasks, saveProcess } = useData();

  // Navigation state & actions
  const navigation = useAppNavigation();
  const {
    currentView,
    activeTab,
    libraryContext,
    selectedProcessId,
    selectedRunId,
    isEditorReadOnly,
    historyFilter,
    handleNavigate,
    openProcess,
    openRun,
    handleViewHistory,
    handleNotificationAction,
    goBack,
    setIsEditorReadOnly,
    setSelectedProcessId,
  } = navigation;

  // Process actions
  const processActions = useProcessActions({
    openProcess,
    setIsEditorReadOnly,
    selectedProcessId,
  });
  const {
    submitForReview,
    recallToDraft,
    createNewDraft,
    handleEditIntent,
    publishDraft,
    handleReviewAttestation,
    handleCreateRun,
    handleUpdateRun,
  } = processActions;

  // Local modals state
  const [draftConflict, setDraftConflict] = useState<{ existingDraft: ProcessDefinition; targetBaseVersion: ProcessDefinition } | null>(null);
  const [runModalProcess, setRunModalProcess] = useState<ProcessDefinition | null>(null);

  // Wrapper for edit intent that handles draft conflict
  const handleEditWithConflict = (p: ProcessDefinition) => {
    const conflict = handleEditIntent(p);
    if (conflict) {
      setDraftConflict(conflict);
    }
  };

  // Handle run creation with navigation
  const handleRunCreation = (process: ProcessDefinition, runName: string) => {
    const newRun = handleCreateRun(process, runName);
    if (newRun) {
      setRunModalProcess(null);
      openRun(newRun);
    }
  };

  // Selected entities
  const selectedProcess = selectedProcessId ? processes.find(p => p.id === selectedProcessId) : null;
  const selectedRun = selectedRunId ? runs.find(r => r.id === selectedRunId) : null;
  const runProcess = selectedRun ? processes.find(p => p.id === selectedRun.versionId) : null;

  // Badge counts
  const reviewRequiredCount = processes.filter(p => 
    p.status === 'PUBLISHED' && (calculateStatus(p) === 'OUTDATED' || calculateStatus(p) === 'DUE_SOON')
  ).length;
  
  const myTasksCount = tasks.filter(t => 
    t.status === 'OPEN' && resolveEffectiveUser(t.assigneeUserId, t.assigneeJobTitle, t.assigneeTeamId, users, teams).id === currentUser.id
  ).length;

  return (
    <Layout 
      activeTab={activeTab} 
      onNavigate={handleNavigate} 
      libraryContext={libraryContext} 
      reviewRequiredCount={reviewRequiredCount} 
      myTasksCount={myTasksCount}
      onNotificationClick={handleNotificationAction}
    >
      {/* Process Editor View */}
      {currentView === 'RECTO_EDITOR' && selectedProcess ? (
        <RectoEditor 
          process={selectedProcess} 
          allVersions={processes.filter(p => p.rootId === selectedProcess.rootId)} 
          onSwitchVersion={(id) => setSelectedProcessId(id)} 
          onSave={saveProcess} 
          onSubmitReview={submitForReview}
          onRecallDraft={recallToDraft}
          onPublish={publishDraft} 
          onRejectReview={recallToDraft}
          onReview={handleReviewAttestation} 
          onBack={goBack} 
          readOnly={isEditorReadOnly} 
          onEdit={() => handleEditWithConflict(selectedProcess)} 
          onViewHistory={handleViewHistory}
          onRun={libraryContext === 'RUN' ? () => setRunModalProcess(selectedProcess) : undefined}
        />
      ) : currentView === 'VERSO_EXECUTION' && selectedRun && runProcess ? (
        <VersoExecution 
          process={runProcess} 
          instance={selectedRun} 
          onUpdateInstance={handleUpdateRun} 
          onBack={goBack} 
        />
      ) : (
        // Main content based on active tab
        <>
          {activeTab === 'DASHBOARD' && (
            <Dashboard 
              onAction={(type, id) => { 
                if (type === 'RUN') { 
                  const run = runs.find(i => i.id === id); 
                  if (run) openRun(run); 
                } else if (type === 'PROCESS') { 
                  const p = processes.find(v => v.id === id); 
                  if (p) openProcess(p, true); 
                } 
              }}
              onNavigate={(tab) => handleNavigate(tab as TabState)} 
            />
          )}
          
          {activeTab === 'MY_TASKS' && (
            <TaskCenter onOpenRun={(id) => { 
              const run = runs.find(i => i.id === id); 
              if (run) openRun(run); 
            }} />
          )}
          
          {activeTab === 'TEAM' && (
            <TeamManagement 
              searchTerm="" 
              setSearchTerm={() => {}} 
              filterRole={null} 
              setFilterRole={() => {}} 
              filterStatus={null} 
              setFilterStatus={() => {}} 
              isFilterOpen={false} 
              setIsFilterOpen={() => {}} 
              isSortOpen={false} 
              setIsSortOpen={() => {}} 
              sortConfig={{key: 'lastName', direction: 'asc'}} 
              onSort={() => {}} 
              activeHeaderMenu={null} 
              onToggleHeaderMenu={() => {}} 
              onClearFilters={() => {}} 
            />
          )}
          
          {activeTab === 'PROCESS_RUNS' && (
            <ActiveRuns 
              onOpenRun={(id) => { 
                const r = runs.find(i => i.id === id); 
                if(r) openRun(r); 
              }} 
              initialFilter={historyFilter} 
            />
          )}
          
          {activeTab === 'BILLING' && <BillingPage />}
          
          {activeTab === 'LIBRARY' && (
            <LibraryPage 
              libraryContext={libraryContext}
              onOpenProcess={openProcess}
              onEditProcess={handleEditWithConflict}
              onRunProcess={setRunModalProcess}
            />
          )}
          
          {!['DASHBOARD', 'MY_TASKS', 'TEAM', 'PROCESS_RUNS', 'BILLING', 'LIBRARY'].includes(activeTab) && (
            <div className="p-20 text-center text-slate-400 italic flex flex-col items-center gap-4">
              <InfoIcon size={48} className="opacity-20" />
              Module loading...
            </div>
          )}
        </>
      )}
      
      {/* Run Modal */}
      {runModalProcess && (
        <RunProcessModal 
          process={runModalProcess} 
          activeRunsCount={runs.filter(i => 
            i.rootProcessId === runModalProcess.rootId && 
            (i.status === 'IN_PROGRESS' || i.status === 'READY_TO_SUBMIT')
          ).length} 
          onClose={() => setRunModalProcess(null)} 
          onConfirm={(name) => handleRunCreation(runModalProcess, name)} 
        />
      )}
      
      {/* Draft Conflict Modal */}
      {draftConflict && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
            <div className="p-10 text-center bg-amber-50/30 border-b border-amber-100 relative">
              <button onClick={() => setDraftConflict(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
              <div className="mx-auto w-20 h-20 bg-amber-100 rounded-3xl text-amber-600 flex items-center justify-center mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Draft Conflict Detected</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                An active draft or version in review for this process family (v{draftConflict.existingDraft.versionNumber}) already exists.<br/>
                <span className="font-bold">Author: {draftConflict.existingDraft.createdBy}</span>
              </p>
            </div>
            <div className="p-10 space-y-4">
              <button 
                onClick={() => {
                  openProcess(draftConflict.existingDraft, draftConflict.existingDraft.status !== 'DRAFT');
                  setDraftConflict(null);
                }} 
                className="w-full flex items-center justify-between p-5 bg-indigo-600 text-white rounded-3xl hover:bg-indigo-700 font-bold transition-all shadow-lg"
              >
                Continue existing {draftConflict.existingDraft.status} v{draftConflict.existingDraft.versionNumber} 
                <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => {
                  createNewDraft(draftConflict.targetBaseVersion, draftConflict.existingDraft.id);
                  setDraftConflict(null);
                }} 
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
