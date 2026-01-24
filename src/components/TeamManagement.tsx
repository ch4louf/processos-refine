
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserPermissions, Team } from '../types';
import { Users, Plus, ShieldCheck, Zap, UserX, Crown, Eye, CheckSquare, CreditCard, Pencil, Lock, Search, RotateCcw, X, Check, Mail, Settings, ArrowUp, ArrowDown, CheckCircle2, Trash2, User as UserIcon, ShieldAlert, LayoutGrid, Palette, Shield, FileText, Download, Calendar } from 'lucide-react';
import CustomSelect from './CustomSelect';
import ColumnHeaderFilter from './ui/ColumnHeaderFilter';
import { useUser } from '../contexts/UserContext';
import { useUI } from '../contexts/UIContext';

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

// FIXED: Always square, uniform size (28px) for perfect alignment - or expanded with label
const PermissionBadge: React.FC<{ icon: any, label: string, colorClass?: string, showLabel?: boolean }> = ({ icon: Icon, label, colorClass = "indigo", showLabel = false }) => {
    const styles = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
        slate: "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100",
    }[colorClass as "indigo" | "emerald" | "amber" | "slate"];

    if (showLabel) {
        return (
            <div 
                className={`flex items-center gap-1.5 rounded-lg border shadow-sm transition-all cursor-help h-7 px-2 shrink-0 ${styles}`} 
                title={label}
            >
                <Icon size={14} strokeWidth={2.5} />
                <span className="text-[10px] font-bold">{label}</span>
            </div>
        );
    }

    return (
        <div 
            className={`flex items-center justify-center rounded-lg border shadow-sm transition-all cursor-help w-7 h-7 shrink-0 ${styles}`} 
            title={label}
        >
            <Icon size={14} strokeWidth={2.5} />
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
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${fullWidth ? 'col-span-2' : ''} ${active ? activeStyles : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="shrink-0">
                <Icon size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">{label}</span>
              {subLabel && <span className="text-[9px] opacity-70 font-medium leading-tight truncate">{subLabel}</span>}
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${active ? activeSwitchStyles : 'bg-slate-200'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
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
  const { showToast } = useUI();

  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'TEAMS'>('MEMBERS');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [activePanelUserId, setActivePanelUserId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<Partial<User>>({});
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', jobTitle: '', team: '' });
  const [newTeam, setNewTeam] = useState<Partial<Team>>({ name: '', description: '', color: 'indigo' });
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [confirmConfig, setConfirmConfig] = useState<ConfirmationModalConfig | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // --- AUDIT EXPORT STATE ---
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditConfig, setAuditConfig] = useState({
      includeMatrix: true,
      historyDuration: '90', // days
      recipientEmail: ''
  });
  const [isSendingAudit, setIsSendingAudit] = useState(false);

  const defaultPerms: UserPermissions = {
    canDesignProcess: false,
    canPublishProcess: false,
    canExecuteRun: false,
    canValidateRun: false,
    canManageTeam: false,
    canAccessBilling: false,
    canAccessWorkspace: false
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

  const durationOptions = [
      { label: 'Last 24 Hours', value: '1' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 90 Days (Quarterly)', value: '90' },
      { label: 'Last 1 Year', value: '365' },
      { label: 'All Time', value: 'all' }
  ];

  // Compute unique values for column filters
  const uniqueTeams = useMemo(() => [...new Set(initialUsers.map(u => u.team))].sort(), [initialUsers]);
  const uniqueJobTitles = useMemo(() => [...new Set(initialUsers.map(u => u.jobTitle).filter(Boolean))].sort(), [initialUsers]);
  const statusOptions = ['ACTIVE', 'INACTIVE'];

  // Local column filters
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [filterJobTitle, setFilterJobTitle] = useState<string | null>(null);
  const [filterIdentity, setFilterIdentity] = useState<string | null>(null);
  const [filterPermission, setFilterPermission] = useState<string | null>(null);

  const identityOptions = useMemo(
    () => initialUsers
      .map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [initialUsers]
  );

  const permissionOptions = useMemo(() => ([
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Auditor (read-only)', value: 'AUDITOR' },
    { label: 'Designer', value: 'canDesignProcess' },
    { label: 'Publisher', value: 'canPublishProcess' },
    { label: 'Executor', value: 'canExecuteRun' },
    { label: 'Validator', value: 'canValidateRun' },
    { label: 'Team Manager', value: 'canManageTeam' },
    { label: 'Billing', value: 'canAccessBilling' }
  ]), []);

  // Filter users based on all column filters
  let filteredUsers = initialUsers.filter(u => {
    // Search filter
    if (searchTerm && !`${u.firstName} ${u.lastName} ${u.team} ${u.email} ${u.jobTitle}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Status filter
    if (filterStatus && filterStatus !== 'ALL' && u.status !== filterStatus) return false;
    // Team filter
    if (filterTeam && u.team !== filterTeam) return false;
    // Job Title filter
    if (filterJobTitle && u.jobTitle !== filterJobTitle) return false;

    // Identity filter
    if (filterIdentity && u.id !== filterIdentity) return false;

    // Permission filter
    if (filterPermission) {
      const p = u.permissions;
      const isAdmin = !!(p.canManageTeam && p.canAccessBilling);
      const isAuditor = !Object.values(p).some(Boolean);
      if (filterPermission === 'ADMIN' && !isAdmin) return false;
      if (filterPermission === 'AUDITOR' && !isAuditor) return false;
      if (filterPermission !== 'ADMIN' && filterPermission !== 'AUDITOR') {
        if (!(p as any)[filterPermission]) return false;
      }
    }
    return true;
  });
  
  // Sort users
  filteredUsers.sort((a, b) => {
    let vA = '', vB = '';
    switch (sortConfig.key) { 
      case 'lastName': {
        vA = `${a.lastName} ${a.firstName}`.toLowerCase();
        vB = `${b.lastName} ${b.firstName}`.toLowerCase();
        break;
      }
      case 'team': vA = a.team.toLowerCase(); vB = b.team.toLowerCase(); break; 
      case 'status': vA = a.status; vB = b.status; break; 
      case 'jobTitle': vA = (a.jobTitle || '').toLowerCase(); vB = (b.jobTitle || '').toLowerCase(); break;
      case 'permissions': {
        const score = (u: User) => Object.values(u.permissions || {}).filter(Boolean).length;
        vA = String(score(a));
        vB = String(score(b));
        break;
      }
      default: vA = a.lastName.toLowerCase(); vB = b.lastName.toLowerCase(); 
    }
    if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
    return vA > vB ? (sortConfig.direction === 'asc' ? 1 : -1) : 0;
  });

  const inactiveCount = initialUsers.filter(u => u.status === 'INACTIVE').length;
  const activeFilterCount = (searchTerm ? 1 : 0) + (filterStatus ? 1 : 0) + (filterTeam ? 1 : 0) + (filterJobTitle ? 1 : 0) + (filterIdentity ? 1 : 0) + (filterPermission ? 1 : 0);

  // Clear all filters helper
  const clearAllFilters = () => {
    onClearFilters();
    setFilterStatus(null);
    setFilterTeam(null);
    setFilterJobTitle(null);
    setFilterIdentity(null);
    setFilterPermission(null);
  };

  // --- HANDLERS ---

  const handleOpenAuditModal = () => {
      setAuditConfig({
          includeMatrix: true,
          historyDuration: '90',
          recipientEmail: currentUser.email
      });
      setIsAuditModalOpen(true);
  };

  const handleSendAuditReport = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSendingAudit(true);
      
      // Simulate API call and generation delay
      setTimeout(() => {
          setIsSendingAudit(false);
          setIsAuditModalOpen(false);
          showToast(`Audit Report sent to ${auditConfig.recipientEmail}`);
      }, 1500);
  };

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
        permissions: { ...defaultPerms, canExecuteRun: true }
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
          onUpdateTeam(newTeam as Team, teams.find(t => t.id === newTeam.id)?.name);
      } else {
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
    if (original.status === 'ACTIVE' && updatedUser.status === 'INACTIVE') {
        if (original.id === currentUser.id) {
            alert("Safety Lock: You cannot deactivate your own account.");
            return;
        }
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

  const applyRolePreset = (preset: 'ADMIN' | 'STANDARD' | 'AUDITOR') => {
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
          canDesignProcess: true, 
          canPublishProcess: true, 
          canExecuteRun: true, 
          canValidateRun: true, 
          canManageTeam: true, 
          canAccessBilling: true,
          canAccessWorkspace: true
        };
    } else if (preset === 'AUDITOR') {
        newPerms = { ...defaultPerms }; 
    } else {
        newPerms = { 
          ...defaultPerms,
          canExecuteRun: true 
        };
    }
    performUserUpdate(panelUser.id, { ...panelUser, permissions: newPerms });
  };

  // Check if current user is admin (has role in user_roles - simulated via canAccessWorkspace for now)
  const isCurrentUserAdmin = currentUser.permissions.canAccessWorkspace;
  
  // Permission protection rules:
  // - Admin toggle: only admin can toggle
  // - canAccessWorkspace: only admin can toggle
  // - canAccessBilling: admin OR canManageTeam can toggle
  // - Others: admin/manager can toggle
  const canTogglePermission = (key: keyof UserPermissions): boolean => {
    if (!canManage) return false;
    
    // No one can modify a user who has higher privileges unless you're admin
    if (panelUser?.permissions.canAccessWorkspace && !isCurrentUserAdmin) return false;
    
    // Admin-only toggles
    if (key === 'canAccessWorkspace') return isCurrentUserAdmin;
    
    // Admin OR canManageTeam toggles
    if (key === 'canAccessBilling') return isCurrentUserAdmin || currentUser.permissions.canManageTeam;
    
    // All others: admin/manager
    return true;
  };

  const togglePanelPermission = (key: keyof UserPermissions) => {
    if (!panelUser || !canManage) return;
    
    if (!canTogglePermission(key)) {
      showToast("Access Denied: Insufficient permissions.", 'ERROR');
      return;
    }
    
    if (panelUser.id === currentUser.id && key === 'canManageTeam' && panelUser.permissions.canManageTeam) {
        showToast("Safety Lock: You cannot remove your own Team Management rights.", 'ERROR');
        return;
    }
    if (panelUser.id === currentUser.id && key === 'canAccessWorkspace' && panelUser.permissions.canAccessWorkspace) {
        showToast("Safety Lock: You cannot remove your own Admin rights.", 'ERROR');
        return;
    }
    
    let newPerms = { ...panelUser.permissions };
    newPerms[key] = !newPerms[key];
    performUserUpdate(panelUser.id, { ...panelUser, permissions: newPerms });
  };

  // Admin toggle handler - cascades all permissions
  const toggleAdminRole = () => {
    if (!panelUser || !isCurrentUserAdmin) {
      showToast("Access Denied: Only admins can grant admin role.", 'ERROR');
      return;
    }
    if (panelUser.id === currentUser.id && isPanelAdmin) {
      showToast("Safety Lock: You cannot remove your own Admin role.", 'ERROR');
      return;
    }
    
    const willBeAdmin = !isPanelAdmin;
    if (willBeAdmin) {
      // Cascade ON: all permissions activated
      performUserUpdate(panelUser.id, { 
        ...panelUser, 
        permissions: { 
          canDesignProcess: true, 
          canPublishProcess: true, 
          canExecuteRun: true, 
          canValidateRun: true, 
          canManageTeam: true, 
          canAccessBilling: true,
          canAccessWorkspace: true
        } 
      });
    } else {
      // Turn off Admin: reset to standard
      performUserUpdate(panelUser.id, { 
        ...panelUser, 
        permissions: { 
          ...defaultPerms,
          canExecuteRun: true 
        } 
      });
    }
  };

  const isPanelAdmin = panelUser?.permissions.canAccessWorkspace === true;
  const isPanelAuditor = panelUser && !Object.values(panelUser.permissions).some(Boolean);

  return (
    <div className="relative h-full flex flex-col">
      <div className="p-10 max-w-7xl mx-auto w-full h-full flex flex-col animate-in fade-in duration-500">
        
        {/* HEADER & CONTROLS */}
        <div className="mb-8 shrink-0">
            {/* Top row: Title + Tabs + Actions */}
            <div className="flex items-start justify-between gap-6">
                {/* Left: Title */}
                <div className="shrink-0">
                    <h1 className="text-3xl font-light text-slate-900 flex items-center gap-3"><Users className="text-indigo-500 shrink-0" /> Team Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage permissions and responsibility matrix.</p>
                </div>
                
                {/* Center: Tabs */}
                <div className="flex-1 flex justify-center">
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
                
                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {activeTab === 'MEMBERS' && (
                        <div className="relative w-48">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                            <input className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Find member..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    )}
                    
                    {canManage && (
                        <>
                            <button onClick={handleOpenAuditModal} className="flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-all shadow-sm">
                                <FileText size={16} /> Export Audit
                            </button>
                            <button onClick={() => activeTab === 'MEMBERS' ? setIsInviteModalOpen(true) : (setNewTeam({ name: '', description: '', color: 'indigo' }), setIsTeamModalOpen(true))} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 text-xs font-semibold transition-colors">
                                <Plus size={16} /> {activeTab === 'MEMBERS' ? 'Invite' : 'Add Team'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden relative z-10">
            {activeTab === 'MEMBERS' ? (
                <>
                    <div className="grid grid-cols-12 gap-6 px-8 py-4 bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider select-none z-20 items-center">
                        <ColumnHeaderFilter 
                          label="Identity" 
                          sortKey="lastName" 
                          currentSort={sortConfig} 
                          onSort={onSort} 
                          filterOptions={identityOptions}
                          filterValue={filterIdentity}
                          onFilter={setFilterIdentity}
                          className="col-span-3"
                        />
                        <ColumnHeaderFilter 
                          label="Status" 
                          sortKey="status" 
                          currentSort={sortConfig} 
                          onSort={onSort}
                          filterOptions={[
                            { label: 'Active', value: 'ACTIVE' },
                            { label: `Inactive (${inactiveCount})`, value: 'INACTIVE' }
                          ]}
                          filterValue={filterStatus}
                          onFilter={setFilterStatus}
                          className="col-span-2"
                          align="center"
                        />
                        <ColumnHeaderFilter 
                          label="Team" 
                          sortKey="team" 
                          currentSort={sortConfig} 
                          onSort={onSort}
                          filterOptions={uniqueTeams.map(t => ({ label: t, value: t }))}
                          filterValue={filterTeam}
                          onFilter={setFilterTeam}
                          className="col-span-2"
                        />
                        <ColumnHeaderFilter 
                          label="Job Title" 
                          sortKey="jobTitle" 
                          currentSort={sortConfig} 
                          onSort={onSort}
                          filterOptions={uniqueJobTitles.map(j => ({ label: j, value: j }))}
                          filterValue={filterJobTitle}
                          onFilter={setFilterJobTitle}
                          className="col-span-2"
                        />
                        <ColumnHeaderFilter
                          label="Permissions"
                          sortKey="permissions"
                          currentSort={sortConfig}
                          onSort={onSort}
                          filterOptions={permissionOptions}
                          filterValue={filterPermission}
                          onFilter={setFilterPermission}
                          className="col-span-2"
                          align="center"
                        />
                        <div className="col-span-1 text-right">Action</div>
                    </div>
                    
                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1 custom-scrollbar">
                        {filteredUsers.length === 0 ? <div className="p-12 text-center text-slate-400 italic">No members found.</div> : filteredUsers.map(user => {
                            const p = user.permissions;
                            const activePerms: Array<{ icon: any, label: string, color: string }> = [];
                            if (p.canDesignProcess) activePerms.push({ icon: Pencil, label: "Designer", color: "indigo" });
                            if (p.canPublishProcess) activePerms.push({ icon: ShieldCheck, label: "Publisher", color: "emerald" });
                            if (p.canExecuteRun) activePerms.push({ icon: Zap, label: "Executor", color: "slate" });
                            if (p.canValidateRun) activePerms.push({ icon: CheckSquare, label: "Validator", color: "emerald" });
                            if (p.canManageTeam) activePerms.push({ icon: Users, label: "Team Mgr", color: "indigo" });
                            if (p.canAccessBilling) activePerms.push({ icon: CreditCard, label: "Billing", color: "amber" });

                            const isMonoPerm = activePerms.length === 1;
                            const isInlineEditing = inlineEditingId === user.id;
                            const isPanelActive = activePanelUserId === user.id;
                            const isAdmin = p.canManageTeam && p.canAccessBilling;
                            const isAuditor = !Object.values(p).some(Boolean);
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
                                <div className="col-span-2 flex flex-wrap justify-center gap-1.5">
                                    {isAdmin ? <PermissionBadge icon={Crown} label="Admin" colorClass="amber" showLabel /> : isAuditor ? <PermissionBadge icon={Eye} label="Auditor" colorClass="slate" showLabel /> : (
                                        <>
                                          {activePerms.map((perm, idx) => (
                                            <PermissionBadge key={idx} icon={perm.icon} label={perm.label} colorClass={perm.color} showLabel={activePerms.length === 1} />
                                          ))}
                                          {activePerms.length === 0 && <div className="text-[9px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-1"><Lock size={12} /> Read-only</div>}
                                        </>
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

      {/* AUDIT REPORT EXPORT MODAL */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-white/20 overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <FileText size={20} />
                        </div>
                        Security & Access Report
                    </h3>
                    <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSendAuditReport} className="p-8 space-y-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                        <ShieldCheck size={20} className="text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-indigo-900 mb-1">Push-Based Audit</h4>
                            <p className="text-[11px] text-indigo-700/80 leading-relaxed">
                                Securely transmit a static snapshot of the system state to an external auditor without granting them persistent login access.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center justify-between mb-4 cursor-pointer group">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Include Permission Matrix</span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${auditConfig.includeMatrix ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => setAuditConfig({...auditConfig, includeMatrix: !auditConfig.includeMatrix})}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${auditConfig.includeMatrix ? 'left-6' : 'left-1'}`} />
                            </div>
                        </label>
                        <p className="text-[10px] text-slate-400 -mt-2 mb-4 pl-1">Snapshots current roles, access levels, and team assignments.</p>
                        
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Audit Trail History</label>
                        <CustomSelect 
                            value={auditConfig.historyDuration} 
                            onChange={(val) => setAuditConfig({...auditConfig, historyDuration: val})} 
                            options={durationOptions} 
                            icon={Calendar} 
                            variant="standard" 
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Recipient Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
                            <input 
                                type="email" 
                                required 
                                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
                                placeholder="auditor@firm.com"
                                value={auditConfig.recipientEmail}
                                onChange={(e) => setAuditConfig({...auditConfig, recipientEmail: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAuditModalOpen(false)} className="px-5 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest">Cancel</button>
                        <button type="submit" disabled={isSendingAudit || !auditConfig.recipientEmail} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSendingAudit ? 'Generating...' : <><Download size={16} /> Generate & Send</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

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

      {/* USER SETTINGS PANEL - SLIDE OVER */}
      {panelUser && (
        <>
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-[40] animate-in fade-in" onClick={() => setActivePanelUserId(null)} />
            <div className="absolute top-0 right-0 h-full w-[400px] bg-white border-l border-slate-200 shadow-2xl z-[50] flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="font-bold text-lg text-slate-900">User Permissions</h2>
                    <button onClick={() => setActivePanelUserId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Identity Card */}
                    <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${getUserColor(panelUser.team)}`}>{panelUser.firstName[0]}{panelUser.lastName[0]}</div>
                        <div>
                            <div className="font-bold text-slate-900">{panelUser.firstName} {panelUser.lastName}</div>
                            <div className="text-xs text-slate-500">{panelUser.jobTitle} &middot; {panelUser.team}</div>
                        </div>
                    </div>


                    {/* Quick Roles */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Quick Role Presets</label>
                        <div className="grid grid-cols-3 gap-3">
                            <RoleCard selected={isPanelAdmin} title="Admin" icon={Crown} colorClass="amber" onClick={() => isCurrentUserAdmin && applyRolePreset('ADMIN')} />
                            <RoleCard selected={!isPanelAdmin && !isPanelAuditor} title="Standard" icon={Users} colorClass="indigo" onClick={() => applyRolePreset('STANDARD')} />
                            <RoleCard selected={isPanelAuditor} title="Auditor" icon={Eye} colorClass="slate" onClick={() => applyRolePreset('AUDITOR')} />
                        </div>
                    </div>

                    {/* Fine Grained Controls */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fine-Grained Access</label>
                        
                        <PermissionToggle 
                            active={panelUser.permissions.canDesignProcess} 
                            onClick={() => togglePanelPermission('canDesignProcess')} 
                            label="Process Designer" 
                            subLabel="Can create and edit process templates"
                            icon={Pencil}
                            colorClass="indigo"
                            disabled={isPanelAdmin || !canTogglePermission('canDesignProcess')}
                            isInherited={isPanelAdmin}
                        />
                        <PermissionToggle 
                            active={panelUser.permissions.canPublishProcess} 
                            onClick={() => togglePanelPermission('canPublishProcess')} 
                            label="Process Publisher" 
                            subLabel="Can approve and publish drafts"
                            icon={ShieldCheck}
                            colorClass="emerald"
                            disabled={isPanelAdmin || !canTogglePermission('canPublishProcess')}
                            isInherited={isPanelAdmin}
                        />
                         <PermissionToggle 
                            active={panelUser.permissions.canExecuteRun} 
                            onClick={() => togglePanelPermission('canExecuteRun')} 
                            label="Run Executor" 
                            subLabel="Can launch and execute runs"
                            icon={Zap}
                            colorClass="slate"
                            disabled={isPanelAdmin || !canTogglePermission('canExecuteRun')}
                            isInherited={isPanelAdmin}
                        />
                         <PermissionToggle 
                            active={panelUser.permissions.canValidateRun} 
                            onClick={() => togglePanelPermission('canValidateRun')} 
                            label="Run Validator" 
                            subLabel="Can sign-off and approve completed runs"
                            icon={CheckSquare}
                            colorClass="emerald"
                            disabled={isPanelAdmin || !canTogglePermission('canValidateRun')}
                            isInherited={isPanelAdmin}
                        />
                         <PermissionToggle 
                            active={panelUser.permissions.canManageTeam} 
                            onClick={() => togglePanelPermission('canManageTeam')} 
                            label="Team Manager" 
                            subLabel="Can invite users and manage teams"
                            icon={Users}
                            colorClass="indigo"
                            disabled={isPanelAdmin || !canTogglePermission('canManageTeam')}
                            isInherited={isPanelAdmin}
                        />
                        <PermissionToggle 
                            active={panelUser.permissions.canAccessBilling} 
                            onClick={() => togglePanelPermission('canAccessBilling')} 
                            label="Billing Access" 
                            subLabel="Can access invoices and subscription"
                            icon={CreditCard}
                            colorClass="amber"
                            disabled={isPanelAdmin || !canTogglePermission('canAccessBilling')}
                            isInherited={isPanelAdmin}
                        />
                        <PermissionToggle 
                            active={panelUser.permissions.canAccessWorkspace} 
                            onClick={() => togglePanelPermission('canAccessWorkspace')} 
                            label="Workspace Settings" 
                            subLabel="Can access and modify workspace configuration"
                            icon={Settings}
                            colorClass="amber"
                            disabled={!isCurrentUserAdmin}
                            isInherited={isPanelAdmin}
                        />
                    </div>

                    {/* Account Actions */}
                    <div className="pt-6 border-t border-slate-100">
                         <button 
                           onClick={() => toggleDeactivation(panelUser.id)} 
                           className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between group transition-all ${
                             panelUser.status === 'ACTIVE' 
                               ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' 
                               : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                           }`}
                         >
                            <span>{panelUser.status === 'ACTIVE' ? 'Deactivate Account' : 'Reactivate Account'}</span>
                            <UserX size={16} className={panelUser.status === 'ACTIVE' ? 'text-slate-400 group-hover:text-slate-600' : 'text-emerald-600'}/>
                         </button>
                    </div>
                </div>
            </div>
        </>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmConfig && confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-white/20">
                <div className={`p-8 text-center ${confirmConfig.variant === 'danger' ? 'bg-red-50/50' : 'bg-amber-50/50'}`}>
                    <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-4 ${confirmConfig.variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmConfig.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{confirmConfig.message}</p>
                </div>
                <div className="p-8 flex gap-3">
                    <button onClick={() => setConfirmConfig(null)} className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">Cancel</button>
                    <button onClick={confirmConfig.onConfirm} className={`flex-1 py-3 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all ${confirmConfig.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>{confirmConfig.confirmLabel}</button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
