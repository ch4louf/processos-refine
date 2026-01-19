
import React, { useState } from 'react';
import { ProcessDefinition } from '../types';
import { Play, X, Info, Calendar } from 'lucide-react';

interface RunProcessModalProps {
  process: ProcessDefinition;
  activeRunsCount: number;
  onClose: () => void;
  onConfirm: (runName: string) => void;
}

const RunProcessModal: React.FC<RunProcessModalProps> = ({ process, activeRunsCount, onClose, onConfirm }) => {
  const getDefaultName = () => {
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${process.title} - ${month} ${year}`;
  };

  const [runName, setRunName] = useState(getDefaultName());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden scale-100 animate-in zoom-in-95 duration-300 border border-white/20">
        
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Play size={18} fill="currentColor" />
            </div>
            Execute Run
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
            
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Target Process Template</label>
                <div className="text-base font-bold text-slate-900">{process.title}</div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Run Name</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={runName}
                        onChange={(e) => setRunName(e.target.value)}
                        className="w-full border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all bg-slate-50/50 font-bold text-slate-900"
                        placeholder="e.g. Q4 Audit - Dept. X"
                        autoFocus
                    />
                    <Calendar className="absolute left-4 top-3.5 text-slate-300" size={18} />
                </div>
                <p className="text-[11px] text-slate-400 mt-3 italic">
                    Use a unique identifier (Date, ID, Client) for precise audit retrieval.
                </p>
            </div>

            <div className="p-5 rounded-2xl text-sm bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-start gap-3">
                    <Info size={20} className="text-indigo-500 shrink-0" />
                    <div>
                        <div className="font-bold text-indigo-900 text-xs">
                            Concurrency Note
                        </div>
                        <p className="text-[11px] mt-1 text-indigo-700/70 leading-relaxed">
                            There are currently <strong>{activeRunsCount}</strong> active runs of this process. This new run will be isolated in the audit trail.
                        </p>
                    </div>
                </div>
            </div>

        </div>

        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex justify-end gap-4">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest"
            >
                Cancel
            </button>
            <button 
                disabled={!runName.trim()}
                onClick={() => onConfirm(runName)}
                className="px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
                Launch Run
            </button>
        </div>

      </div>
    </div>
  );
};

export default RunProcessModal;
