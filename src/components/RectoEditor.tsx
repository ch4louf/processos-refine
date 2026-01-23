import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProcessDefinition, ProcessStep, StepType, User } from '../types';
import { ArrowLeft, Send, ChevronDown, CheckCircle2, History, Settings, Play, Lock, Globe, RotateCcw, ThumbsUp, ThumbsDown, ShieldAlert, Activity, Info as InfoIcon, Pencil, RefreshCw, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { getProcessGovernance, hasGovernancePermission, isGlobalAdmin, calculateStatus, canRefreshProcess, getExpirationDate, getDaysUntilExpiration, REVIEW_FREQUENCY_PRESETS, FreshnessStatus } from '../services/governance';
import CustomSelect from './CustomSelect';
import { useUser } from '../contexts/UserContext';
import { GovernanceUnit } from './governance/GovernanceUnit';
import { RectoStepItem } from './Recto/RectoStepItem';
import { StatusBadge } from './ui/StatusBadge';
import { ReviewCycleSlider } from './ui/ReviewCycleSlider';

interface RectoEditorProps {
  process: ProcessDefinition;
  allVersions: ProcessDefinition[];
  onSwitchVersion: (id: string) => void;
  onSave: (p: ProcessDefinition) => void;
  onSubmitReview: (p: ProcessDefinition) => void;
  onRecallDraft: (p: ProcessDefinition) => void;
  onPublish: (p: ProcessDefinition) => void;
  onRejectReview: (p: ProcessDefinition) => void;
  onReview: (id: string) => void;
  onBack: () => void;
  readOnly: boolean;
  onEdit: () => void;
  onRun?: () => void;
  onViewHistory?: (rootId: string) => void;
  onRefresh?: (p: ProcessDefinition) => void; // NEW: Refresh callback for Process Freshness System
}

const RectoEditor: React.FC<RectoEditorProps> = ({ 
  process, allVersions, onSwitchVersion, onSave, 
  onSubmitReview, onRecallDraft, onPublish, onRejectReview, onReview, onBack, readOnly, onEdit, onViewHistory, onRun, onRefresh 
}) => {
  const { users: availableUsers, workspace, currentUser, teams, getUserColor } = useUser();
  const [local, setLocal] = useState(process);
  const [showVersionList, setShowVersionList] = useState(false);
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const [showAssignPalette, setShowAssignPalette] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [delegationTarget, setDelegationTarget] = useState<'PUBLISHER' | 'RUN_VALIDATOR' | 'EDITOR' | 'EXECUTOR' | null>(null);
  const stepRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const { editor, publisher, runValidator, executor } = useMemo(() => 
    getProcessGovernance(local, availableUsers, workspace, teams), [local, availableUsers, workspace, teams]);

  const isTeamMember = currentUser.team === local.category;
  const isSuperUser = isGlobalAdmin(currentUser);
  const canEditDefinition = isSuperUser || (isTeamMember && currentUser.team !== 'External' && currentUser.permissions.canDesign);
  const effectiveReadOnly = readOnly || !canEditDefinition;

  const isTeamLead = useMemo(() => {
     const team = teams.find(t => t.name === local.category);
     return team && team.leadUserId === currentUser.id;
  }, [teams, local.category, currentUser.id]);

  const canDelegate = (isTeamLead || isSuperUser) && !effectiveReadOnly;
  const canPublish = currentUser.permissions.canVerifyDesign && hasGovernancePermission(currentUser, local, 'PUBLISHER', workspace, teams);

  // Process Freshness System
  const freshnessStatus = useMemo(() => calculateStatus(local), [local]);
  const daysUntilExpiration = useMemo(() => getDaysUntilExpiration(local), [local]);
  const expirationDate = useMemo(() => getExpirationDate(local), [local]);
  const userCanRefresh = useMemo(() => canRefreshProcess(currentUser, local, workspace, teams), [currentUser, local, workspace, teams]);

  const activeUsers = useMemo(() => availableUsers.filter(u => u.status === 'ACTIVE'), [availableUsers]);
  const availableTeams = useMemo(() => Array.from(new Set(availableUsers.map(u => u.team))), [availableUsers]);
  const categoryOptions = availableTeams.filter(t => t !== 'External').map(c => ({ label: c, value: c }));
  const userOptions = activeUsers.map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u.id, subLabel: u.jobTitle }));
  const titleOptions = Array.from(new Set(availableUsers.map(u => u.jobTitle))).map(t => ({ label: t, value: t }));
  const reviewFrequencyOptions = REVIEW_FREQUENCY_PRESETS.map(p => ({ label: p.label, value: String(p.days) }));

  useEffect(() => { setLocal(process); setDelegationTarget(null); }, [process.id, process.lastReviewedAt]);

  const handleChange = (updates: Partial<ProcessDefinition>) => {
    if (effectiveReadOnly) return;
    const next = { ...local, ...updates };
    setLocal(next);
    onSave(next);
  };

  const handleCategoryChange = (newCategory: string) => {
    if (effectiveReadOnly) return;
    handleChange({
        category: newCategory,
        editor_team_id: newCategory,
        editor_user_id: undefined,
        editor_job_title: undefined,
        publisher_team_id: undefined,
        publisher_user_id: undefined,
        publisher_job_title: undefined,
        executor_team_id: newCategory,
        executor_user_id: undefined,
        executor_job_title: undefined,
        run_validator_team_id: undefined,
        run_validator_user_id: undefined,
        run_validator_job_title: undefined
    });
  };

  const handleDelegationChange = (type: 'user' | 'team' | 'title', value: string) => {
      if (!delegationTarget) return;
      const prefixMap: Record<string, string> = { PUBLISHER: 'publisher', RUN_VALIDATOR: 'run_validator', EXECUTOR: 'executor', EDITOR: 'editor' };
      const prefix = prefixMap[delegationTarget];
      const updates: any = { [`${prefix}_user_id`]: undefined, [`${prefix}_team_id`]: undefined, [`${prefix}_job_title`]: undefined };
      if (type === 'user') updates[`${prefix}_user_id`] = value;
      if (type === 'team') updates[`${prefix}_team_id`] = value;
      if (type === 'title') updates[`${prefix}_job_title`] = value;
      handleChange(updates);
      setDelegationTarget(null);
  };

  const resetDelegation = (target: any) => {
      const prefixMap: Record<string, string> = { PUBLISHER: 'publisher', RUN_VALIDATOR: 'run_validator', EXECUTOR: 'executor', EDITOR: 'editor' };
      const prefix = prefixMap[target];
      const isDoer = target === 'EDITOR' || target === 'EXECUTOR';
      handleChange({ 
        [`${prefix}_user_id`]: undefined, 
        [`${prefix}_team_id`]: isDoer ? local.category : undefined, 
        [`${prefix}_job_title`]: undefined 
      });
      setDelegationTarget(null);
  };

  const updateStep = (id: string, updates: Partial<ProcessStep>) => {
    if (effectiveReadOnly) return;
    handleChange({ steps: local.steps.map(s => s.id === id ? { ...s, ...updates } : s) });
  };

  const toggleAssignment = (stepId: string, type: 'title' | 'user' | 'team', value: string) => {
    const step = local.steps.find(s => s.id === stepId);
    if (!step) return;
    if (type === 'title') {
      const current = step.assignedJobTitles || [];
      updateStep(stepId, { assignedJobTitles: current.includes(value) ? current.filter(t => t !== value) : [...current, value] });
    } else if (type === 'team') {
      const current = step.assignedTeamIds || [];
      updateStep(stepId, { assignedTeamIds: current.includes(value) ? current.filter(t => t !== value) : [...current, value] });
    } else {
      const current = step.assignedUserIds || [];
      updateStep(stepId, { assignedUserIds: current.includes(value) ? current.filter(u => u !== value) : [...current, value] });
    }
  };

  const addStep = () => {
    const newId = `s-${Date.now()}`;
    const newStep: ProcessStep = { id: newId, orderIndex: local.steps.length, text: '', inputType: StepType.CHECKBOX, required: true };
    const nextSteps = [...local.steps, newStep];
    handleChange({ steps: nextSteps.map((s, i) => ({ ...s, orderIndex: i })) });
    setTimeout(() => { stepRefs.current[newId]?.focus(); setFocusedStepId(newId); }, 0);
  };

  const handleEnter = (stepId: string) => {
      const stepIndex = local.steps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) return;
      const nextStep = local.steps[stepIndex + 1];
      if (nextStep) {
          setFocusedStepId(nextStep.id);
          setTimeout(() => {
              const el = stepRefs.current[nextStep.id];
              if (el) { el.focus(); el.setSelectionRange(0, 0); }
          }, 0);
      } else {
          addStep();
      }
  };

  const handleMergeUp = (stepId: string) => {
      const stepIndex = local.steps.findIndex(s => s.id === stepId);
      if (stepIndex <= 0) return;
      const prevStep = local.steps[stepIndex - 1];
      const nextSteps = local.steps.filter(s => s.id !== stepId);
      handleChange({ steps: nextSteps.map((s, i) => ({ ...s, orderIndex: i })) });
      setFocusedStepId(prevStep.id);
      setTimeout(() => {
          const el = stepRefs.current[prevStep.id];
          if (el) { el.focus(); const len = el.value.length; el.setSelectionRange(len, len); }
      }, 0);
  };

  const handleNavigate = (stepId: string, direction: 'UP' | 'DOWN') => {
      const stepIndex = local.steps.findIndex(s => s.id === stepId);
      if (stepIndex === -1) return;
      const targetIndex = direction === 'UP' ? stepIndex - 1 : stepIndex + 1;
      const targetStep = local.steps[targetIndex];
      if (targetStep) {
          setFocusedStepId(targetStep.id);
          setTimeout(() => {
              const el = stepRefs.current[targetStep.id];
              if (el) {
                  el.focus();
                  if (direction === 'UP') { const len = el.value.length; el.setSelectionRange(len, len); } 
                  else { el.setSelectionRange(0, 0); }
              }
          }, 0);
      }
  };

  const removeStep = (id: string) => handleChange({ steps: local.steps.filter(s => s.id !== id).map((s, i) => ({ ...s, orderIndex: i })) });

  const adjustHeight = (el: HTMLTextAreaElement | null) => { if (el) { el.style.height = '0px'; el.style.height = el.scrollHeight + 'px'; } };

  const renderStyledText = (text: string) => {
    if (!text) return null;
    return text.split(/(@[^@\s]+(?:\s[^@\s]+)*)/).map((token, i) => token.startsWith('@') ? <span key={i} className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md mx-0.5 ring-1 ring-indigo-100 shadow-sm transition-all whitespace-nowrap">@{token}</span> : token);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-[#F1F5F9] font-sans">
      
      {/* HEADER - Fixed at top of editor area */}
      <div className="bg-white border-b border-slate-200 px-10 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-all p-2 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-widest"><ArrowLeft size={18} /> LIBRARY</button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="relative">
              <button onClick={() => setShowVersionList(!showVersionList)} className="flex items-center gap-2 text-slate-800 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent">
                <span className="font-bold text-[10px] uppercase tracking-widest">PROCESS v{local.versionNumber}</span>
                <span className="text-slate-200">|</span>
                <StatusBadge status={local.status} />
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showVersionList ? 'rotate-180' : ''}`} />
              </button>
              {showVersionList && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] p-1 animate-in fade-in slide-in-from-top-2">
                   {allVersions.sort((a,b) => b.versionNumber - a.versionNumber).map(v => (
                    <button key={v.id} onClick={() => onSwitchVersion(v.id)} className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-colors ${v.id === local.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}>
                      <div className="flex flex-col"><div className="text-[10px] font-bold uppercase tracking-tight">v{v.versionNumber} {v.status}</div><div className="text-[9px] text-slate-400 font-medium">{new Date(v.createdAt).toLocaleDateString()}</div></div>
                      {v.id === local.id ? <CheckCircle2 size={16} className="text-indigo-500" /> : <History size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {onViewHistory && <button onClick={() => onViewHistory(local.rootId)} className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"><Activity size={14} /> HISTORY</button>}
          </div>

          <div className="flex items-center gap-3">
             {!canEditDefinition && !readOnly && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-400" title="You are not a member of the owning team">
                   <Lock size={12} /> View Only
                </div>
             )}

             {local.status === 'DRAFT' ? (
                <button onClick={() => onSubmitReview(local)} disabled={effectiveReadOnly} className="px-6 py-2 bg-[#4F46E5] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#4338CA] shadow-sm flex items-center gap-2 transition-all"><Send size={14} fill="currentColor" /> SUBMIT FOR REVIEW</button>
             ) : local.status === 'IN_REVIEW' ? (
                <div className="flex gap-2">
                    {canEditDefinition && <button onClick={() => onRecallDraft(local)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"><RotateCcw size={14} /> RECALL DRAFT</button>}
                    {canPublish && (
                        <>
                            <button onClick={() => onPublish(local)} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-sm flex items-center gap-2"><ThumbsUp size={14} /> APPROVE & PUBLISH</button>
                            <button onClick={() => onRejectReview(local)} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-red-50 shadow-sm flex items-center gap-2"><ThumbsDown size={14} /> REJECT</button>
                        </>
                    )}
                </div>
             ) : (
                <button onClick={onEdit} disabled={!canEditDefinition} className="px-5 py-2 bg-[#4F46E5] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#4338CA] shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all"><Pencil size={14} /> NEW REVISION</button>
             )}
          </div>
      </div>

      {/* BODY - Split into Document Area and Settings Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* DOCUMENT AREA (Center, Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
            <div className="w-full max-w-[850px] bg-white min-h-[1050px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200 rounded-sm my-8 pt-12 pb-24 px-16 flex flex-col shrink-0">
                <div className="mb-8 border-b border-slate-100 pb-6">
                <input readOnly={effectiveReadOnly} value={local.title} onChange={(e) => handleChange({ title: e.target.value })} placeholder="Process Title" className="w-full text-[32px] font-bold text-slate-900 placeholder:text-slate-300 border-none outline-none tracking-tight bg-transparent" />
                <textarea readOnly={effectiveReadOnly} value={local.description} onChange={(e) => handleChange({ description: e.target.value })} placeholder="Summarize scope..." className="w-full text-[16px] text-slate-500 border-none outline-none resize-none leading-relaxed italic bg-transparent mt-2" rows={1} onInput={(e) => adjustHeight(e.target as HTMLTextAreaElement)} />
                </div>

                <div className="flex-1 space-y-4">
                    {local.steps.sort((a,b) => a.orderIndex - b.orderIndex).map((step, idx) => (
                        <RectoStepItem 
                            key={step.id} step={step} index={idx} isFocused={focusedStepId === step.id} 
                            effectiveReadOnly={effectiveReadOnly} showAssignPalette={showAssignPalette === step.id}
                            searchQuery={searchQuery} activeUsers={activeUsers} availableTeams={availableTeams}
                            titleSuggestions={Array.from(new Set(availableUsers.map(u => u.jobTitle))).slice(0, 7)}
                            getUserColor={getUserColor} onFocus={setFocusedStepId} onBlur={() => { setFocusedStepId(null); setShowAssignPalette(null); }}
                            onUpdate={updateStep} onRemove={removeStep} onToggleAssignment={(type, val) => toggleAssignment(step.id, type, val)}
                            onSetShowPalette={setShowAssignPalette} onSetSearchQuery={setSearchQuery} renderStyledText={renderStyledText}
                            stepRefs={stepRefs} adjustHeight={adjustHeight} 
                            onEnter={handleEnter}
                            onMergeUp={handleMergeUp}
                            onNavigate={handleNavigate}
                        />
                    ))}
                </div>
            </div>
            {/* Spacer for bottom scrolling ease */}
            <div className="h-20 shrink-0" />
        </div>

        {/* SIDEBAR AREA (Right, Independent Scroll, Fixed Width) */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar shrink-0 z-10">
            <div className="p-6 pb-24 space-y-8">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Settings size={18} className="text-indigo-600" /> PROCESS SETTINGS</div>
            
                {onRun && (
                    <button onClick={onRun} className="w-full bg-[#4F46E5] text-white rounded-xl py-3 font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mb-6">
                        <Play size={14} fill="currentColor" /> RUN
                    </button>
                )}

                {/* Process Freshness System - Only for PUBLISHED processes */}
                {local.status === 'PUBLISHED' && (
                    <div className={`p-4 rounded-xl border-2 space-y-3 ${
                        freshnessStatus === 'EXPIRED' 
                            ? 'bg-red-50 border-red-200' 
                            : freshnessStatus === 'DUE_SOON' 
                            ? 'bg-amber-50 border-amber-200' 
                            : 'bg-emerald-50 border-emerald-100'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {freshnessStatus === 'EXPIRED' ? (
                                    <AlertTriangle size={16} className="text-red-500" />
                                ) : freshnessStatus === 'DUE_SOON' ? (
                                    <Clock size={16} className="text-amber-500" />
                                ) : (
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    freshnessStatus === 'EXPIRED' 
                                        ? 'text-red-600' 
                                        : freshnessStatus === 'DUE_SOON' 
                                        ? 'text-amber-600' 
                                        : 'text-emerald-600'
                                }`}>
                                    {freshnessStatus === 'EXPIRED' ? 'EXPIRED' : freshnessStatus === 'DUE_SOON' ? 'REVIEW DUE SOON' : 'CURRENT'}
                                </span>
                            </div>
                        </div>
                        <div className={`text-[10px] ${
                            freshnessStatus === 'EXPIRED' ? 'text-red-600' : freshnessStatus === 'DUE_SOON' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                            {freshnessStatus === 'EXPIRED' 
                                ? `Expired ${Math.abs(daysUntilExpiration)} days ago`
                                : freshnessStatus === 'DUE_SOON'
                                ? `${daysUntilExpiration} days until expiration`
                                : `Valid until ${expirationDate.toLocaleDateString()}`
                            }
                        </div>
                        {(freshnessStatus === 'EXPIRED' || freshnessStatus === 'DUE_SOON') && userCanRefresh && onRefresh && (
                            <button 
                                onClick={() => onRefresh(local)}
                                className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    freshnessStatus === 'EXPIRED'
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-amber-500 text-white hover:bg-amber-600'
                                }`}
                            >
                                <RefreshCw size={12} /> Refresh Process
                            </button>
                        )}
                        {freshnessStatus === 'EXPIRED' && (
                            <div className="text-[9px] text-red-500 font-medium text-center">
                                ⚠️ New runs are blocked until this process is refreshed
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-6">
                    <div className="space-y-3">
                    <span className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">Access Control</span>
                    <button disabled={effectiveReadOnly} onClick={() => handleChange({ isPublic: !local.isPublic })} className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${local.isPublic ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <div className="flex items-center gap-2">{local.isPublic ? <Globe size={14} /> : <Lock size={14} />}<span className="text-[9px] font-black uppercase tracking-widest">{local.isPublic ? "Public (Company)" : "Private (Team Only)"}</span></div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${local.isPublic ? 'bg-emerald-600' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${local.isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} /></div>
                    </button>
                    </div>

                    <div className="space-y-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        WORKFLOW RULES 
                        <div className="group relative">
                            <InfoIcon size={10} className="text-slate-300 cursor-help" />
                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                Enforces strict ordering. Steps must be completed in sequence; users cannot skip ahead.
                            </div>
                        </div>
                        </span>
                        <button onClick={() => handleChange({ sequential_execution: !local.sequential_execution })} className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${local.sequential_execution ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <div className="flex items-center gap-2"><Lock size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Enforce Step Order</span></div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${local.sequential_execution ? 'bg-[#4F46E5]' : 'bg-slate-300'}`}><div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${local.sequential_execution ? 'translate-x-4' : 'translate-x-0.5'}`} /></div>
                        </button>
                    </div>

                    {/* Review Cycle Slider */}
                    <div className="space-y-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            REVIEW CYCLE
                            <div className="group relative">
                                <InfoIcon size={10} className="text-slate-300 cursor-help" />
                                <div className="absolute right-0 bottom-full mb-2 w-52 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                    Processes expire after this period and must be refreshed. Expired processes block new runs.
                                </div>
                            </div>
                        </span>
                        <ReviewCycleSlider 
                            value={local.review_frequency_days || 180} 
                            onChange={(days) => handleChange({ review_frequency_days: days })} 
                            disabled={effectiveReadOnly} 
                        />
                        {local.status === 'PUBLISHED' && (
                            <div className="text-[9px] text-slate-400 flex items-center gap-1.5 mt-3">
                                <Calendar size={10} />
                                Next review: {expirationDate.toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                    <span className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">Owning Team</span>
                    <CustomSelect value={local.category} onChange={handleCategoryChange} options={categoryOptions} disabled={effectiveReadOnly} className="text-sm" />
                </div>
                
                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">DESIGN GOVERNANCE</span>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 px-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Editor</span>
                                <div className="group relative">
                                    <InfoIcon size={10} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                        The Editor is responsible for maintaining the process definition. Defaults to any member of the owning team.
                                    </div>
                                </div>
                            </div>
                            <GovernanceUnit role="EDITOR" configPrefix="editor" user={editor} local={local} isActive={delegationTarget === 'EDITOR'} canDelegate={canDelegate} effectiveReadOnly={effectiveReadOnly} getUserColor={getUserColor} onSetTarget={setDelegationTarget} onDelegate={handleDelegationChange} onReset={resetDelegation} userOptions={userOptions} categoryOptions={categoryOptions} titleOptions={titleOptions} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 px-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Publisher</span>
                                <div className="group relative">
                                    <InfoIcon size={10} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                        The Publisher is responsible for approving new versions of the process definition.
                                    </div>
                                </div>
                            </div>
                            <GovernanceUnit role="PUBLISHER" configPrefix="publisher" user={publisher} local={local} isActive={delegationTarget === 'PUBLISHER'} canDelegate={canDelegate} effectiveReadOnly={effectiveReadOnly} getUserColor={getUserColor} onSetTarget={setDelegationTarget} onDelegate={handleDelegationChange} onReset={resetDelegation} userOptions={userOptions} categoryOptions={categoryOptions} titleOptions={titleOptions} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-2">EXECUTION GOVERNANCE</span>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 px-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Executor</span>
                                <div className="group relative">
                                    <InfoIcon size={10} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                        The primary team responsible for executing runs of this process.
                                    </div>
                                </div>
                            </div>
                            <GovernanceUnit role="EXECUTOR" configPrefix="executor" user={executor} local={local} isActive={delegationTarget === 'EXECUTOR'} canDelegate={canDelegate} effectiveReadOnly={effectiveReadOnly} getUserColor={getUserColor} onSetTarget={setDelegationTarget} onDelegate={handleDelegationChange} onReset={resetDelegation} userOptions={userOptions} categoryOptions={categoryOptions} titleOptions={titleOptions} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 px-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Run Validator</span>
                                <div className="group relative">
                                    <InfoIcon size={10} className="text-slate-300 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                        The Run Validator signs off on completed executions of this process.
                                    </div>
                                </div>
                            </div>
                            <GovernanceUnit role="RUN_VALIDATOR" configPrefix="run_validator" user={runValidator} local={local} isActive={delegationTarget === 'RUN_VALIDATOR'} canDelegate={canDelegate} effectiveReadOnly={effectiveReadOnly} getUserColor={getUserColor} onSetTarget={setDelegationTarget} onDelegate={handleDelegationChange} onReset={resetDelegation} userOptions={userOptions} categoryOptions={categoryOptions} titleOptions={titleOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
};

export default RectoEditor;