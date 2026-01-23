import React, { useLayoutEffect, useState, useRef } from 'react';
import { Trash2, Bold, UserPlus, X, CheckCircle2, Search, Users, LayoutGrid, Type, Upload, Info as InfoIcon } from 'lucide-react';
import { ProcessStep, StepType, User } from '../../types';

interface RectoStepItemProps {
  step: ProcessStep;
  index: number;
  isFocused: boolean;
  effectiveReadOnly: boolean;
  showAssignPalette: boolean;
  searchQuery: string;
  activeUsers: User[];
  availableTeams: string[];
  titleSuggestions: string[];
  getUserColor: (team: string) => string;
  onFocus: (id: string) => void;
  onBlur: () => void;
  onUpdate: (id: string, updates: Partial<ProcessStep>) => void;
  onRemove: (id: string) => void;
  onToggleAssignment: (type: 'title' | 'user' | 'team', value: string) => void;
  onSetShowPalette: (id: string | null) => void;
  onSetSearchQuery: (q: string) => void;
  renderStyledText: (text: string) => React.ReactNode;
  stepRefs: React.MutableRefObject<Record<string, HTMLTextAreaElement | null>>;
  adjustHeight: (el: HTMLTextAreaElement | null) => void;
  onEnter: (id: string) => void;
  onMergeUp: (id: string) => void;
  onNavigate: (id: string, direction: 'UP' | 'DOWN') => void;
}

const StepTypeIcons = [
  { type: StepType.CHECKBOX, icon: CheckCircle2, label: 'Standard Task' },
  { type: StepType.TEXT_INPUT, icon: Type, label: 'Data Input' },
  { type: StepType.FILE_UPLOAD, icon: Upload, label: 'Evidence/File' },
  { type: StepType.INFO, icon: InfoIcon, label: 'Guidance/Info' },
];

