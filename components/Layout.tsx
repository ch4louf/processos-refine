
import React, { useState, useRef, useEffect } from 'react';
import { Layers, Activity, Settings2, ClipboardList, Bell, X, Shield, ReceiptText, Eye, AlertCircle, BookOpen, Users, Briefcase } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useUI } from '../contexts/UIContext';
import { Notification } from '../types';
import NotificationCenter from './NotificationCenter';
import { BrandLogo } from './ui/BrandLogo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: any, context?: any) => void;
  libraryContext?: string;
  reviewRequiredCount?: number;
  myTasksCount?: number;
  onNotificationClick: (n: Notification) => void; 
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onNavigate, reviewRequiredCount = 0, myTasksCount = 0, libraryContext, onNotificationClick
}) => {
  const { currentUser, getUserColor } = useUser();
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
  const isAuditor = !Object.values(perms).some(Boolean);

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
      {/* SIDEBAR DESIGN MATCHING SCREENSHOT */}
      <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
        <div className="p-6 mb-4">
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Shield size={20} fill="white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ProcessOS</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          {/* PERSONAL HUB */}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Personal Hub</div>
            <div className="space-y-1">
              <button onClick={() => onNavigate('MY_TASKS')} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'MY_TASKS' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <div className="flex items-center gap-3"><ClipboardList size={18} /> My Tasks</div>
                {myTasksCount > 0 && <span className="w-5 h-5 flex items-center justify-center bg-[#4F46E5] text-white text-[10px] font-bold rounded-full ring-2 ring-[#0F172A]">{myTasksCount}</span>}
              </button>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isNotifOpen ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                <div className="flex items-center gap-3"><Bell size={18} /> Notifications</div>
                {unreadNotifications > 0 && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
              </button>
            </div>
          </div>

          {/* DESIGN STUDIO */}
          {canAccessDesign && (
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Design Studio</div>
              <div className="space-y-1">
                <button onClick={() => onNavigate('LIBRARY', 'DESIGN')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'LIBRARY' && libraryContext === 'DESIGN' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                  <Settings2 size={18} /> Templates
                </button>
                <button onClick={() => onNavigate('REVIEWS')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'REVIEWS' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                  <AlertCircle size={18} /> Review Cycle
                </button>
              </div>
            </div>
          )}

          {/* OPERATIONS */}
          {(canAccessOps || isAuditor) && (
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Operations</div>
              <div className="space-y-1">
                <button onClick={() => onNavigate('DASHBOARD')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'DASHBOARD' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                  <Layers size={18} /> Dashboard
                </button>
                <button onClick={() => onNavigate('PROCESS_RUNS')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'PROCESS_RUNS' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                  <Activity size={18} /> Process Runs
                </button>
                <button onClick={() => onNavigate('LIBRARY', 'RUN')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'LIBRARY' && libraryContext === 'RUN' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                  <BookOpen size={18} /> Library
                </button>
              </div>
            </div>
          )}

          {/* WORKSPACE */}
          {(canAccessBilling || canManageTeam) && (
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Workspace</div>
              <div className="space-y-1">
                {canAccessBilling && (
                    <button onClick={() => onNavigate('BILLING')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'BILLING' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                      <ReceiptText size={18} /> Billing & Plan
                    </button>
                )}
                {canManageTeam && (
                    <button onClick={() => onNavigate('TEAM')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'TEAM' ? 'bg-[#4F46E5] text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}>
                      <Users size={18} /> Team Management
                    </button>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* PROFILE DESIGN MATCHING SCREENSHOT */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border border-white/10 shrink-0 ${isAuditor ? 'bg-slate-700 text-slate-300' : 'bg-indigo-100 text-indigo-700'}`}>
                {isAuditor ? <Eye size={20} /> : <>{currentUser.firstName[0]}{currentUser.lastName[0]}</>}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-white truncate">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <div className="text-[9px] text-slate-500 font-black uppercase tracking-tight truncate flex items-center gap-1">
                   {isAuditor ? <><Eye size={10} /> Auditor Access</> : <><Users size={10} /> {currentUser.team}</>}
                 </div>
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5">{currentUser.jobTitle}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* NOTIFICATIONS OVERLAY */}
      {isNotifOpen && (
        <div ref={notifRef} className="absolute left-64 top-0 h-full w-96 z-[100] bg-white shadow-2xl border-r border-slate-200 animate-in slide-in-from-left-4 duration-300">
           <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Bell size={20} className="text-indigo-600" /> Notifications</h3>
                <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
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
