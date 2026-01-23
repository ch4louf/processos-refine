
import React, { useState } from 'react';
import { Settings, Shield, AlertTriangle, Lock, Unlock, Info, CheckCircle2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface WorkspaceSettingsProps {}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = () => {
  const { workspace, updateWorkspace, currentUser } = useUser();
  
  // Local state for settings - default to false (not blocking)
  const [blockRunsOnExpired, setBlockRunsOnExpired] = useState(
    (workspace.settings as any)?.blockRunsOnExpired ?? false
  );
  const [blockNewRunsOnExpired, setBlockNewRunsOnExpired] = useState(
    (workspace.settings as any)?.blockNewRunsOnExpired ?? false
  );

  const handleSaveSettings = () => {
    updateWorkspace({
      ...workspace,
      settings: {
        ...(workspace.settings || {}),
        blockRunsOnExpired,
        blockNewRunsOnExpired,
      }
    });
  };

  const isAdmin = currentUser.permissions.canAccessWorkspace;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-10 h-24 flex items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Settings size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
            <p className="text-sm text-slate-500">Configure global workspace policies and governance rules</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Process Freshness Enforcement Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Process Freshness Enforcement</h2>
                <p className="text-xs text-slate-500">Control how the system handles outdated process definitions</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Block new runs on expired */}
              <div className="flex items-start justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${blockNewRunsOnExpired ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    {blockNewRunsOnExpired ? <Lock size={18} className="text-red-600" /> : <Unlock size={18} className="text-emerald-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Block New Run Launches</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      When enabled, users cannot launch new runs for processes that have an <strong className="text-red-600">EXPIRED</strong> freshness status. 
                      This ensures teams review and refresh processes before continuing operations.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <Info size={12} className="text-slate-400" />
                      <span className="text-slate-400">Recommended for compliance-critical workspaces</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBlockNewRunsOnExpired(!blockNewRunsOnExpired)}
                  disabled={!isAdmin}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 shrink-0 ${
                    blockNewRunsOnExpired ? 'bg-red-500' : 'bg-slate-300'
                  } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                    blockNewRunsOnExpired ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Block in-progress runs on expired */}
              <div className="flex items-start justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${blockRunsOnExpired ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    {blockRunsOnExpired ? <Lock size={18} className="text-amber-600" /> : <Unlock size={18} className="text-emerald-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Block In-Progress Runs</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      When enabled, runs that are currently in progress will be paused and cannot continue execution 
                      if their underlying process becomes <strong className="text-amber-600">EXPIRED</strong>.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span className="text-amber-600 font-medium">Warning: May disrupt ongoing operations</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBlockRunsOnExpired(!blockRunsOnExpired)}
                  disabled={!isAdmin}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 shrink-0 ${
                    blockRunsOnExpired ? 'bg-amber-500' : 'bg-slate-300'
                  } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                    blockRunsOnExpired ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Info Box */}
              <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-4">
                <Shield size={24} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Governance Impact</h4>
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    These settings enforce the Process Freshness System at the workspace level. When processes become 
                    outdated, designated Editors and Publishers will receive notifications to refresh the content. 
                    Blocking runs ensures that only up-to-date, validated procedures are executed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={!isAdmin}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${
                isAdmin 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={18} />
              Save Changes
            </button>
          </div>

          {/* Admin Notice */}
          {!isAdmin && (
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4">
              <Shield size={24} className="text-red-500" />
              <p className="text-sm text-red-700">
                <strong>Admin Required:</strong> Only users with <code className="px-1.5 py-0.5 bg-red-100 rounded text-xs font-mono">canAccessWorkspace</code> permission can modify these settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