export const RectoStepItem: React.FC<RectoStepItemProps> = React.memo(({
  step, index, isFocused, effectiveReadOnly, showAssignPalette, searchQuery,
  activeUsers, availableTeams, titleSuggestions, getUserColor,
  onFocus, onBlur, onUpdate, onRemove, onToggleAssignment, onSetShowPalette, onSetSearchQuery,
  renderStyledText, stepRefs, adjustHeight, onEnter, onMergeUp, onNavigate
}) => {
  
  // Stores the calculated cursor position from the click event
  const [clickCursorOffset, setClickCursorOffset] = useState<number | null>(null);
  const viewModeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const textarea = stepRefs.current[step.id];
    if (isFocused && textarea) {
      // 1. Auto-adjust height
      adjustHeight(textarea);

      // 2. Restore cursor position if we have one from a click
      if (clickCursorOffset !== null) {
        textarea.setSelectionRange(clickCursorOffset, clickCursorOffset);
        setClickCursorOffset(null); // Reset after applying
      }
      
      // 3. Force focus (in case preventDefault in mouseDown prevented default focus)
      // Note: We don't force selection to 0 for new steps here anymore, handled by parent focus logic
      if (document.activeElement !== textarea) {
          textarea.focus();
      }
    }
  }, [isFocused, step.text, step.id, adjustHeight, stepRefs, clickCursorOffset]);

  const handleViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (effectiveReadOnly) return;

    // CRITICAL: Prevent default browser behavior.
    e.preventDefault();

    // Use browser API to find which character was clicked
    let offset = step.text.length; // Default to end
    const doc = document as any;
    
    // Safety check for document availability
    if (doc.caretRangeFromPoint && viewModeRef.current) {
      // Get the range at the click coordinates
      const range = doc.caretRangeFromPoint(e.clientX, e.clientY);
      
      if (range && viewModeRef.current.contains(range.startContainer)) {
        let calculatedOffset = 0;
        
        // Create a TreeWalker to iterate all text nodes in the view container
        const walker = document.createTreeWalker(
          viewModeRef.current, 
          NodeFilter.SHOW_TEXT, 
          null
        );
        
        let currentNode = walker.nextNode();
        let found = false;

        while (currentNode) {
          if (currentNode === range.startContainer) {
            calculatedOffset += range.startOffset;
            found = true;
            break;
          }
          // Add length of preceding text nodes
          calculatedOffset += currentNode.textContent?.length || 0;
          currentNode = walker.nextNode();
        }

        if (found) {
            offset = calculatedOffset;
        }
      }
    }

    setClickCursorOffset(offset);
    onFocus(step.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;

    // 1. ENTER: Commit and Move Down (No splitting)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter(step.id);
      return;
    }

    // 2. BACKSPACE: Merge Up if empty
    if (e.key === 'Backspace') {
      if (value.length === 0) {
        e.preventDefault();
        onMergeUp(step.id);
      }
      // If text exists, let default behavior happen (delete character).
      // We do NOT merge text lines to prevent accidental messes.
      return;
    }

    // 3. ARROW UP: Navigate Up if at start
    if (e.key === 'ArrowUp') {
      if (selectionStart === 0 && selectionEnd === 0) {
        e.preventDefault();
        onNavigate(step.id, 'UP');
      }
      return;
    }

    // 4. ARROW DOWN: Navigate Down if at end
    if (e.key === 'ArrowDown') {
      if (selectionStart === value.length && selectionEnd === value.length) {
        e.preventDefault();
        onNavigate(step.id, 'DOWN');
      }
      return;
    }
  };

  const currentJobTitles = step.assignedJobTitles || (step.assignedJobTitle ? [step.assignedJobTitle] : []);
  const currentUserIds = step.assignedUserIds || (step.assignedUserId ? [step.assignedUserId] : []);
  const currentTeamIds = step.assignedTeamIds || [];
  const totalAssignees = currentJobTitles.length + currentUserIds.length + currentTeamIds.length;

  const typographyClasses = "w-full text-[16px] leading-relaxed py-0.5 min-h-[1.5em] whitespace-pre-wrap break-words border-none outline-none bg-transparent";

  return (
    <div className={`group flex gap-4 items-start relative py-3 rounded-xl transition-all ${isFocused && !effectiveReadOnly ? 'bg-slate-50/70 shadow-sm ring-1 ring-slate-100' : ''}`}>
      <div className="w-10 flex flex-col items-center shrink-0 pt-1">
        <span className={`text-[13px] font-black transition-colors ${isFocused && !effectiveReadOnly ? 'text-indigo-600' : 'text-indigo-500'}`}>{index + 1}.</span>
        {!effectiveReadOnly && isFocused && <button onClick={() => onRemove(step.id)} className="mt-4 p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>}
      </div>
      
      <div className="flex-1 pr-2 min-w-0">
        {!effectiveReadOnly && isFocused ? (
          <div className="relative">
            <textarea 
              ref={el => { stepRefs.current[step.id] = el; }} 
              value={step.text} 
              onFocus={() => onFocus(step.id)}
              onBlur={(e) => {
                const related = e.relatedTarget as HTMLElement;
                if (related?.closest('.smart-assign-palette') || related?.closest('.custom-select-dropdown')) return;
                onBlur();
              }}
              onChange={(e) => { onUpdate(step.id, { text: e.target.value }); adjustHeight(e.target); }} 
              onKeyDown={handleKeyDown}
              className={`${typographyClasses} ${step.style?.bold ? 'font-bold' : 'font-normal'} text-slate-800 overflow-hidden resize-none`} 
              rows={1} 
              autoFocus 
            />
            <div className="absolute left-0 -top-12 z-[100] flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-lg p-1">
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdate(step.id, { style: { ...step.style, bold: !step.style?.bold } })} className={`p-1.5 rounded hover:bg-slate-100 ${step.style?.bold ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}><Bold size={14} /></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-top-1">
                {currentJobTitles.map(title => <div key={title} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight shadow-sm">{title}<button onClick={() => onToggleAssignment('title', title)} className="text-indigo-300 hover:text-red-500"><X size={10} /></button></div>)}
                {currentTeamIds.map(teamId => <div key={teamId} className="bg-fuchsia-50 text-fuchsia-700 px-2 py-0.5 rounded-md border border-fuchsia-100 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight shadow-sm">{teamId}<button onClick={() => onToggleAssignment('team', teamId)} className="text-fuchsia-300 hover:text-red-500"><X size={10} /></button></div>)}
                {currentUserIds.map(userId => {
                  const u = activeUsers.find(au => au.id === userId);
                  return <div key={userId} className={`${u ? getUserColor(u.team) : 'bg-slate-50 text-slate-600'} px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight shadow-sm`}>{u?.firstName} {u?.lastName}<button onClick={() => onToggleAssignment('user', userId)} className="text-slate-300 hover:text-red-500"><X size={10} /></button></div>;
                })}
            </div>
          </div>
        ) : (
          <div 
            ref={viewModeRef}
            onMouseDown={handleViewClick} 
            className={`${typographyClasses} ${step.style?.bold ? 'font-bold' : 'font-normal'} text-slate-800 cursor-text`}
          >
            {step.text ? renderStyledText(step.text) : <span className="text-slate-200 italic">Describe action...</span>}
          </div>
        )}
      </div>

      <div className="w-12 shrink-0 flex flex-col items-center pt-0.5 self-stretch border-l border-slate-50 ml-1">
        <div className="relative">
          {!effectiveReadOnly && isFocused ? (
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => onSetShowPalette(showAssignPalette ? null : step.id)} 
              className={`p-1.5 rounded-lg transition-all relative ${totalAssignees > 0 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-indigo-600 hover:bg-white'}`}
            >
              <UserPlus size={14} />
              {totalAssignees > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-white">{totalAssignees}</span>}
            </button>
          ) : (
            <div className="p-1.5 relative group/assignee">
                <UserPlus size={14} className={`transition-colors ${totalAssignees > 0 ? 'text-indigo-400' : 'text-slate-100 group-hover:text-slate-200'}`} />
                {totalAssignees > 0 && (
                    <div className="absolute right-full mr-3 top-0 z-[500] pointer-events-none hidden group-hover/assignee:block">
                        <div className="bg-slate-900 text-white text-[10px] font-bold p-3 rounded-xl shadow-2xl whitespace-nowrap flex flex-col gap-1">
                            <div className="uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800 pb-1 mb-1">Assignees</div>
                            {currentJobTitles.map(t => <div key={t}>• {t} (Job)</div>)}
                            {currentTeamIds.map(t => <div key={t}>• {t} (Team)</div>)}
                            {currentUserIds.map(u => <div key={u}>• {activeUsers.find(au => au.id === u)?.firstName} (User)</div>)}
                        </div>
                    </div>
                )}
            </div>
          )}
          
          {!effectiveReadOnly && showAssignPalette && (
            <div className="smart-assign-palette absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] p-4 animate-in fade-in zoom-in-95 origin-top-right">
              <div className="mb-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">Job Titles</div>
                <div className="space-y-1">
                  {titleSuggestions.map(title => (
                    <button key={title} onMouseDown={(e) => e.preventDefault()} onClick={() => onToggleAssignment('title', title)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${currentJobTitles.includes(title) ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700'}`}>{title}{currentJobTitles.includes(title) && <CheckCircle2 size={12} />}</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={12} /> Teams</div>
                  <div className="space-y-1">
                    {availableTeams.map(team => (
                      <button key={team} onMouseDown={(e) => e.preventDefault()} onClick={() => onToggleAssignment('team', team)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${currentTeamIds.includes(team) ? 'bg-fuchsia-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-700'}`}>{team}{currentTeamIds.includes(team) && <CheckCircle2 size={12} />}</button>
                    ))}
                  </div>
                </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="relative mb-3"><Search className="absolute left-3 top-2.5 text-slate-300" size={14} /><input onMouseDown={(e) => e.stopPropagation()} value={searchQuery} onChange={(e) => onSetSearchQuery(e.target.value)} placeholder="Find individual..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all"/></div>
                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                  {activeUsers.filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(u => (
                    <button key={u.id} onMouseDown={(e) => e.preventDefault()} onClick={() => onToggleAssignment('user', u.id)} className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-medium flex items-center justify-between ${currentUserIds.includes(u.id) ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-50 text-slate-500'}`}>{u.firstName} {u.lastName}{currentUserIds.includes(u.id) && <CheckCircle2 size={12} className="text-indigo-600" />}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {!effectiveReadOnly && isFocused ? (
          <div className="mt-4 flex flex-col gap-1.5 p-1 bg-indigo-50/30 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-right-1">
             {StepTypeIcons.map(item => { const isActive = step.inputType === item.type; const Icon = item.icon; return (<button key={item.type} onMouseDown={(e) => e.preventDefault()} onClick={() => onUpdate(step.id, { inputType: item.type })} className={`p-1.5 rounded-md transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:text-indigo-600 hover:bg-white'}`} title={item.label}><Icon size={14} /></button>); })}
          </div>
        ) : (
          <div className="mt-4 h-full flex flex-col items-center opacity-10">{(() => { const item = StepTypeIcons.find(i => i.type === step.inputType) || StepTypeIcons[0]; const Icon = item.icon; return <Icon size={14} />; })()}</div>
        )}
      </div>
    </div>
  );
});