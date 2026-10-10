import React from 'react';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  caption,
  icon,
  badge,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs sm:shadow-sm p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            {icon}
          </div>
        )}
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
          {value}
        </div>
        {(caption || trend) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {trend && <span className="font-medium text-emerald-600">{trend}</span>}
            {caption && <span>{caption}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
