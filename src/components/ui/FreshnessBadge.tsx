import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { FreshnessStatus } from '../../services/governance';

interface FreshnessBadgeProps {
  status: FreshnessStatus;
  daysUntilExpiration?: number;
  compact?: boolean;
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({ 
  status, 
  daysUntilExpiration,
  compact = false 
}) => {
  const getConfig = () => {
    switch (status) {
      case 'EXPIRED':
        return {
          icon: AlertTriangle,
          label: 'Expired',
          subLabel: daysUntilExpiration !== undefined ? `${Math.abs(daysUntilExpiration)}d ago` : undefined,
          bgClass: 'bg-red-50',
          borderClass: 'border-red-200',
          textClass: 'text-red-600',
          iconClass: 'text-red-500',
        };
      case 'DUE_SOON':
        return {
          icon: Clock,
          label: 'Due Soon',
          subLabel: daysUntilExpiration !== undefined ? `${daysUntilExpiration}d left` : undefined,
          bgClass: 'bg-amber-50',
          borderClass: 'border-amber-200',
          textClass: 'text-amber-600',
          iconClass: 'text-amber-500',
        };
      default:
        return {
          icon: CheckCircle2,
          label: 'Current',
          subLabel: undefined,
          bgClass: 'bg-emerald-50',
          borderClass: 'border-emerald-100',
          textClass: 'text-emerald-600',
          iconClass: 'text-emerald-500',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${config.bgClass} ${config.borderClass}`}
        title={`${config.label}${config.subLabel ? ` (${config.subLabel})` : ''}`}
      >
        <Icon size={12} className={config.iconClass} />
        <span className={`text-[9px] font-bold uppercase tracking-wider ${config.textClass}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgClass} ${config.borderClass}`}>
      <Icon size={14} className={config.iconClass} />
      <div className="flex flex-col">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textClass}`}>
          {config.label}
        </span>
        {config.subLabel && (
          <span className={`text-[9px] ${config.textClass} opacity-70`}>
            {config.subLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default FreshnessBadge;
