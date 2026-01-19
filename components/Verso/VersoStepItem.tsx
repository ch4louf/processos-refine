
import React from 'react';
import { CheckSquare, Info, Lock, AlertCircle, CheckCircle2, FileText, Eye, Trash2, Loader2, UploadCloud, MessageSquarePlus, ShieldAlert, MessageSquare } from 'lucide-react';
import { ProcessStep, StepType, StepFeedback } from '../../types';

interface VersoStepItemProps {
  step: ProcessStep;
  idx: number;
  status: 'COMPLETED' | 'BLOCKED' | 'PENDING';
  locked: boolean;
  isReadOnly: boolean;
  canInteract: boolean;
  isAutomatedStep: boolean;
  isInfoStep: boolean;
  isFocused: boolean;
  stepValue: any;
  uploading: boolean;
  feedbacks: StepFeedback[];
  renderStyledText: (text: string) => React.ReactNode;
  onToggle: (id: string, idx: number) => void;
  onTextChange: (id: string, val: string, locked: boolean) => void;
  onTextKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onTextFocus: (id: string) => void;
  onTextBlur: (id: string, locked: boolean) => void;
  onFileUpload: (id: string, file: File, locked: boolean) => void;
  onFileRemove: (id: string) => void;
  onAddFeedback: (id: string) => void;
  onResolveFeedback: (stepId: string, fbId: string) => void;
  textAreaRef: (el: HTMLTextAreaElement | null) => void;
}

