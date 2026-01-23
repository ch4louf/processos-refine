
import React from 'react';
import { Pencil, RotateCcw, Info, UserCircle, LayoutGrid, Briefcase, Users } from 'lucide-react';
import { User, ProcessDefinition } from '../../types';
import CustomSelect from '../CustomSelect';

interface GovernanceUnitProps {
  role: 'PUBLISHER' | 'RUN_VALIDATOR' | 'EDITOR' | 'EXECUTOR';
  configPrefix: 'publisher' | 'run_validator' | 'editor' | 'executor';
  user: User;
  local: ProcessDefinition;
  isActive: boolean;
  canDelegate: boolean;
  effectiveReadOnly: boolean;
  getUserColor: (team: string) => string;
  onSetTarget: (role: any) => void;
  onDelegate: (type: 'user' | 'team' | 'title', value: string) => void;
  onReset: (role: any) => void;
  userOptions: any[];
  categoryOptions: any[];
  titleOptions: any[];
}

export const GovernanceUnit: React.FC<GovernanceUnitProps> = ({
  role, configPrefix, user, local, isActive, canDelegate, effectiveReadOnly, 
  getUserColor, onSetTarget, onDelegate, onReset, userOptions, categoryOptions, titleOptions
}) => {
  // SPLIT BRAIN LOGIC VISUALIZATION:
  // 1. Doers (Editor/Executor) default to Team. So if Team == Category, it's NOT delegated.
  // 2. Approvers (Publisher/Validator) default to Lead (undefined). So if Team == Category, it IS delegated (away from Lead).
  
  const isDoer = role === 'EDITOR' || role === 'EXECUTOR';
  const assignedTeamId = local[`${configPrefix}_team_id`];
  
  const isDelegated = !!(
      local[`${configPrefix}_user_id`] || 
      local[`${configPrefix}_job_title`] || 
      (assignedTeamId && (isDoer ? assignedTeamId !== local.category : true))
  );

  const isTeamAuthority = !!local[`${configPrefix}_team_id`];
  const targetTeamName = local[`${configPrefix}_team_id`] || local.category;

  if (isActive) {
    return (
      <div className="p-3 bg-white border border-indigo-200 shadow-sm rounded-xl ring-1 ring-indigo-50 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Assign {role}</span>
        </div>
        <div className="space-y-2">
          <div className="space-y-0.5">
            <label className="text-[8px] font-bold text-slate-400 uppercase px-1">By Specific User</label>
            <CustomSelect value={null} onChange={(val) => onDelegate('user', val)} options={userOptions} disabled={effectiveReadOnly} searchable icon={UserCircle} placeholder="Select User..." className="bg-slate-50 text-xs" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[8px] font-bold text-slate-400 uppercase px-1">By Team (Any Member)</label>
            <CustomSelect value={null} onChange={(val) => onDelegate('team', val)} options={categoryOptions} disabled={effectiveReadOnly} searchable icon={LayoutGrid} placeholder="Select Team..." className="bg-slate-50 text-xs" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[8px] font-bold text-slate-400 uppercase px-1">By Job Title</label>
            <CustomSelect value={null} onChange={(val) => onDelegate('title', val)} options={titleOptions} disabled={effectiveReadOnly} searchable icon={Briefcase} placeholder="Select Title..." className="bg-slate-50 text-xs" />
          </div>
        </div>
        <button onClick={() => onSetTarget(null)} className="w-full text-center text-[10px] text-slate-400 hover:text-slate-600 font-bold mt-2 py-1 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
      </div>
    );
  }

  const cardBaseStyles = isDelegated 
    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50' 
    : 'bg-slate-50 border-slate-200 hover:border-slate-300';

  return (
    <div className={`group relative p-2.5 rounded-xl border transition-all ${cardBaseStyles}`}>
      <div className="flex items-center gap-3">
        {isTeamAuthority ? (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getUserColor(targetTeamName)}`}>
              <Users size={16} />
            </div>
        ) : (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getUserColor(user.team)}`}>
                {user.firstName[0]}{user.lastName[0]}
            </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-900 truncate leading-tight">
            {isTeamAuthority ? targetTeamName : `${user.firstName} ${user.lastName}`}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
              {!isTeamAuthority && (
                  <div className={`text-[8px] font-black uppercase tracking-tight flex items-center gap-1 px-1 py-0.5 rounded ${getUserColor(user.team).replace('bg-', 'bg-opacity-20 text-opacity-100 text-')}`}>
                      <LayoutGrid size={8} /> {user.team.toUpperCase()}
                  </div>
              )}
          </div>
          <div className="text-[10px] text-slate-600 font-semibold truncate mt-0.5 flex items-center gap-1">
            {isTeamAuthority ? 'Any Member' : <><Briefcase size={10} /> {user.jobTitle}</>}
          </div>
        </div>
        {canDelegate && (
          <div className="flex items-center gap-1 self-start">
            {isDelegated ? (
              <div className="relative group/action">
                  <button onClick={() => onReset(role)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><RotateCcw size={12} /></button>
                  <div className="absolute top-full right-0 mt-1 z-50 opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap relative">
                          <div className="absolute -top-1 right-2.5 w-2 h-2 bg-slate-900 rotate-45"></div>
                          Reset to Default
                      </div>
                  </div>
              </div>
            ) : (
              <div className="relative group/action">
                  <button onClick={() => onSetTarget(role)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"><Pencil size={12} /></button>
                  <div className="absolute top-full right-0 mt-1 z-50 opacity-0 group-hover/action:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap relative">
                          <div className="absolute -top-1 right-2.5 w-2 h-2 bg-slate-900 rotate-45"></div>
                          Change {role}
                      </div>
                  </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
