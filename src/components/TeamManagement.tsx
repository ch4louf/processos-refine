
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserPermissions, Team } from '../types';
import { Users, Plus, ShieldCheck, Zap, UserX, Crown, Eye, CheckSquare, CreditCard, Pencil, Lock, Search, RotateCcw, X, Check, MoreHorizontal, AlertCircle, Calendar, Shield, Mail, Briefcase, ChevronRight, Settings, ArrowUp, ArrowDown, CheckCircle2, Trash2, User as UserIcon, ShieldAlert, LayoutGrid, Palette, Hash } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { useUser } from '../contexts/UserContext';

interface TeamManagementProps {
  searchTerm: string; 
  setSearchTerm: (s: string) => void; 
  filterRole: string | null; 
  setFilterRole: (r: string | null) => void; 
  filterStatus: string | null; 
  setFilterStatus: (s: string | null) => void; 
  isFilterOpen: boolean; 
  setIsFilterOpen: (b: boolean) => void; 
  isSortOpen: boolean; 
  setIsSortOpen: (b: boolean) => void; 
  sortConfig: { key: string; direction: 'asc' | 'desc' }; 
  onSort: (key: any) => void; 
  activeHeaderMenu: string | null; 
  onToggleHeaderMenu: (m: string | null) => void; 
  onClearFilters: () => void;
}

const PermissionBadge: React.FC<{ icon: any, label: string, colorClass?: string, showLabel?: boolean }> = ({ icon: Icon, label, colorClass = "indigo", showLabel = true }) => {
    const styles = {
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        slate: "bg-slate-50 text-slate-600 border-slate-100",
    }[colorClass as "indigo" | "emerald" | "amber" | "slate"];

    return (
        <div className={`flex items-center gap-1.5 rounded-md border text-[9px] font-bold uppercase tracking-tight whitespace-nowrap shadow-sm transition-all ${styles} ${showLabel ? 'px-2 py-0.5' : 'p-1'}`} title={!showLabel ? label : ''}>
            <Icon size={showLabel ? 10 : 12} />
            {showLabel && label}
        </div>
    );
};

