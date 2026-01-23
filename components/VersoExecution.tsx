
import React, { useMemo, useState, useRef } from 'react';
import { ProcessDefinition, ProcessRun, StepType, User, RunStatus, FeedbackType, StepFeedback } from '../types';
import { BadgeCheck, ShieldAlert, ThumbsUp, ThumbsDown, Lock, Shield, AlertCircle, Send, Clock, X, Flag, AlertTriangle, ArrowRight, ArrowLeft, Zap, Eye, Info } from 'lucide-react';
import { getProcessGovernance, hasGovernancePermission, isGlobalAdmin } from '../services/governance';
import { useUser } from '../contexts/UserContext';
import { VersoStepItem } from './Verso/VersoStepItem';

interface VersoExecutionProps {
  process: ProcessDefinition;
  instance: ProcessRun;
  onUpdateInstance: (instance: ProcessRun) => void;
  onBack: () => void;
}

const VersoExecution: React.FC<VersoExecutionProps> = ({ process, instance, onUpdateInstance, onBack }) => {
  const { users: allUsers, currentUser, workspace, teams, getUserColor } = useUser();
  const isReadOnlyStatus = instance.status === 'IN_REVIEW' || instance.status === 'APPROVED' || instance.status === 'COMPLETED';
  
  const { runValidator, executor } = useMemo(() => 
    getProcessGovernance(process, allUsers, workspace, teams), 
    [process, allUsers, workspace, teams]
  );
  
  const executorUser = useMemo(() => {
    return allUsers.find(u => `${u.firstName} ${u.lastName}` === instance.startedBy) || {
        firstName: instance.startedBy.split(' ')[0], lastName: instance.startedBy.split(' ')[1] || '',
        team: 'Unknown', jobTitle: 'Executor'
    } as unknown as User;
  }, [allUsers, instance.startedBy]);

  const isGlobalAdminUser = isGlobalAdmin(currentUser);
  const canApprove = (hasGovernancePermission(currentUser, process, 'RUN_VALIDATOR', workspace, teams)) && currentUser.permissions.canVerifyRun;
  
  const isExecutorTeamMember = currentUser.team === (process.executor_team_id || process.category);
  const isExplicitExecutor = process.executor_user_id === currentUser.id;
  const isDesignatedExecutor = isExplicitExecutor || isExecutorTeamMember || isGlobalAdminUser;

  const isOwningTeamMember = currentUser.team === process.category;
  
  // Scénario : On est propriétaire (Owner) mais pas l'exécuteur désigné
  const isViewingAsOwnerOnly = isOwningTeamMember && !isDesignatedExecutor && !isGlobalAdminUser;

  const canInteractWithStep = (stepId: string) => {
      if (isReadOnlyStatus) return false;
      
      if (!isDesignatedExecutor) return false;
      
      const step = process.steps.find(s => s.id === stepId);
      if (!step) return false;
      
      // 1. Strict Assignment Check
      const isDirectlyAssigned = 
             step.assignedUserIds?.includes(currentUser.id) || 
             step.assignedTeamIds?.includes(currentUser.team) || 
             step.assignedJobTitles?.includes(currentUser.jobTitle) || 
             step.assignedJobTitle === currentUser.jobTitle ||
             (!step.assignedUserIds?.length && !step.assignedTeamIds?.length && !step.assignedJobTitles?.length && !step.assignedJobTitle);

      if (isDirectlyAssigned) return true;

      // 2. Managerial Override (Team Lead Logic)
      
      // Case A: I am the Lead of the Process's Owning Category (e.g. Finance Lead overriding a Finance step)
      const owningTeam = teams.find(t => t.name === process.category);
      if (owningTeam && owningTeam.leadUserId === currentUser.id) return true;

      // Case B: I am the Lead of the Team explicitly assigned to this step
      if (step.assignedTeamIds && step.assignedTeamIds.length > 0) {
          const leadsOfAssignedTeams = step.assignedTeamIds.map(tName => teams.find(t => t.name === tName)?.leadUserId);
          if (leadsOfAssignedTeams.includes(currentUser.id)) return true;
      }

      return false;
  };

  const canManageRun = isDesignatedExecutor || isGlobalAdminUser;

  const [feedbackModalOpen, setFeedbackModalOpen] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('BLOCKER');
  const [uploadingSteps, setUploadingSteps] = useState<Record<string, boolean>>({});
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const textAreaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const [modalInputValue, setModalInputValue] = useState('');
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; variant: 'danger' | 'warning' | 'info'; withInput?: boolean; inputRequired?: boolean; inputPlaceholder?: string; onConfirm: (inputValue?: string) => void; } | null>(null);

  const visibleSteps = useMemo(() => [...process.steps].sort((a,b) => a.orderIndex - b.orderIndex), [process.steps]);
  const actionableStepsCount = useMemo(() => visibleSteps.filter(s => s.inputType !== StepType.INFO).length, [visibleSteps]);
  const completedActionableCount = useMemo(() => instance.completedStepIds.filter(id => { const step = visibleSteps.find(s => s.id === id); return step && step.inputType !== StepType.INFO; }).length, [instance.completedStepIds, visibleSteps]);
  const progress = useMemo(() => actionableStepsCount === 0 ? 0 : Math.round((completedActionableCount / actionableStepsCount) * 100), [actionableStepsCount, completedActionableCount]);

  const isStepLocked = (stepIndex: number) => {
    if (!process.sequential_execution || stepIndex === 0) return false;
    for (let i = stepIndex - 1; i >= 0; i--) {
        const prevStep = visibleSteps[i];
        if (prevStep.inputType !== StepType.INFO) return !instance.completedStepIds.includes(prevStep.id);
    }
    return false;
  };
  
  const totalUnresolvedBlockers = useMemo(() => Object.values(instance.stepFeedback || {}).flat().filter((f: StepFeedback) => f.type === 'BLOCKER' && !f.resolved).length, [instance.stepFeedback]);
  const canSubmitWithExceptions = useMemo(() => visibleSteps.filter(s => s.required && s.inputType !== StepType.INFO).every(s => instance.completedStepIds.includes(s.id) || (instance.stepFeedback?.[s.id] || []).some(f => f.type === 'BLOCKER' && !f.resolved)), [visibleSteps, instance.completedStepIds, instance.stepFeedback]);

  const adjustTextAreaHeight = (stepId: string) => {
    const el = textAreaRefs.current[stepId];
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  };

  const handleTextChange = (stepId: string, value: string, isLocked: boolean) => {
    if (isReadOnlyStatus || isLocked || !canInteractWithStep(stepId)) return;
    onUpdateInstance({ ...instance, stepValues: { ...instance.stepValues, [stepId]: value } });
    adjustTextAreaHeight(stepId);
  };

  const handleTextClear = (stepId: string) => {
    if (isReadOnlyStatus || !canInteractWithStep(stepId)) return;
    
    // Clear value
    const newStepValues = { ...instance.stepValues };
    delete newStepValues[stepId];
    
    // Remove from completed
    const newCompletedIds = instance.completedStepIds.filter(id => id !== stepId);
    
    // Recalculate Run Status
    let nextStatus = instance.status;
    if (nextStatus === 'NOT_STARTED' || nextStatus === 'REJECTED') nextStatus = 'IN_PROGRESS';
    const allStrictlyDone = visibleSteps.filter(s => s.required && s.inputType !== StepType.INFO).every(s => newCompletedIds.includes(s.id));
    if (nextStatus === 'IN_PROGRESS' && allStrictlyDone) nextStatus = 'READY_TO_SUBMIT';
    else if (nextStatus === 'READY_TO_SUBMIT' && !allStrictlyDone) nextStatus = 'IN_PROGRESS';

    // Audit Log
    const stepIdx = visibleSteps.findIndex(s => s.id === stepId);
    const step = visibleSteps[stepIdx];
    const strictMatch = step && (
        step.assignedUserIds?.includes(currentUser.id) || 
        step.assignedJobTitles?.includes(currentUser.jobTitle) || 
        step.assignedJobTitle === currentUser.jobTitle ||
        (!step.assignedUserIds?.length && step.assignedTeamIds?.includes(currentUser.team))
    );
    const isOverride = !strictMatch && canInteractWithStep(stepId);

    const newLog = [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: `Cleared input for step ${stepIdx + 1}${isOverride ? ' (Team Lead Override)' : ''}`, timestamp: new Date().toISOString() }, ...instance.activityLog];

    onUpdateInstance({ ...instance, stepValues: newStepValues, completedStepIds: newCompletedIds, status: nextStatus as RunStatus, activityLog: newLog });
    
    // Reset height if focused
    if (textAreaRefs.current[stepId]) textAreaRefs.current[stepId]!.style.height = 'auto'; 
  };

  const handleTextCommit = (stepId: string, isLocked: boolean) => {
    if (textAreaRefs.current[stepId]) textAreaRefs.current[stepId]!.style.height = ''; 
    setFocusedStepId(null);
    if (isReadOnlyStatus || isLocked || !canInteractWithStep(stepId)) return;
    
    const value = instance.stepValues[stepId] || '';
    const isInputFilled = value.trim().length > 0;
    
    const wasCompleted = instance.completedStepIds.includes(stepId);
    let newCompletedIds = isInputFilled 
        ? (wasCompleted ? instance.completedStepIds : [...instance.completedStepIds, stepId]) 
        : instance.completedStepIds.filter(id => id !== stepId);
    
    let nextStatus = instance.status;
    if (nextStatus === 'NOT_STARTED' || nextStatus === 'REJECTED') nextStatus = 'IN_PROGRESS';
    const allStrictlyDone = visibleSteps.filter(s => s.required && s.inputType !== StepType.INFO).every(s => newCompletedIds.includes(s.id));
    if (nextStatus === 'IN_PROGRESS' && allStrictlyDone) nextStatus = 'READY_TO_SUBMIT';
    else if (nextStatus === 'READY_TO_SUBMIT' && !allStrictlyDone) nextStatus = 'IN_PROGRESS';

    // AUDIT LOG GENERATION
    let newLog = instance.activityLog;
    const stepIdx = visibleSteps.findIndex(s => s.id === stepId);
    const step = visibleSteps[stepIdx];
    
    // Check if this is an override
    const strictMatch = step && (
        step.assignedUserIds?.includes(currentUser.id) || 
        step.assignedJobTitles?.includes(currentUser.jobTitle) || 
        step.assignedJobTitle === currentUser.jobTitle ||
        (!step.assignedUserIds?.length && step.assignedTeamIds?.includes(currentUser.team))
    );
    const isOverride = !strictMatch && canInteractWithStep(stepId);

    if (isInputFilled && !wasCompleted) {
        newLog = [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: `Completed step ${stepIdx + 1}${isOverride ? ' (Team Lead Override)' : ''}`, timestamp: new Date().toISOString() }, ...instance.activityLog];
    } else if (!isInputFilled && wasCompleted) {
        newLog = [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: `Cleared step ${stepIdx + 1}${isOverride ? ' (Team Lead Override)' : ''}`, timestamp: new Date().toISOString() }, ...instance.activityLog];
    } else if (isInputFilled && wasCompleted) {
        // Log update
        newLog = [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: `Updated input for step ${stepIdx + 1}${isOverride ? ' (Team Lead Override)' : ''}`, timestamp: new Date().toISOString() }, ...instance.activityLog];
    }

    onUpdateInstance({ ...instance, completedStepIds: newCompletedIds, status: nextStatus as RunStatus, activityLog: newLog });
  };

  const handleFileUpload = (stepId: string, file: File, isLocked: boolean) => {
    if (isReadOnlyStatus || isLocked || !canInteractWithStep(stepId)) return;
    setUploadingSteps(prev => ({ ...prev, [stepId]: true }));
    setTimeout(() => {
        const fileData = { name: file.name, size: (file.size / 1024).toFixed(2) + ' KB', type: file.type, url: URL.createObjectURL(file), uploadedAt: new Date().toISOString(), uploaderName: `${currentUser.firstName} ${currentUser.lastName}` };
        const newCompletedIds = instance.completedStepIds.includes(stepId) ? instance.completedStepIds : [...instance.completedStepIds, stepId];
        let nextStatus = (instance.status === 'NOT_STARTED' || instance.status === 'REJECTED') ? 'IN_PROGRESS' : instance.status;
        const allStrictlyDone = visibleSteps.filter(s => s.required && s.inputType !== StepType.INFO).every(s => newCompletedIds.includes(s.id));
        if (nextStatus === 'IN_PROGRESS' && allStrictlyDone) nextStatus = 'READY_TO_SUBMIT';
        
        onUpdateInstance({ ...instance, stepValues: { ...instance.stepValues, [stepId]: fileData }, completedStepIds: newCompletedIds, status: nextStatus as RunStatus, activityLog: [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: `Uploaded evidence: ${file.name}`, timestamp: new Date().toISOString() }, ...instance.activityLog] });
        setUploadingSteps(prev => ({ ...prev, [stepId]: false }));
    }, 1500);
  };

  const handleFileRemove = (stepId: string) => {
    if (isReadOnlyStatus || !canInteractWithStep(stepId)) return;
    setModalConfig({ isOpen: true, title: "Remove File?", message: "Are you sure you want to remove this file? This will uncheck the step.", variant: 'danger', confirmLabel: "Remove File", onConfirm: () => {
        const newStepValues = { ...instance.stepValues }; delete newStepValues[stepId];
        const newCompletedIds = instance.completedStepIds.filter(id => id !== stepId);
        onUpdateInstance({ ...instance, stepValues: newStepValues, completedStepIds: newCompletedIds, status: instance.status === 'READY_TO_SUBMIT' ? 'IN_PROGRESS' : instance.status as RunStatus, activityLog: [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: `Removed evidence file`, timestamp: new Date().toISOString() }, ...instance.activityLog] });
        setModalConfig(null);
    }});
  };

  const toggleStepCompletion = (stepId: string, idx: number) => {
    if (isReadOnlyStatus) return;
    const step = visibleSteps.find(s => s.id === stepId);
    
    // SAFETY: Prevent toggling Automated Steps via the checkbox.
    // Data must be explicitly removed (trash icon or clear text) to uncheck.
    if (!step || step.inputType === StepType.INFO || step.inputType === StepType.TEXT_INPUT || step.inputType === StepType.FILE_UPLOAD || !canInteractWithStep(stepId)) return;
    
    const isCompleted = instance.completedStepIds.includes(stepId);
    if (!isCompleted && isStepLocked(idx)) return; 

    // Manual Checkbox Logic Only below this point
    const newCompletedIds = isCompleted ? instance.completedStepIds.filter(id => id !== stepId) : [...instance.completedStepIds, stepId];
    let nextStatus = (instance.status === 'NOT_STARTED' || instance.status === 'REJECTED') ? 'IN_PROGRESS' : instance.status;
    const allStrictlyDone = visibleSteps.filter(s => s.required && s.inputType !== StepType.INFO).every(s => newCompletedIds.includes(s.id));
    
    if (nextStatus === 'IN_PROGRESS' && allStrictlyDone) nextStatus = 'READY_TO_SUBMIT';
    else if (nextStatus === 'READY_TO_SUBMIT' && !allStrictlyDone) nextStatus = 'IN_PROGRESS';
    
    // Check override for log
    const strictMatch = step && (
        step.assignedUserIds?.includes(currentUser.id) || 
        step.assignedJobTitles?.includes(currentUser.jobTitle) || 
        step.assignedJobTitle === currentUser.jobTitle ||
        (!step.assignedUserIds?.length && step.assignedTeamIds?.includes(currentUser.team))
    );
    const isOverride = !strictMatch;

    onUpdateInstance({ ...instance, completedStepIds: newCompletedIds, status: nextStatus as RunStatus, activityLog: [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: isCompleted ? `Unchecked step ${idx + 1}${isOverride ? ' (Team Lead Override)' : ''}` : `Completed step ${idx + 1}${isOverride ? ' (Team Lead Override)' : ''}`, timestamp: new Date().toISOString() }, ...instance.activityLog] });
  };

  const handleFeedbackSubmit = (stepId: string) => {
    if (!feedbackText.trim()) return;
    const newFeedback: StepFeedback = { id: `fb-${Date.now()}`, stepId, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, text: feedbackText, type: feedbackType, createdAt: new Date().toISOString(), resolved: false };
    const updatedFeedback = { ...instance.stepFeedback };
    updatedFeedback[stepId] = [...(updatedFeedback[stepId] || []), newFeedback];
    onUpdateInstance({ ...instance, stepFeedback: updatedFeedback, activityLog: [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: `Added ${feedbackType} feedback to step`, timestamp: new Date().toISOString() }, ...instance.activityLog] });
    setFeedbackModalOpen(null); setFeedbackText(''); setFeedbackType('BLOCKER');
  };

  const validateRun = (approved: boolean) => {
    setModalConfig({ isOpen: true, title: approved ? "Approve Execution" : "Reject Execution", message: approved ? "You are about to certify this process run as compliant. This action is immutable in the audit log." : "Please provide a reason for rejection. This will reopen the run for the executor.", variant: approved ? 'info' : 'danger', confirmLabel: approved ? "Sign & Approve" : "Reject Run", withInput: !approved, inputRequired: !approved, inputPlaceholder: "Reason for rejection...", onConfirm: (reason) => {
        onUpdateInstance({ ...instance, status: approved ? 'APPROVED' : 'REJECTED', validatedAt: approved ? new Date().toISOString() : undefined, validatorUserId: approved ? currentUser.id : undefined, activityLog: [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: approved ? 'Validated & Approved' : `Rejected: ${reason || 'No reason provided'}`, timestamp: new Date().toISOString() }, ...instance.activityLog] });
        setModalConfig(null);
    }});
  };

  const submitRun = () => {
    if (!canManageRun) return; 
    onUpdateInstance({ ...instance, status: 'IN_REVIEW', activityLog: [{ id: `l-${Date.now()}`, userId: currentUser.id, userName: `${currentUser.firstName} ${currentUser.lastName}`, action: 'Submitted run for verification', timestamp: new Date().toISOString() }, ...instance.activityLog] });
  };

  const renderStyledText = (text: string) => text.split(/(@[^@\s]+(?:\s[^@\s]+)*)/).map((token, i) => token.startsWith('@') ? <span key={i} className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded mx-0.5">{token}</span> : token);

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      <div className="bg-white border-b border-slate-200 px-10 h-20 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-all p-2 hover:bg-slate-50 rounded-xl text-xs"><ArrowLeft size={18} /> <span className="font-bold uppercase tracking-widest text-slate-500">Back</span></button>
          <div className="h-8 w-px bg-slate-100"></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-3">{instance.runName}<span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${instance.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : instance.status === 'IN_REVIEW' ? 'bg-amber-50 text-amber-600 border-amber-100' : instance.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{instance.status.replace('_', ' ')}</span><span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${process.sequential_execution ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{process.sequential_execution ? <Lock size={10} /> : <Zap size={10} />}{process.sequential_execution ? "Sequential Order" : "Flexible"}</span></h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5"><Clock size={10} /> Started {new Date(instance.startedAt).toLocaleDateString()} by {instance.startedBy}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">{instance.status === 'IN_REVIEW' || instance.status === 'PENDING_VALIDATION' ? (canApprove ? (<div className="flex gap-2 animate-in slide-in-from-right-4 fade-in"><button onClick={() => validateRun(true)} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"><ThumbsUp size={14} /> Approve</button><button onClick={() => validateRun(false)} className="px-6 py-2.5 bg-white border border-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2"><ThumbsDown size={14} /> Reject</button></div>) : (<div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100 flex items-center gap-2"><Lock size={14} /> Pending Verification by {runValidator.jobTitle}</div>)) : (isReadOnlyStatus || !canManageRun) ? (<div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-2"><Lock size={14} /> Run Locked</div>) : (<button disabled={!canSubmitWithExceptions || totalUnresolvedBlockers > 0 || !canManageRun} onClick={submitRun} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"><Send size={14} /> Submit Run</button>)}</div>
      </div>

      {/* CONTEXT BANNER: Only show when viewing as Owner without execution rights */}
      {isViewingAsOwnerOnly && !isReadOnlyStatus && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-10 py-2.5 flex items-center justify-center gap-3 animate-in slide-in-from-top-full duration-500">
              <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                  <Eye size={14} />
              </div>
              <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-widest">
                  Viewing as Owner. <span className="opacity-60 font-medium">Execution is delegated to {executor.jobTitle} ({executor.team}).</span>
              </p>
              <div className="h-4 w-px bg-indigo-200 mx-2"></div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400">
                  <Lock size={12} /> Read-only mode
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex justify-center">
        <div className="w-full max-w-4xl space-y-8 pb-20">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 left-0 h-1.5 bg-slate-100 w-full"><div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div></div><div className="flex justify-between items-end relative z-10"><div><div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Process Definition</div><h2 className="text-3xl font-light text-slate-900">{process.title}</h2><p className="text-slate-500 mt-2 text-sm max-w-2xl leading-relaxed">{process.description}</p></div><div className="text-right"><div className="text-5xl font-black text-indigo-600 tracking-tighter">{progress}%</div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Completed</div></div></div></div>
            <div className="space-y-4">
                {visibleSteps.map((step, idx) => (
                    <VersoStepItem 
                        key={step.id} step={step} idx={idx}
                        status={instance.completedStepIds.includes(step.id) ? 'COMPLETED' : ((instance.stepFeedback?.[step.id] || []).some(f => f.type === 'BLOCKER' && !f.resolved) ? 'BLOCKED' : 'PENDING')}
                        locked={isStepLocked(idx)} isReadOnly={isReadOnlyStatus}
                        canInteract={canInteractWithStep(step.id)} isAutomatedStep={step.inputType === StepType.TEXT_INPUT || step.inputType === StepType.FILE_UPLOAD}
                        isInfoStep={step.inputType === StepType.INFO} isFocused={focusedStepId === step.id}
                        stepValue={instance.stepValues[step.id]} uploading={!!uploadingSteps[step.id]}
                        feedbacks={instance.stepFeedback?.[step.id] || []} renderStyledText={renderStyledText}
                        onToggle={toggleStepCompletion} onTextChange={handleTextChange} onTextClear={handleTextClear} onTextKeyDown={(e, id) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); textAreaRefs.current[id]?.blur(); }}}
                        onTextFocus={setFocusedStepId} onTextBlur={handleTextCommit} onFileUpload={handleFileUpload} onFileRemove={handleFileRemove}
                        onAddFeedback={setFeedbackModalOpen} onResolveFeedback={(sId, fbId) => onUpdateInstance({ ...instance, stepFeedback: { ...instance.stepFeedback, [sId]: instance.stepFeedback[sId].map(f => f.id === fbId ? { ...f, resolved: true } : f) } })}
                        textAreaRef={(el) => { textAreaRefs.current[step.id] = el; }}
                    />
                ))}
            </div>

            <div className="mt-16 pt-8 border-t border-slate-200/60">
                <div className="flex flex-col gap-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Flag size={16} /> Run Completion
                    </h3>
                    
                    <div className={`rounded-3xl p-8 border ${
                        instance.status === 'APPROVED' ? 'bg-emerald-50/50 border-emerald-100' :
                        instance.status === 'REJECTED' ? 'bg-red-50/50 border-red-100' :
                        'bg-white border-slate-200 shadow-xl shadow-slate-200/40'
                    }`}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            
                            {/* STATUS SUMMARY */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className={`text-4xl font-light tracking-tighter ${
                                        completedActionableCount === actionableStepsCount ? 'text-indigo-600' : 'text-slate-900'
                                    }`}>
                                        {completedActionableCount}<span className="text-slate-300">/</span>{actionableStepsCount}
                                    </div>
                                    <div className="h-10 w-px bg-slate-200"></div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">Tasks Completed</span>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {completedActionableCount === actionableStepsCount 
                                                ? "All requirements met" 
                                                : `${actionableStepsCount - completedActionableCount} remaining`}
                                        </span>
                                    </div>
                                </div>
                                {totalUnresolvedBlockers > 0 && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 mt-2">
                                        <ShieldAlert size={14} /> {totalUnresolvedBlockers} unresolved blocker{totalUnresolvedBlockers !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            {/* GOVERNANCE CHAIN */}
                            <div className="shrink-0 flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="mb-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">Execution Lead</div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${getUserColor(executorUser.team)}`}>
                                            {executorUser.firstName[0]}{executorUser.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-700">{executorUser.firstName} {executorUser.lastName}</div>
                                            <div className="text-[9px] text-slate-400">{executorUser.jobTitle}</div>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-200 mt-5" size={16} />
                                <div className="flex flex-col items-center">
                                    <div className="mb-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">Validator</div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${getUserColor(runValidator.team)}`}>
                                            {runValidator.firstName[0]}{runValidator.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-700">{runValidator.firstName} {runValidator.lastName}</div>
                                            <div className="text-[9px] text-slate-400">{runValidator.jobTitle}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PRIMARY ACTION */}
                            <div className="shrink-0 flex items-center gap-4">
                                {instance.status === 'IN_REVIEW' || instance.status === 'PENDING_VALIDATION' ? (
                                    canApprove ? (
                                        <div className="flex flex-col items-end gap-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Validation Required</span>
                                            <div className="flex gap-3">
                                                <button onClick={() => validateRun(false)} className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center gap-2"><ThumbsDown size={14} /> Reject</button>
                                                <button onClick={() => validateRun(true)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">Approve Run</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                                            <Clock size={20} />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">Pending Validation</span>
                                                <span className="text-xs opacity-80">Waiting for {runValidator.jobTitle}</span>
                                            </div>
                                        </div>
                                    )
                                ) : instance.status === 'APPROVED' ? (
                                    <div className="flex items-center gap-3 px-8 py-4 bg-emerald-100/50 text-emerald-800 rounded-2xl border border-emerald-200">
                                        <BadgeCheck size={24} />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg">Run Approved</span>
                                            <span className="text-xs">by {allUsers.find(u => u.id === instance.validatorUserId)?.firstName || 'Validator'} on {new Date(instance.validatedAt!).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ) : instance.status === 'REJECTED' ? (
                                    <div className="flex items-center gap-3 px-8 py-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
                                        <AlertCircle size={24} />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg">Run Rejected</span>
                                            <span className="text-xs">Check feedback and resubmit</span>
                                        </div>
                                    </div>
                                ) : (
                                     <button 
                                        disabled={!canSubmitWithExceptions || totalUnresolvedBlockers > 0 || !canManageRun} 
                                        onClick={submitRun}
                                        title={!canManageRun ? "Only the Executor can submit the run." : ""}
                                        className="group relative px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200 transition-all overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center gap-3 text-sm">
                                            Submit Run <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AUDIT TRAIL / ACTIVITY LOG TIMELINE */}
            {instance.activityLog && instance.activityLog.length > 0 && (
                <div className="mt-16 max-w-3xl mx-auto">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center flex items-center justify-center gap-3">
                        <span className="h-px w-8 bg-slate-200"></span>
                        Audit Trail
                        <span className="h-px w-8 bg-slate-200"></span>
                    </h3>
                    <div className="space-y-0 border-l-2 border-slate-100 ml-6 pl-8 relative pb-2">
                        {instance.activityLog.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, i) => {
                            const isLatest = i === 0;
                            return (
                                <div key={log.id} className="relative pb-10 last:pb-0">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-4 box-border flex items-center justify-center ${isLatest ? 'bg-indigo-600 border-indigo-100 shadow-md ring-2 ring-white' : 'bg-white border-slate-200'}`}>
                                        {isLatest && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    
                                    <div className="flex items-start gap-4 group">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${getUserColor(allUsers.find(u => u.id === log.userId)?.team || 'External')}`}>
                                            {log.userName[0]}
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold transition-colors ${isLatest ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                {log.action}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                                                <span>{log.userName}</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                                <span>{new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="h-[20vh] w-full pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      {feedbackModalOpen && (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-900">Add Feedback</h3><button onClick={() => setFeedbackModalOpen(null)}><X size={20} className="text-slate-400" /></button></div><div className="flex gap-2 mb-4">{(['BLOCKER', 'ADVISORY', 'PRAISE'] as FeedbackType[]).map(t => (<button key={t} onClick={() => setFeedbackType(t)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${feedbackType === t ? (t === 'BLOCKER' ? 'bg-red-50 border-red-200 text-red-600' : t === 'ADVISORY' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600') : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>{t}</button>))}</div><textarea autoFocus className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-4 resize-none" placeholder="Describe the issue or comment..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} /><div className="flex justify-end gap-3"><button onClick={() => setFeedbackModalOpen(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold uppercase tracking-widest">Cancel</button><button onClick={() => handleFeedbackSubmit(feedbackModalOpen)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700">Submit Feedback</button></div></div></div>)}
      {modalConfig && modalConfig.isOpen && (<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-white/20"><div className={`p-8 text-center ${modalConfig.variant === 'danger' ? 'bg-red-50/50' : modalConfig.variant === 'warning' ? 'bg-amber-50/50' : 'bg-indigo-50/50'}`}><div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-4 ${modalConfig.variant === 'danger' ? 'bg-red-100 text-red-600' : modalConfig.variant === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{modalConfig.variant === 'danger' ? <ShieldAlert size={32} /> : modalConfig.variant === 'warning' ? <AlertTriangle size={32} /> : <BadgeCheck size={32} />}</div><h3 className="text-xl font-bold text-slate-900 mb-2">{modalConfig.title}</h3><p className="text-sm text-slate-500 leading-relaxed">{modalConfig.message}</p></div><div className="p-8 space-y-4">{modalConfig.withInput && (<div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Optional Comment</label><textarea className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 focus:outline-none focus:border-indigo-500 h-24 resize-none" placeholder={modalConfig.inputPlaceholder} value={modalInputValue} onChange={(e) => setModalInputValue(e.target.value)} /></div>)}<div className="flex gap-3"><button onClick={() => setModalConfig(null)} className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">{modalConfig.cancelLabel || 'Cancel'}</button><button disabled={modalConfig.inputRequired && !modalInputValue.trim()} onClick={() => { modalConfig.onConfirm(modalInputValue); setModalInputValue(''); }} className={`flex-1 py-3 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all ${modalConfig.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>{modalConfig.confirmLabel || 'Confirm'}</button></div></div></div></div>)}
    </div>
  );
};

export default VersoExecution;
