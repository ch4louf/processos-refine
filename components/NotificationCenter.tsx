
import React from 'react';
import { Notification } from '../types';
import { 
  ClipboardList, GitBranch, AlertCircle, ShieldAlert, 
  BadgeCheck, Clock, ExternalLink 
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  onAction: (n: Notification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onAction }) => {
  const getIcon = (type: string) => {
    switch(type) {
      case 'TASK_ASSIGNED': return <ClipboardList className="text-indigo-500" size={16} />;
      case 'VERSION_PUBLISHED': return <GitBranch className="text-emerald-500" size={16} />;
      case 'RUN_BLOCKED': return <ShieldAlert className="text-amber-500" size={16} />;
      case 'PROCESS_OUTDATED': return <AlertCircle className="text-red-500" size={16} />;
      default: return <BadgeCheck className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="divide-y divide-slate-50">
      {notifications.length > 0 ? notifications.map(n => (
        <button
          key={n.id}
          onClick={() => onAction(n)}
          className={`w-full text-left p-6 hover:bg-slate-50 transition-colors group flex gap-4 ${n.read ? 'opacity-60' : ''}`}
        >
          <div className={`mt-1 p-2 rounded-xl shrink-0 ${n.read ? 'bg-slate-100' : 'bg-indigo-50'}`}>
             {getIcon(n.type)}
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${n.read ? 'text-slate-400' : 'text-indigo-600'}`}>
                   {n.type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                   {new Date(n.timestamp).toLocaleDateString()}
                </span>
             </div>
             <h4 className={`text-sm font-bold mb-1 group-hover:text-indigo-600 transition-colors ${n.read ? 'text-slate-500' : 'text-slate-900'}`}>
                {n.title}
             </h4>
             <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {n.message}
             </p>
             {n.linkId && (
               <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                  <ExternalLink size={10} /> Resolve Now
               </div>
             )}
          </div>
          {!n.read && (
            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>
          )}
        </button>
      )) : (
        <div className="py-20 text-center text-slate-400 italic flex flex-col items-center">
            <Clock size={32} className="mb-3 opacity-20" />
            <p className="text-xs">No recent notifications</p>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
