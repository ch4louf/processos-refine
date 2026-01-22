import { useState, useCallback } from 'react';
import { ProcessDefinition, ProcessRun, Notification } from '../types';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';

export type ViewState = 'DASHBOARD' | 'RECTO_EDITOR' | 'VERSO_EXECUTION';
export type TabState = 'MY_TASKS' | 'DASHBOARD' | 'LIBRARY' | 'PROCESS_RUNS' | 'COMPLETED_RUNS' | 'TEAM' | 'REVIEWS' | 'BILLING';
export type LibraryContext = 'DESIGN' | 'RUN';

export function useAppNavigation() {
  const { showToast } = useUI();
  const { runs, processes } = useData();

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<TabState>('DASHBOARD');
  const [libraryContext, setLibraryContext] = useState<LibraryContext>('RUN');
  
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  const handleNavigate = useCallback((tab: TabState, context: LibraryContext = 'RUN') => {
    setActiveTab(tab);
    setLibraryContext(context);
    setCurrentView('DASHBOARD');
    setHistoryFilter(null);
  }, []);

  const openProcess = useCallback((p: ProcessDefinition, readOnly = true) => {
    setSelectedProcessId(p.id);
    setIsEditorReadOnly(readOnly);
    setCurrentView('RECTO_EDITOR');
  }, []);

  const openRun = useCallback((run: ProcessRun) => {
    setSelectedRunId(run.id);
    setCurrentView('VERSO_EXECUTION');
  }, []);

  const handleViewHistory = useCallback((rootId: string) => {
    setHistoryFilter(rootId);
    setActiveTab('PROCESS_RUNS');
    setCurrentView('DASHBOARD');
  }, []);

  const handleNotificationAction = useCallback((n: Notification) => {
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
  }, [runs, processes, openRun, openProcess, showToast]);

  const goBack = useCallback(() => {
    setCurrentView('DASHBOARD');
  }, []);

  return {
    // State
    currentView,
    activeTab,
    libraryContext,
    selectedProcessId,
    selectedRunId,
    isEditorReadOnly,
    historyFilter,
    
    // Setters
    setIsEditorReadOnly,
    setSelectedProcessId,
    
    // Actions
    handleNavigate,
    openProcess,
    openRun,
    handleViewHistory,
    handleNotificationAction,
    goBack,
  };
}
