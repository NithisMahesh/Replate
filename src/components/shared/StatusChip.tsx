import React from 'react';

export type StatusCategory = 'done' | 'pending' | 'failed' | 'in_progress' | 'neutral';

export interface StatusChipProps {
  status?: string;
  variant?: StatusCategory;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function inferStatusCategory(statusText?: string): StatusCategory {
  if (!statusText) return 'neutral';
  const lower = statusText.toLowerCase();

  if (
    lower.includes('confirm') ||
    lower.includes('deliver') ||
    lower.includes('distribut') ||
    lower.includes('done') ||
    lower.includes('complete') ||
    lower.includes('ready') ||
    lower.includes('success')
  ) {
    return 'done';
  }

  if (
    lower.includes('en route') ||
    lower.includes('arrived') ||
    lower.includes('collecting') ||
    lower.includes('progress') ||
    lower.includes('in transit')
  ) {
    return 'in_progress';
  }

  if (
    lower.includes('schedul') ||
    lower.includes('pending') ||
    lower.includes('waiting') ||
    lower.includes('audit') ||
    lower.includes('draft')
  ) {
    return 'pending';
  }

  if (
    lower.includes('fail') ||
    lower.includes('cancel') ||
    lower.includes('reject') ||
    lower.includes('exceed') ||
    lower.includes('skip')
  ) {
    return 'failed';
  }

  return 'neutral';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  variant,
  children,
  icon,
  className = '',
}) => {
  const category = variant || inferStatusCategory(status || (typeof children === 'string' ? children : ''));

  const styles: Record<StatusCategory, { container: string; dot: string }> = {
    done: {
      container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    pending: {
      container: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500',
    },
    failed: {
      container: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
    },
    in_progress: {
      container: 'bg-sky-50 text-sky-700 border-sky-200/80',
      dot: 'bg-sky-500',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200/80',
      dot: 'bg-slate-400',
    },
  };

  const current = styles[category];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-150 select-none ${current.container} ${className}`}
    >
      {icon ? (
        <span className="shrink-0">{icon}</span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      )}
      <span className="truncate">{children || status}</span>
    </span>
  );
};
