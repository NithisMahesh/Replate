import React, { useState } from 'react';
import { CreditCard, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { BillingConnection } from '../../types/surplusLink';

interface BillingStatusCardProps {
  billingConnection?: BillingConnection;
  onConnectBilling: () => void;
  onSyncBilling: () => void;
  className?: string;
}

export function formatLastSynced(isoStr?: string): string {
  if (!isoStr) return 'Not synced yet';
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return 'Synced just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'Synced 1 min ago';
  if (diffMin < 60) return `Synced ${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return 'Synced 1 hr ago';
  return `Synced ${diffHr} hrs ago`;
}

/**
 * Compact billing row.
 * Shows: colored dot + short status label, sync/connect time caption,
 * and a small "Connect" or "Sync" button.
 * Color is never the only signal — a dot shape + label always accompany.
 */
export const BillingStatusCard: React.FC<BillingStatusCardProps> = ({
  billingConnection,
  onConnectBilling,
  onSyncBilling,
  className = '',
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const connStatus = billingConnection?.status || 'not_connected';

  const handleSync = () => {
    setIsSyncing(true);
    try {
      onSyncBilling();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Dot colour + label per status — always both present
  const dotMeta = {
    connected:     { dot: 'bg-green-500',  label: 'Connected',     labelClass: 'text-green-800' },
    not_connected: { dot: 'bg-slate-400',  label: 'Not connected', labelClass: 'text-slate-600' },
    error:         { dot: 'bg-red-500',    label: 'Sync error',    labelClass: 'text-red-800'   },
  }[connStatus] ?? { dot: 'bg-slate-400', label: connStatus, labelClass: 'text-slate-600' };

  const rowBg =
    connStatus === 'connected'     ? 'bg-emerald-50/40 border-emerald-200/80' :
    connStatus === 'error'         ? 'bg-rose-50/40    border-rose-200/80'    :
    'bg-slate-50/70 border-slate-200/70';

  return (
    <div
      id="today-billing-status-card"
      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-150 ${rowBg} ${className}`}
    >
      {/* Left: icon + dot + label + caption */}
      <div className="flex items-center gap-2 min-w-0">
        <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />

        {/* Colored dot — size ensures it is not color-only when paired with label */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotMeta.dot}`} aria-hidden="true" />

        <div className="min-w-0">
          <span className={`text-xs font-semibold ${dotMeta.labelClass}`} id="billing-chip-label">
            Billing · {dotMeta.label}
            {connStatus === 'connected' && billingConnection?.connectorName
              ? ` · ${billingConnection.connectorName}`
              : ''}
          </span>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate" id="billing-last-synced-text">
            {connStatus === 'connected'
              ? formatLastSynced(billingConnection?.lastSyncedAt)
              : connStatus === 'not_connected'
              ? 'Connect your POS to auto-fill sold portions'
              : 'Failed to sync. Please retry.'}
          </div>
        </div>
      </div>

      {/* Right: small action button */}
      <div className="shrink-0">
        {connStatus === 'not_connected' && (
          <button
            type="button"
            id="connect-billing-today-btn"
            onClick={onConnectBilling}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <span>Connect</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}

        {connStatus === 'connected' && (
          <button
            type="button"
            id="sync-billing-today-btn"
            onClick={handleSync}
            disabled={isSyncing}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing…' : 'Sync'}</span>
          </button>
        )}

        {connStatus === 'error' && (
          <button
            type="button"
            id="retry-billing-today-btn"
            onClick={handleSync}
            disabled={isSyncing}
            className="min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Retrying…' : 'Retry'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
