
import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const getStyles = () => {
    switch (status) {
      case 'DRAFT': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'IN_REVIEW': 
      case 'PENDING_VALIDATION': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'PUBLISHED':
      case 'APPROVED':
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'REJECTED':
      case 'CANCELLED': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  return (
    <span className={`font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${getStyles()} ${className}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
