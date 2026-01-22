import { useCallback } from 'react';
import { ProcessDefinition, ProcessRun, VersionStatus } from '../types';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { getProcessGovernance, hasGovernancePermission } from '../services/governance';

interface UseProcessActionsOptions {
  openProcess: (p: ProcessDefinition, readOnly: boolean) => void;
  setIsEditorReadOnly: (readOnly: boolean) => void;
  selectedProcessId: string | null;
}

export function useProcessActions(options: UseProcessActionsOptions) {
  const { openProcess, setIsEditorReadOnly, selectedProcessId } = options;
  
  const { currentUser, users, workspace, teams } = useUser();
  const { processes, runs, saveProcess, saveProcesses, addRun, updateRun } = useData();
  const { showToast } = useUI();

  const updateProcessStatus = useCallback((id: string, newStatus: VersionStatus, toastMsg: string) => {
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
  }, [processes, saveProcesses, showToast, selectedProcessId, setIsEditorReadOnly]);

  const submitForReview = useCallback((p: ProcessDefinition) => {
    updateProcessStatus(p.id, 'IN_REVIEW', "Submitted for review.");
  }, [updateProcessStatus]);

  const recallToDraft = useCallback((p: ProcessDefinition) => {
    updateProcessStatus(p.id, 'DRAFT', "Recalled to Draft.");
  }, [updateProcessStatus]);

  const createNewDraft = useCallback((base: ProcessDefinition, overwriteDraftId?: string) => {
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
    openProcess(newDraft, false);
    showToast(`Draft v${nextVerNum} created.`);
    
    return newDraft;
  }, [processes, currentUser, saveProcesses, openProcess, showToast]);

  const handleEditIntent = useCallback((p: ProcessDefinition): { existingDraft: ProcessDefinition; targetBaseVersion: ProcessDefinition } | null => {
    const hasPermission = currentUser.permissions.canDesign;
    if (!hasPermission) {
      showToast("Access Denied: Restricted capability.", 'ERROR');
      openProcess(p, true);
      return null;
    }

    const isDesignatedEditor = hasGovernancePermission(currentUser, p, 'EDITOR', workspace, teams);

    if (p.status === 'DRAFT') {
      openProcess(p, !isDesignatedEditor);
      return null;
    }
    
    if (!isDesignatedEditor) {
      const { editor } = getProcessGovernance(p, users, workspace, teams);
      showToast(`Governance Alert: Restricted to ${editor.jobTitle} or Admin.`, 'ERROR');
      openProcess(p, true);
      return null;
    }

    const existingDraft = processes.find(v => v.rootId === p.rootId && (v.status === 'DRAFT' || v.status === 'IN_REVIEW'));
    if (existingDraft) {
      return { existingDraft, targetBaseVersion: p };
    } else {
      createNewDraft(p);
      return null;
    }
  }, [currentUser, workspace, teams, users, processes, openProcess, showToast, createNewDraft]);

  const publishDraft = useCallback((draft: ProcessDefinition) => {
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
  }, [currentUser, workspace, teams, users, processes, saveProcesses, setIsEditorReadOnly, showToast]);

  const handleReviewAttestation = useCallback((id: string) => {
    const process = processes.find(p => p.id === id);
    if (process) {
      saveProcess({
        ...process,
        lastReviewedAt: new Date().toISOString(),
        lastReviewedBy: `${currentUser.firstName} ${currentUser.lastName}`
      });
      showToast("Audit cycle reset.");
    }
  }, [processes, saveProcess, currentUser, showToast]);

  const handleCreateRun = useCallback((process: ProcessDefinition, runName: string): ProcessRun | null => {
    if (!currentUser.permissions.canExecute) {
      showToast("Access Denied: Operation restricted.", 'ERROR');
      return null;
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
    showToast(`Run started.`);
    return newRun;
  }, [currentUser, addRun, showToast]);

  const handleUpdateRun = useCallback((updated: ProcessRun) => {
    updateRun(updated);
    if (updated.status === 'IN_REVIEW') showToast("Submitted for verification.");
    if (updated.status === 'APPROVED') showToast("Approved.", 'SUCCESS');
  }, [updateRun, showToast]);

  return {
    submitForReview,
    recallToDraft,
    createNewDraft,
    handleEditIntent,
    publishDraft,
    handleReviewAttestation,
    handleCreateRun,
    handleUpdateRun,
  };
}
