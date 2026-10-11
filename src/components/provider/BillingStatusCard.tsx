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
  if (diffSec < 60) return 'Last synced just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'Last synced 1 min ago';
  if (diffMin < 60) return `Last synced ${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return 'Last synced 1 hr ago';
  return `Last synced ${diffHr} hrs ago`;
}

export const BillingStatusCard: React.FC<BillingStatusCardProps> = ({
  billingConnection,
  onConnectBilling,
  onSyncBilling,
  className = '',
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const status = billingConnection?.status || 'not_connected';

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      onSyncBilling();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <div
      id="today-billing-status-card"
      className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-150 ${
        status === 'connected'
          ? 'bg-emerald-50/40 border-emerald-200/80'
          : status === 'error'
          ? 'bg-rose-50/40 border-rose-200/80'
          : 'bg-slate-50/70 border-slate-200/70'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              status === 'connected'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'error'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <CreditCard className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800">Billing</span>
              {status === 'not_connected' && (
                <span
                  id="billing-chip-not-connected"
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 border border-slate-300/80"
                >
                  Not connected
                </span>
              )}
              {status === 'connected' && (
                <span
                  id="billing-chip-connected"
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
                >
                  Connected: auto-filling sold quantity
                </span>
              )}
              {status === 'error' && (
                <span
                  id="billing-chip-error"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300"
                >
                  <AlertCircle className="w-3 h-3" />
                  Sync error
                </span>
              )}
            </div>

            {status === 'connected' && (
              <p className="text-[11px] text-slate-500 mt-0.5" id="billing-last-synced-text">
                {formatLastSynced(billingConnection?.lastSyncedAt)}
                {billingConnection?.connectorName && ` • ${billingConnection.connectorName}`}
              </p>
            )}
            {status === 'not_connected' && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Connect your POS or sales file to sync sold portions.
              </p>
            )}
            {status === 'error' && (
              <p className="text-[11px] text-rose-600 mt-0.5">
                Failed to sync with billing connector. Please retry.
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
          {status === 'not_connected' && (
            <button
              type="button"
              id="connect-billing-today-btn"
              onClick={onConnectBilling}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>Connect billing</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {status === 'connected' && (
            <button
              type="button"
              id="sync-billing-today-btn"
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync now'}</span>
            </button>
          )}

          {status === 'error' && (
            <button
              type="button"
              id="retry-billing-today-btn"
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Retrying...' : 'Retry'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
