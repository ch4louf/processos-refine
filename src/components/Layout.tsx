import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, Activity, Settings2, ClipboardList, Bell, X, Shield, 
  ReceiptText, AlertCircle, BookOpen, Users, ChevronDown, ChevronRight,
  Sparkles, Command
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useUI } from '../contexts/UIContext';
import { Notification } from '../types';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: any, context?: any) => void;
  libraryContext?: string;
  reviewRequiredCount?: number;
  myTasksCount?: number;
  onNotificationClick: (n: Notification) => void; 
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number | null;
  indicator?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, badge, indicator }) => (
  <button 
    onClick={onClick} 
    className={`
      group w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium
      transition-all duration-200 ease-out
      ${isActive 
        ? 'bg-white/10 text-white shadow-sm shadow-white/5' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
      }
    `}
  >
    <div className="flex items-center gap-3">
      <span className={`transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
    {badge && badge > 0 && (
      <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 bg-indigo-500 text-white text-[10px] font-semibold rounded-full">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
    {indicator && (
      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
    )}
  </button>
);

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const NavGroup: React.FC<NavGroupProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="space-y-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors"
      >
        <span className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <ChevronDown size={12} />
        </span>
        {title}
      </button>
      <div 
        className={`space-y-0.5 overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onNavigate, reviewRequiredCount = 0, myTasksCount = 0, libraryContext, onNotificationClick
}) => {
  const { currentUser } = useUser();
  const { notifications, markNotificationAsRead } = useUI();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(n => 
    (!n.userId || n.userId === currentUser.id || (n.jobTitle && n.jobTitle === currentUser.jobTitle)) && !n.read
  ).length;

  const relevantNotifications = notifications.filter(n => 
    !n.userId || n.userId === currentUser.id || (n.jobTitle && n.jobTitle === currentUser.jobTitle)
  );

  const perms = currentUser.permissions;
  const canManageTeam = perms.canManageTeam;
  const canAccessDesign = perms.canDesign || perms.canVerifyDesign;
  const canAccessOps = perms.canExecute || perms.canVerifyRun;
  const canAccessBilling = perms.canAccessBilling;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* PREMIUM SIDEBAR */}
      <aside className="w-[260px] bg-gradient-to-b from-[#0c1322] to-[#0a0f1a] text-slate-300 flex flex-col flex-shrink-0 border-r border-white/5">
        {/* Logo Section */}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Shield size={18} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0c1322]" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">ProcessOS</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Sparkles size={10} className="text-amber-500" />
                <span>Pro Plan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search / Command Palette Trigger */}
        <div className="px-4 mb-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-lg text-sm text-slate-500 hover:text-slate-400 transition-all duration-200">
            <Command size={14} />
            <span className="flex-1 text-left text-[13px]">Search...</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Personal Hub */}
          <NavGroup title="Personal Hub">
            <NavItem
              icon={<ClipboardList size={18} />}
              label="My Tasks"
              isActive={activeTab === 'MY_TASKS'}
              onClick={() => onNavigate('MY_TASKS')}
              badge={myTasksCount}
            />
            <NavItem
              icon={<Bell size={18} />}
              label="Notifications"
              isActive={isNotifOpen}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              indicator={unreadNotifications > 0}
            />
          </NavGroup>

          {/* Design Studio */}
          {canAccessDesign && (
            <NavGroup title="Design Studio">
              <NavItem
                icon={<Settings2 size={18} />}
                label="Templates"
                isActive={activeTab === 'LIBRARY' && libraryContext === 'DESIGN'}
                onClick={() => onNavigate('LIBRARY', 'DESIGN')}
              />
              <NavItem
                icon={<AlertCircle size={18} />}
                label="Review Cycle"
                isActive={activeTab === 'REVIEWS'}
                onClick={() => onNavigate('REVIEWS')}
                badge={reviewRequiredCount}
              />
            </NavGroup>
          )}

          {/* Operations */}
          {canAccessOps && (
            <NavGroup title="Operations">
              <NavItem
                icon={<Layers size={18} />}
                label="Dashboard"
                isActive={activeTab === 'DASHBOARD'}
                onClick={() => onNavigate('DASHBOARD')}
              />
              <NavItem
                icon={<Activity size={18} />}
                label="Process Runs"
                isActive={activeTab === 'PROCESS_RUNS'}
                onClick={() => onNavigate('PROCESS_RUNS')}
              />
              <NavItem
                icon={<BookOpen size={18} />}
                label="Library"
                isActive={activeTab === 'LIBRARY' && libraryContext === 'RUN'}
                onClick={() => onNavigate('LIBRARY', 'RUN')}
              />
            </NavGroup>
          )}

          {/* Workspace */}
          {(canAccessBilling || canManageTeam) && (
            <NavGroup title="Workspace">
              {canAccessBilling && (
                <NavItem
                  icon={<ReceiptText size={18} />}
                  label="Billing & Plan"
                  isActive={activeTab === 'BILLING'}
                  onClick={() => onNavigate('BILLING')}
                />
              )}
              {canManageTeam && (
                <NavItem
                  icon={<Users size={18} />}
                  label="Team Management"
                  isActive={activeTab === 'TEAM'}
                  onClick={() => onNavigate('TEAM')}
                />
              )}
            </NavGroup>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0c1322]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {currentUser.jobTitle}
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>
      </aside>

      {/* NOTIFICATIONS OVERLAY */}
      {isNotifOpen && (
        <div 
          ref={notifRef} 
          className="absolute left-[260px] top-0 h-full w-[380px] z-[100] bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200/50"
          style={{
            animation: 'slideIn 0.2s ease-out'
          }}
        >
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(-8px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
          <div className="h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Notifications</h3>
                <p className="text-xs text-slate-500 mt-0.5">{unreadNotifications} unread</p>
              </div>
              <button 
                onClick={() => setIsNotifOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <NotificationCenter 
                notifications={relevantNotifications} 
                onAction={(n) => { markNotificationAsRead(n.id); onNotificationClick(n); }} 
              />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
        <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