const PermissionToggle = ({ active, label, subLabel, icon: Icon, onClick, colorClass = 'indigo', isInherited = false, fullWidth = false, disabled = false }: { active: boolean, label: string, subLabel?: string, icon: any, onClick: () => void, colorClass?: string, isInherited?: boolean, fullWidth?: boolean, disabled?: boolean }) => {
    const activeStyles = { indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700', emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700', slate: 'bg-slate-50 border-slate-200 text-slate-700', amber: 'bg-amber-50 border-amber-200 text-amber-700' }[colorClass as 'indigo' | 'emerald' | 'slate' | 'amber'];
    const activeSwitchStyles = { indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', slate: 'bg-slate-600', amber: 'bg-amber-600' }[colorClass as 'indigo' | 'emerald' | 'slate' | 'amber'];

    return (
      <button 
        type="button" 
        onClick={disabled ? undefined : onClick} 
        disabled={disabled}
        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group relative ${fullWidth ? 'col-span-2' : ''} ${active ? activeStyles : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
          {isInherited && (
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-indigo-100 text-indigo-500 z-10" title="Permission inherited from Master Role">
                <Shield size={10} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Icon size={18} className={`shrink-0 ${isInherited ? 'animate-pulse' : ''}`} />
            <div className="flex flex-col">
              <span className="text-xs font-bold">{label}</span>
              {subLabel && <span className="text-[9px] opacity-70 font-medium leading-tight">{subLabel}</span>}
            </div>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${active ? activeSwitchStyles : 'bg-slate-200'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
      </button>
    );
};

const RoleCard = ({ 
  selected, 
  title, 
  icon: Icon, 
  colorClass, 
  onClick 
}: { 
  selected: boolean; 
  title: string; 
  icon: any; 
  colorClass: 'amber' | 'indigo' | 'slate'; 
  onClick: () => void 
}) => {
  const styles = {
    amber: selected ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-md ring-1 ring-amber-200' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50/50',
    indigo: selected ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-md ring-1 ring-indigo-200' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/50',
    slate: selected ? 'bg-slate-100 border-slate-300 text-slate-700 shadow-md ring-1 ring-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
  };

  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all w-full h-full ${styles[colorClass]}`}>
       <Icon size={20} className={selected ? '' : 'opacity-50'} />
       <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">{title}</span>
    </button>
  );
};

interface ConfirmationModalConfig {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning';
}

const TeamManagement: React.FC<TeamManagementProps> = ({ searchTerm, setSearchTerm, filterRole, setFilterRole, filterStatus, setFilterStatus, isFilterOpen, setIsFilterOpen, isSortOpen, setIsSortOpen, sortConfig, onSort, activeHeaderMenu, onToggleHeaderMenu, onClearFilters }) => {
  const { users: initialUsers, teams, currentUser, updateUsers: onUpdateUsers, inviteUser: onInviteUser, addTeam, updateTeam: onUpdateTeam, deleteTeam, getUserColor } = useUser();

  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'TEAMS'>('MEMBERS');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [activePanelUserId, setActivePanelUserId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<Partial<User>>({});
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', jobTitle: '', team: '' });
  const [newTeam, setNewTeam] = useState<Partial<Team>>({ name: '', description: '', color: 'indigo' });
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  // NEW: State for the unified confirmation modal
  const [confirmConfig, setConfirmConfig] = useState<ConfirmationModalConfig | null>(null);
  
  const filterRef = useRef<HTMLDivElement>(null);

  const defaultPerms: UserPermissions = {
    canDesign: false,
    canVerifyDesign: false,
    canExecute: false,
    canVerifyRun: false,
    canManageTeam: false,
    canAccessBilling: false
  };

  const panelUser = useMemo(() => initialUsers.find(u => u.id === activePanelUserId), [initialUsers, activePanelUserId]);
  const canManage = currentUser.permissions.canManageTeam;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (isFilterOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen, setIsFilterOpen]);

  // Derive Options from Explicit Teams
  const teamOptions = teams.map(t => ({ label: t.name, value: t.name }));
  const userOptions = initialUsers.filter(u => u.status === 'ACTIVE').map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u.id, subLabel: u.jobTitle }));
  
  const colorOptions = [
    { label: 'Indigo', value: 'indigo', color: 'bg-indigo-500' },
    { label: 'Emerald', value: 'emerald', color: 'bg-emerald-500' },
    { label: 'Amber', value: 'amber', color: 'bg-amber-500' },
    { label: 'Cyan (Tech)', value: 'cyan', color: 'bg-cyan-500' },
    { label: 'Slate', value: 'slate', color: 'bg-slate-500' },
    { label: 'Pink', value: 'pink', color: 'bg-pink-500' },
    { label: 'Blue', value: 'blue', color: 'bg-blue-500' },
    { label: 'Purple', value: 'purple', color: 'bg-purple-500' },
    { label: 'Gray', value: 'gray', color: 'bg-gray-500' },
    { label: 'Red', value: 'red', color: 'bg-red-500' },
  ];

  let filteredUsers = initialUsers.filter(u => (!searchTerm || `${u.firstName} ${u.lastName} ${u.team} ${u.email} ${u.jobTitle}`.toLowerCase().includes(searchTerm.toLowerCase())));
  
  filteredUsers.sort((a, b) => {
    let vA = '', vB = '';
    switch (sortConfig.key) { 
      case 'lastName': vA = a.lastName.toLowerCase(); vB = b.lastName.toLowerCase(); break; 
      case 'team': vA = a.team.toLowerCase(); vB = b.team.toLowerCase(); break; 
      case 'status': vA = a.status; vB = b.status; break; 
      default: vA = a.lastName.toLowerCase(); vB = b.lastName.toLowerCase(); 
    }
    if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
    return vA > vB ? (sortConfig.direction === 'asc' ? 1 : -1) : 0;
  });

  const activeFilterCount = (searchTerm ? 1 : 0);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!canManage) return;
    setInviteStatus('sending');
    setTimeout(() => { 
      const u: User = { 
        id: `u-${Date.now()}`, 
        ...newUser, 
        status: 'ACTIVE', 
        invitedAt: new Date().toISOString(), 
        permissions: { ...defaultPerms, canExecute: true }
      } as User;
      onInviteUser(u);
      setInviteStatus('sent'); 
      setTimeout(() => { 
        setIsInviteModalOpen(false); setInviteStatus('idle'); setNewUser({ firstName: '', lastName: '', email: '', jobTitle: '', team: '' }); 
      }, 800); 
    }, 1000);
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!canManage) return;
      if (newTeam.id) {
          // Edit Mode
          onUpdateTeam(newTeam as Team, teams.find(t => t.id === newTeam.id)?.name);
      } else {
          // Create Mode
          addTeam({ ...newTeam, id: `t-${Date.now()}` } as Team);
      }
      setIsTeamModalOpen(false);
      setNewTeam({ name: '', description: '', color: 'indigo' });
  };

  const handleDeleteTeam = (id: string) => {
      const team = teams.find(t => t.id === id);
      if (!team) return;
      
      const memberCount = initialUsers.filter(u => u.team === team.name).length;
      
      if (memberCount > 0) {
          alert(`Cannot delete team "${team.name}" because it has ${memberCount} members. Please reassign them first.`);
          return;
      }
      
      setConfirmConfig({
          isOpen: true,
          title: "Delete Team?",
          message: `Are you sure you want to delete ${team.name}? This action cannot be undone.`,
          confirmLabel: "Delete",
          variant: 'danger',
          onConfirm: () => {
              deleteTeam(id);
              setConfirmConfig(null);
          }
      });
  };

  const startInlineEdit = (user: User) => {
    if (!canManage) return;
    if (user.permissions.canManageTeam && !currentUser.permissions.canManageTeam) {
      alert("Access Denied: You cannot modify an Administrator.");
      return;
    }
    if (activePanelUserId) setActivePanelUserId(null);
    setInlineEditingId(user.id);
    setInlineForm({ ...user });
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineForm({});
  };

  const performUserUpdate = (userId: string, updatedData: User) => {
    onUpdateUsers(initialUsers.map(u => u.id === userId ? updatedData : u));
  };

  const saveInlineEdit = () => {
    if (!inlineEditingId) return;
    const original = initialUsers.find(u => u.id === inlineEditingId);
    if (!original) return;
    if (original.permissions.canManageTeam && !currentUser.permissions.canManageTeam) {
        alert("Access Denied: You cannot modify an Administrator.");
        cancelInlineEdit();
        return;
    }
    const updatedUser = { ...original, ...inlineForm } as User;
    
    // Check for status change to INACTIVE
    if (original.status === 'ACTIVE' && updatedUser.status === 'INACTIVE') {
        if (original.id === currentUser.id) {
            alert("Safety Lock: You cannot deactivate your own account.");
            return;
        }
        
        // Open Custom Confirmation Modal instead of window.confirm
        setConfirmConfig({
            isOpen: true,
            title: "Deactivate User?",
            message: `Are you sure you want to deactivate ${updatedUser.firstName}? They will immediately lose access to the platform and API keys will be revoked.`,
            confirmLabel: "Deactivate User",
            variant: 'danger',
            onConfirm: () => {
                performUserUpdate(inlineEditingId, updatedUser);
                setInlineEditingId(null);
                setInlineForm({});
                setConfirmConfig(null);
            }
        });
        return;
    }
    
    // Normal update (non-destructive)
    performUserUpdate(inlineEditingId, updatedUser);
    setInlineEditingId(null);
    setInlineForm({});
  };

  const toggleDeactivation = (userId: string) => {
    if (!canManage) return;
    const user = initialUsers.find(u => u.id === userId);
    if (!user) return;
    
    if (user.permissions.canManageTeam && !currentUser.permissions.canManageTeam) {
        alert("Cannot deactivate an Administrator.");
        return;
    }
    if (user.id === currentUser.id) {
        alert("Safety Lock: You cannot deactivate your own account.");
        return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    if (nextStatus === 'INACTIVE') {
        // Destructive Action: Show Modal
        setConfirmConfig({
            isOpen: true,
            title: `Deactivate ${user.firstName}?`,
            message: "This user will lose access immediately. Any active tasks assigned to them will remain, but they cannot log in.",
            confirmLabel: "Deactivate",
            variant: 'danger',
            onConfirm: () => {
                performUserUpdate(userId, { ...user, status: nextStatus });
                setConfirmConfig(null);
            }
        });
    } else {
        // Constructive Action: Immediate or subtle confirmation
        performUserUpdate(userId, { ...user, status: nextStatus });
    }
  };

  const handleRemoveUser = () => {
      if (!panelUser) return;
      if (panelUser.permissions.canManageTeam && !currentUser.permissions.canManageTeam) {
          alert("Access Denied: You cannot remove an Administrator.");
          return;
      }
      if (panelUser.id === currentUser.id) {
          alert("Safety Lock: You cannot remove your own account.");
          return;
      }

      setConfirmConfig({
          isOpen: true,
          title: "Remove User Permanently?",
          message: `You are about to delete ${panelUser.firstName} ${panelUser.lastName}. This action cannot be undone and will remove them from all historical audit logs display names.`,
          confirmLabel: "Delete User",
          variant: 'danger',
          onConfirm: () => {
            onUpdateUsers(initialUsers.filter(u => u.id !== panelUser.id));
            setActivePanelUserId(null);
            setConfirmConfig(null);
          }
      });
  };

  // PBAC REFACTOR: Role presets instead of AccessLevels
  const applyRolePreset = (preset: 'ADMIN' | 'STANDARD' | 'GUEST') => {
    if (!panelUser || !canManage) return;
    if (panelUser.permissions.canManageTeam && !currentUser.permissions.canManageTeam) {
        alert("Access Denied: You cannot modify an Administrator.");
        return;
    }
    if (panelUser.id === currentUser.id && preset !== 'ADMIN' && panelUser.permissions.canManageTeam) {
        alert("Safety Lock: You cannot remove your own Admin rights.");
        return;
    }

    let newPerms: UserPermissions;

    if (preset === 'ADMIN') {
        newPerms = { 
          canDesign: true, 
          canVerifyDesign: true, 
          canExecute: true, 
          canVerifyRun: true, 
          canManageTeam: true, 
          canAccessBilling: true 
        };
    } else if (preset === 'GUEST') {
        newPerms = { ...defaultPerms }; // All false
    } else {
        // Standard User Default
        newPerms = { 
          ...defaultPerms,
          canExecute: true // Basic standard capability
        };
    }
    
    performUserUpdate(panelUser.id, { ...panelUser, permissions: newPerms });
  };

  const togglePanelPermission = (key: keyof UserPermissions) => {
    if (!panelUser || !canManage) return;
    if (panelUser.permissions.canManageTeam && !currentUser.permissions.canManageTeam) {
         alert("Access Denied: Restricted to Administrators.");
         return;
    }
    
    if (panelUser.id === currentUser.id && key === 'canManageTeam' && panelUser.permissions.canManageTeam) {
        alert("Safety Lock: You cannot remove your own Team Management rights.");
        return;
    }

    let newPerms = { ...panelUser.permissions };
    newPerms[key] = !newPerms[key];
    
    performUserUpdate(panelUser.id, { ...panelUser, permissions: newPerms });
  };

  // Derived helpers for UI state
  const isPanelAdmin = panelUser?.permissions.canManageTeam && panelUser?.permissions.canAccessBilling;
  const isPanelGuest = panelUser && !Object.values(panelUser.permissions).some(Boolean);

  return (
    <div className="relative h-full flex flex-col">
      <div className="p-10 max-w-7xl mx-auto w-full h-full flex flex-col animate-in fade-in duration-500">
        
        {/* HEADER & CONTROLS */}
        <div className="flex items-center justify-between mb-8 relative z-30 h-16 shrink-0">
            <div className="flex-1 min-w-0 pr-4">
                <h1 className="text-3xl font-light text-slate-900 flex items-center gap-3 truncate"><Users className="text-indigo-500 shrink-0" /> Team Management</h1>
                <p className="text-slate-500 mt-1 text-sm truncate">Manage permissions and responsibility matrix.</p>
            </div>
            
            {/* VIEW SWITCHER */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                    <button 
                        onClick={() => setActiveTab('MEMBERS')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'MEMBERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Users size={14} /> Members
                    </button>
                    <button 
                        onClick={() => setActiveTab('TEAMS')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'TEAMS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid size={14} /> Teams
                    </button>
                </div>
            </div>

            <div className="flex-1 flex justify-end items-center gap-2 pl-4">
                {activeTab === 'MEMBERS' && (
                    <div className="relative w-48 mr-2">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Find member..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                )}
                {activeFilterCount > 0 && <button onClick={onClearFilters} className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"><RotateCcw size={14} /> Reset</button>}
                {canManage && (
                    <button onClick={() => activeTab === 'MEMBERS' ? setIsInviteModalOpen(true) : (setNewTeam({ name: '', description: '', color: 'indigo' }), setIsTeamModalOpen(true))} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 font-medium transition-colors shrink-0 animate-in fade-in">
                        <Plus size={18} /> {activeTab === 'MEMBERS' ? 'Invite' : 'Add Team'}
                    </button>
                )}
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative z-10">
            {activeTab === 'MEMBERS' ? (
                <>
                    <div className="grid grid-cols-12 gap-6 px-8 py-4 bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider select-none z-20 items-center">
                        <div className="col-span-3 cursor-pointer hover:text-indigo-600 flex items-center gap-1" onClick={() => onSort('lastName')}>Identity {sortConfig.key === 'lastName' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 cursor-pointer hover:text-indigo-600 flex items-center gap-1" onClick={() => onSort('team')}>Team {sortConfig.key === 'team' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                        <div className="col-span-2">Job Title</div>
                        <div className="col-span-2">Capabilities</div>
                        <div className="col-span-1 text-right">Action</div>
                    </div>
                    
                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1 custom-scrollbar">
                        {filteredUsers.length === 0 ? <div className="p-12 text-center text-slate-400 italic">No members found.</div> : filteredUsers.map(user => {
                            const p = user.permissions;
                            const activePerms: Array<{ icon: any, label: string, color: string }> = [];
                            if (p.canDesign) activePerms.push({ icon: Pencil, label: "Design", color: "indigo" });
                            if (p.canVerifyDesign) activePerms.push({ icon: ShieldCheck, label: "Publisher", color: "emerald" });
                            if (p.canExecute) activePerms.push({ icon: Zap, label: "Executor", color: "slate" });
                            if (p.canVerifyRun) activePerms.push({ icon: CheckSquare, label: "Validator", color: "emerald" });
                            if (p.canManageTeam) activePerms.push({ icon: Users, label: "Team Lead", color: "indigo" });
                            if (p.canAccessBilling) activePerms.push({ icon: CreditCard, label: "Billing", color: "amber" });

                            const isMonoPerm = activePerms.length === 1;
                            const isInlineEditing = inlineEditingId === user.id;
                            const isPanelActive = activePanelUserId === user.id;
                            const isAdmin = p.canManageTeam && p.canAccessBilling;
                            const isGuest = !Object.values(p).some(Boolean);
                            const canEdit = canManage && (!isAdmin || currentUser.permissions.canManageTeam);

                            return (
                                <div key={user.id} className={`grid grid-cols-12 gap-6 px-8 py-4 items-center transition-all group ${user.status === 'INACTIVE' && !isInlineEditing ? 'opacity-50 grayscale-[0.5]' : ''} ${isInlineEditing ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-100' : isPanelActive ? 'bg-indigo-50/20' : 'hover:bg-slate-50'}`}>
                                <div className="col-span-3 flex items-center gap-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm shrink-0 transition-transform ${isInlineEditing ? 'scale-90' : ''} ${getUserColor(user.team)}`}>{user.firstName[0]}{user.lastName[0]}</div>
                                    <div className="flex flex-col min-w-0 w-full">
                                        {isInlineEditing ? (
                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                                                <div className="flex gap-2"><input className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none" placeholder="First" value={inlineForm.firstName || ''} onChange={e => setInlineForm({...inlineForm, firstName: e.target.value})} /><input className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none" placeholder="Last" value={inlineForm.lastName || ''} onChange={e => setInlineForm({...inlineForm, lastName: e.target.value})} /></div>
                                                <input className="w-full text-[10px] border border-slate-300 rounded px-2 py-1 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none font-mono" placeholder="Email" value={inlineForm.email || ''} onChange={e => setInlineForm({...inlineForm, email: e.target.value})} />
                                            </div>
                                        ) : (
                                            <><div className="font-bold text-slate-900 truncate text-sm">{user.firstName} {user.lastName}</div><div className="text-[10px] text-slate-400 truncate font-medium flex items-center gap-1.5"><Mail size={10} /> {user.email}</div></>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    {isInlineEditing ? (
                                        <div className="w-32 animate-in fade-in zoom-in-95"><CustomSelect value={inlineForm.status} onChange={(val) => setInlineForm({...inlineForm, status: val as 'ACTIVE' | 'INACTIVE'})} options={[{ label: 'ACTIVE', value: 'ACTIVE', icon: CheckCircle2 }, { label: 'INACTIVE', value: 'INACTIVE', icon: UserX }]} variant="standard" className="text-xs"/></div>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{user.status}</span>
                                    )}
                                </div>
                                <div className="col-span-2 min-w-0 relative">
                                    {isInlineEditing ? (
                                        <div className="w-full animate-in fade-in zoom-in-95"><CustomSelect value={inlineForm.team} onChange={(newTeam) => setInlineForm({...inlineForm, team: newTeam})} options={teamOptions} variant="standard" placeholder="Team"/></div>
                                    ) : (
                                        <div className="truncate text-[10px] font-bold text-slate-500 pl-2">{user.team}</div>
                                    )}
                                </div>
                                <div className="col-span-2 truncate text-xs font-bold text-slate-600">
                                    {isInlineEditing ? (
                                        <div className="animate-in fade-in zoom-in-95"><input className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200" value={inlineForm.jobTitle || ''} onChange={e => setInlineForm({...inlineForm, jobTitle: e.target.value})} placeholder="Job Title" /></div>
                                    ) : user.jobTitle}
                                </div>
                                <div className="col-span-2 flex flex-wrap justify-start gap-1.5">
                                    {isAdmin ? <PermissionBadge icon={Crown} label="Admin" colorClass="amber" /> : isGuest ? <PermissionBadge icon={Eye} label="Viewer" colorClass="slate" /> : (
                                        <>{activePerms.slice(0, 2).map((perm, idx) => <PermissionBadge key={idx} icon={perm.icon} label={perm.label} colorClass={perm.color} showLabel={isMonoPerm} />)}{activePerms.length > 2 && <div className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200">+{activePerms.length - 2}</div>}{activePerms.length === 0 && <div className="text-[9px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-1"><Lock size={12} /> Read-only</div>}</>
                                    )}
                                </div>
                                <div className="col-span-1 text-right flex justify-end gap-1 relative">
                                    {canEdit ? (
                                        isInlineEditing ? (
                                            <div className="flex gap-1 animate-in slide-in-from-right-2 fade-in"><button onClick={saveInlineEdit} className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all"><Check size={16} /></button><button onClick={cancelInlineEdit} className="p-1.5 text-slate-400 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all"><X size={16} /></button></div>
                                        ) : (
                                            <div className="flex gap-1"><button onClick={() => startInlineEdit(user)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all" title="Quick Edit"><Pencil size={16} /></button><button onClick={() => setActivePanelUserId(user.id)} className={`p-1.5 border border-transparent hover:border-indigo-100 rounded-lg transition-all ${isPanelActive ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`} title="Full Settings"><Settings size={16} /></button></div>
                                        )
                                    ) : <Lock size={14} className="text-slate-200 p-1.5" />}
                                </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-12 gap-6 px-8 py-4 bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider select-none z-20 items-center">
                        <div className="col-span-3">Team Name</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Team Lead</div>
                        <div className="col-span-2 text-center">Headcount</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1 custom-scrollbar">
                        {teams.map(team => {
                            const lead = initialUsers.find(u => u.id === team.leadUserId);
                            const memberCount = initialUsers.filter(u => u.team === team.name).length;
                            
                            return (
                                <div key={team.id} className="grid grid-cols-12 gap-6 px-8 py-6 items-center hover:bg-slate-50 transition-colors group">
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-[10px] font-bold uppercase shadow-sm ${getUserColor(team.name)}`}>
                                            {team.name.substring(0, 2)}
                                        </div>
                                        <div className="font-bold text-slate-900 text-sm">{team.name}</div>
                                    </div>
                                    <div className="col-span-3 text-xs text-slate-500 truncate pr-4">
                                        {team.description}
                                    </div>
                                    <div className="col-span-2">
                                        {lead ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${getUserColor(lead.team)}`}>{lead.firstName[0]}{lead.lastName[0]}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-700">{lead.firstName} {lead.lastName}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 italic">No lead assigned</span>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">{memberCount} Members</span>
                                    </div>
                                    <div className="col-span-2 text-right flex justify-end gap-2">
                                        <button onClick={() => { setNewTeam(team); setIsTeamModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-lg transition-all"><Pencil size={14} /></button>
                                        <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-white border border-transparent hover:border-red-100 rounded-lg transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
      </div>

      {isTeamModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 flex flex-col overflow-visible">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                <h3 className="font-bold text-slate-900 flex items-center gap-3">{newTeam.id ? 'Edit Team' : 'New Team'}</h3>
                <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleTeamSubmit} className="p-8 space-y-4">
              <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Team Name</label>
                  <input required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50" placeholder="e.g. Engineering" value={newTeam.name} onChange={(e) => setNewTeam({...newTeam, name: e.target.value})} />
              </div>
              <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
                  <input required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50" placeholder="e.g. Development and QA" value={newTeam.description} onChange={(e) => setNewTeam({...newTeam, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Color Theme</label>
                    <CustomSelect value={newTeam.color} onChange={(val) => setNewTeam({...newTeam, color: val as any})} options={colorOptions} icon={Palette} variant="standard" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Team Lead</label>
                    <CustomSelect value={newTeam.leadUserId} onChange={(val) => setNewTeam({...newTeam, leadUserId: val})} options={userOptions} icon={UserIcon} variant="standard" searchable placeholder="Select..." />
                  </div>
              </div>
              <div className="pt-6">
                  <button type="submit" className="w-full bg-indigo-600 text-white rounded-xl py-4 font-black text-xs uppercase tracking-widest shadow-xl">{newTeam.id ? 'Save Changes' : 'Create Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
