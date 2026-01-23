import React, { useState, useRef, useEffect } from 'react';
import { ProcessDefinition, ProcessStep } from '../types';
import { RefreshCw, X, CheckCircle2, AlertTriangle, Clock, ScrollText, ChevronDown } from 'lucide-react';
import { getExpirationDate, getDaysUntilExpiration, FreshnessStatus, calculateStatus } from '../services/governance';

interface ProcessRefreshModalProps {
  process: ProcessDefinition;
  onClose: () => void;
  onConfirm: () => void;
}

const ProcessRefreshModal: React.FC<ProcessRefreshModalProps> = ({ process, onClose, onConfirm }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const freshnessStatus = calculateStatus(process);
  const daysUntilExpiration = getDaysUntilExpiration(process);
  const expirationDate = getExpirationDate(process);

  // Track scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Consider "scrolled to bottom" when within 50px of bottom
    if (scrollHeight - scrollTop - clientHeight < 50) {
      setHasScrolledToBottom(true);
    }
  };

  // Auto-check if content is short enough to not need scrolling
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const { scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight <= clientHeight) {
      setHasScrolledToBottom(true);
    }
  }, [process.steps]);

  const canConfirm = hasScrolledToBottom && isConfirmed;

  const getStatusColor = (status: FreshnessStatus) => {
    switch (status) {
      case 'EXPIRED': return 'text-red-600 bg-red-50 border-red-200';
      case 'DUE_SOON': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getStatusLabel = (status: FreshnessStatus) => {
    switch (status) {
      case 'EXPIRED': return 'EXPIRED';
      case 'DUE_SOON': return 'DUE SOON';
      default: return 'CURRENT';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-300 border border-white/20 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-slate-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
              <RefreshCw size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Review & Refresh Process</h3>
              <p className="text-xs text-slate-500 mt-0.5">Confirm this process is still accurate and up-to-date</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white/80 rounded-xl">
            <X size={24} />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`px-8 py-4 border-b flex items-center gap-4 shrink-0 ${getStatusColor(freshnessStatus)}`}>
          {freshnessStatus === 'EXPIRED' ? (
            <AlertTriangle size={20} />
          ) : freshnessStatus === 'DUE_SOON' ? (
            <Clock size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <div className="flex-1">
            <div className="font-bold text-sm uppercase tracking-wider">{getStatusLabel(freshnessStatus)}</div>
            <div className="text-xs opacity-80">
              {freshnessStatus === 'EXPIRED' 
                ? `Expired ${Math.abs(daysUntilExpiration)} days ago`
                : freshnessStatus === 'DUE_SOON'
                ? `Expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString()})`
                : `Valid until ${expirationDate.toLocaleDateString()}`
              }
            </div>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
            Last reviewed: {new Date(process.lastReviewedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Process Content - Scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 shrink-0 flex items-center gap-2">
            <ScrollText size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Process Steps ({process.steps.length})
            </span>
            {!hasScrolledToBottom && (
              <span className="ml-auto text-[10px] font-bold text-indigo-500 uppercase tracking-wider animate-pulse flex items-center gap-1">
                <ChevronDown size={14} /> Scroll to review all steps
              </span>
            )}
          </div>
          
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-8 py-6 space-y-3 custom-scrollbar"
          >
            {/* Process Title & Description */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h4 className="font-bold text-slate-900 text-lg">{process.title}</h4>
              {process.description && (
                <p className="text-sm text-slate-500 mt-2 italic">{process.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                <span>Category: <strong className="text-slate-600">{process.category}</strong></span>
                <span>•</span>
                <span>Version {process.versionNumber}</span>
                <span>•</span>
                <span>Review every {Math.round(process.review_frequency_days / 30)} months</span>
              </div>
            </div>

            {/* Steps List */}
            {process.steps.sort((a, b) => a.orderIndex - b.orderIndex).map((step, idx) => (
              <div 
                key={step.id}
                className="flex items-start gap-4 py-3 px-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-relaxed">{step.text || <span className="italic text-slate-400">Empty step</span>}</p>
                  {(step.assignedJobTitles?.length || step.assignedUserIds?.length || step.assignedTeamIds?.length) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {step.assignedJobTitles?.map(title => (
                        <span key={title} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-md">
                          {title}
                        </span>
                      ))}
                      {step.assignedTeamIds?.map(team => (
                        <span key={team} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-medium rounded-md">
                          {team}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[9px] font-bold text-slate-300 uppercase shrink-0">
                  {step.inputType}
                </div>
              </div>
            ))}

            {/* Bottom spacer to ensure scroll works */}
            <div className="h-4" />
          </div>
        </div>

        {/* Confirmation Section */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-5">
          {/* Checkbox */}
          <label 
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              isConfirmed 
                ? 'border-indigo-500 bg-indigo-50' 
                : hasScrolledToBottom 
                ? 'border-slate-200 bg-white hover:border-indigo-300' 
                : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => hasScrolledToBottom && setIsConfirmed(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="w-5 h-5 rounded-md border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
            />
            <div>
              <div className={`font-bold text-sm ${isConfirmed ? 'text-indigo-700' : 'text-slate-700'}`}>
                I confirm this process is accurate and up-to-date
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                By confirming, you acknowledge that all steps, assignees, and governance settings have been reviewed and remain valid.
              </p>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              disabled={!canConfirm}
              onClick={onConfirm}
              className="px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Confirm Review
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProcessRefreshModal;
