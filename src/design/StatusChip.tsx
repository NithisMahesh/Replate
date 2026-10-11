import React from 'react';
import { status, StatusKey } from './tokens';

export interface StatusChipProps {
  /** Semantic status — drives color, icon, AND label so color is never the only signal */
  statusKey: StatusKey;
  /**
   * Optional override label (e.g. "Collected" instead of the default "Done").
   * Always keep it under 12 words.
   */
  label?: string;
  /** Compact pill with icon only + tooltip (for use inside tight spaces) */
  compact?: boolean;
  className?: string;
}

/**
 * StatusChip
 *
 * Renders a pill badge with:
 *   1. A background color tied to the status semantic (green/amber/red/blue).
 *   2. An icon — so color is NEVER the only signal (WCAG 1.4.1).
 *   3. A short label — always visible unless `compact` is true.
 *
 * Use the same `statusKey` consistently across provider and NGO views so
 * the same donation always shows the same chip colour on both sides.
 *
 * Status map:
 *   done     → green  ✓  — completed, collected, distributed, safe
 *   waiting  → amber  ⏳ — submitted, scheduled, pending action
 *   urgent   → red    ✕  — failed, excluded, expired, overdue
 *   progress → blue   ↻  — confirmed, in transit, being processed
 */
export const StatusChip: React.FC<StatusChipProps> = ({
  statusKey,
  label,
  compact = false,
  className = '',
}) => {
  const s = status[statusKey];
  const displayLabel = label ?? s.label;

  return (
    <span
      role="status"
      title={displayLabel}
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
        'text-xs font-semibold select-none',
        s.bg,
        s.text,
        s.border,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Icon — visible even if color perception fails */}
      <span aria-hidden="true">{s.icon}</span>
      {/* Label — hidden in compact mode but still read by screen readers */}
      {compact ? (
        <span className="sr-only">{displayLabel}</span>
      ) : (
        <span>{displayLabel}</span>
      )}
    </span>
  );
};

export default StatusChip;