export const VersoStepItem: React.FC<VersoStepItemProps> = ({
  step, idx, status, locked, isReadOnly, canInteract, isAutomatedStep, isInfoStep, isFocused,
  stepValue, uploading, feedbacks, renderStyledText, onToggle, onTextChange, onTextKeyDown,
  onTextFocus, onTextBlur, onFileUpload, onFileRemove, onAddFeedback, onResolveFeedback, textAreaRef
}) => {
  const isCompleted = status === 'COMPLETED';

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 ${status === 'COMPLETED' ? 'border-indigo-100 bg-indigo-50/10' : status === 'BLOCKED' ? 'border-red-200 shadow-sm' : locked ? 'border-slate-100 bg-slate-50/50 opacity-80' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
        <div className="p-6 flex gap-6">
            <div className="pt-1 shrink-0">
                {isInfoStep ? (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-500 cursor-default border border-indigo-100">
                        <Info size={18} />
                    </div>
                ) : (
                    <button 
                        disabled={isReadOnly || isAutomatedStep || !canInteract}
                        onClick={() => onToggle(step.id, idx)}
                        title={locked ? "Sequential enforcement: Complete previous tasks first." : !canInteract ? "You do not have permission to execute this step." : ""}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            status === 'COMPLETED' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 border border-transparent' : 
                            locked ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-transparent' :
                            !canInteract ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200 opacity-50' :
                            status === 'BLOCKED' ? 'bg-red-100 text-red-500 cursor-not-allowed border border-transparent' :
                            isAutomatedStep ? 'bg-slate-50 text-slate-300 cursor-default border border-slate-200' :
                            'bg-white border-2 border-slate-200 text-transparent hover:border-indigo-400'
                        }`}
                    >
                        {status === 'COMPLETED' ? <CheckSquare size={18} /> : 
                            locked ? <Lock size={14} /> : 
                            status === 'BLOCKED' ? <AlertCircle size={18} /> : 
                            null}
                    </button>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className={`text-lg font-medium leading-relaxed transition-colors ${
                            status === 'COMPLETED' ? 'text-slate-500 line-through decoration-slate-300' : 
                            isInfoStep ? 'text-indigo-900 italic' : 
                            locked ? 'text-slate-400' : 'text-slate-900'
                        }`}>
                            {renderStyledText(step.text)}
                            {step.required && !isInfoStep && <span className="text-red-400 ml-1.5 text-xs align-top">*</span>}
                        </h3>
                        
                        {step.inputType === StepType.TEXT_INPUT && (
                            <div className="mt-4 max-w-lg relative">
                                <textarea 
                                    ref={textAreaRef}
                                    disabled={isReadOnly || !canInteract}
                                    value={stepValue || ''}
                                    onChange={(e) => onTextChange(step.id, e.target.value, !canInteract)}
                                    onKeyDown={(e) => onTextKeyDown(e, step.id)}
                                    onFocus={() => onTextFocus(step.id)}
                                    onBlur={() => onTextBlur(step.id, !canInteract)}
                                    rows={1}
                                    title={locked && !isCompleted ? "Complete previous steps to unlock." : !canInteract ? "Permission required." : ""}
                                    placeholder={locked && !isCompleted ? "Locked" : !canInteract ? "Restricted" : "Enter details..."}
                                    className={`w-full py-2 border-b-2 outline-none resize-none transition-all duration-300 text-sm font-bold ${
                                        status === 'COMPLETED' && !isFocused
                                            ? 'bg-transparent border-indigo-100 text-indigo-700 h-10 overflow-hidden whitespace-nowrap text-ellipsis' 
                                            : (locked && !isCompleted) || !canInteract
                                                ? 'bg-slate-50 border-transparent text-slate-400 cursor-not-allowed placeholder:text-slate-300' 
                                                : isFocused 
                                                    ? 'bg-transparent border-indigo-600 text-slate-900 shadow-sm min-h-[5rem]' 
                                                    : 'bg-transparent border-slate-200 text-slate-900 h-10 overflow-hidden whitespace-nowrap text-ellipsis'
                                    }`}
                                />
                                {status === 'COMPLETED' && !isFocused && (
                                    <div className="absolute right-0 top-2 pointer-events-none">
                                        <CheckCircle2 size={16} className="text-indigo-400" />
                                    </div>
                                )}
                                {isFocused && (
                                    <div className="absolute right-0 bottom-2 text-[10px] font-bold text-slate-300 uppercase tracking-wide pointer-events-none animate-in fade-in">
                                        Press Enter to Save
                                    </div>
                                )}
                            </div>
                        )}

                        {step.inputType === StepType.FILE_UPLOAD && (
                            <div className="mt-4 w-full">
                                {stepValue ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between group/file">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{stepValue.name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                                    <span>{stepValue.size}</span>
                                                    <span>•</span>
                                                    <span>Uploaded by {stepValue.uploaderName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a href={stepValue.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="View Document"><Eye size={18} /></a>
                                            {!isReadOnly && canInteract && (
                                                <button onClick={(e) => { e.preventDefault(); onFileRemove(step.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all relative z-10" title="Remove File"><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        title={locked ? "Complete previous steps to unlock upload." : !canInteract ? "Permission required." : ""}
                                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${locked || !canInteract ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-60' : uploading ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
                                    >
                                        {uploading ? (
                                            <div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-indigo-600" size={24} /><span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Uploading...</span></div>
                                        ) : (
                                            <>
                                                <UploadCloud className={`${locked || !canInteract ? 'text-slate-200' : 'text-slate-300'} mb-3`} size={32} />
                                                <label className={`cursor-pointer ${isReadOnly || !canInteract ? 'pointer-events-none' : ''}`}>
                                                    <span className={`text-sm font-bold block ${locked || !canInteract ? 'text-slate-300' : 'text-slate-600'}`}>Click to upload evidence</span>
                                                    <span className="text-xs text-slate-400 block mt-1">PDF, PNG, JPG (Max 10MB)</span>
                                                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFileUpload(step.id, e.target.files[0], !canInteract)} disabled={isReadOnly || !canInteract}/>
                                                </label>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {(!isReadOnly || feedbacks.length > 0) && (
                            <button onClick={() => onAddFeedback(step.id)} className={`p-2 rounded-xl transition-all ${feedbacks.length > 0 ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'text-slate-200 hover:text-slate-400 hover:bg-slate-50'}`}><MessageSquarePlus size={18} /></button>
                        )}
                    </div>
                </div>
                
                {feedbacks.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {feedbacks.map(fb => (
                            <div key={fb.id} className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${fb.type === 'BLOCKER' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                <div className="mt-0.5">{fb.type === 'BLOCKER' ? <ShieldAlert size={14} /> : <MessageSquare size={14} />}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1"><span className="font-bold">{fb.userName}</span><span className="opacity-50 text-[10px]">{new Date(fb.createdAt).toLocaleTimeString()}</span></div>
                                    <p>{fb.text}</p>
                                </div>
                                {!fb.resolved && !isReadOnly && <button onClick={() => onResolveFeedback(step.id, fb.id)} className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors text-[10px] font-bold uppercase tracking-wider">Resolve</button>}
                                {fb.resolved && <div className="text-emerald-600 flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 size={12} /> Resolved</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
