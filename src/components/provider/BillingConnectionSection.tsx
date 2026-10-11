import React, { useState, useMemo } from 'react';
import { CreditCard, RefreshCw, Unlink, CheckCircle2, AlertCircle, ArrowUpRight, Zap, Table, Check } from 'lucide-react';
import { Button } from '../shared/Button';
import { Provider, BillingConnection, MealSlot } from '../../types/surplusLink';
import { formatLastSynced } from './BillingStatusCard';
import { getMockPOSTransactions, calculatePOSTotals, getMealSlotLabel } from '../../utils/posAndPredictionUtils';

interface BillingConnectionSectionProps {
  provider: Provider;
  billingConnection?: BillingConnection;
  onOpenConnectModal: () => void;
  onSyncBilling: () => void;
  onDisconnectBilling: () => void;
  onToggleAutoFill: (enabled: boolean) => void;
}

export const BillingConnectionSection: React.FC<BillingConnectionSectionProps> = ({
  provider,
  billingConnection,
  onOpenConnectModal,
  onSyncBilling,
  onDisconnectBilling,
  onToggleAutoFill,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const status = billingConnection?.status || 'not_connected';
  const isConnected = status === 'connected';
  const isError = status === 'error';
  const autoFillEnabled = billingConnection?.autoFillSoldQty ?? true;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      onSyncBilling();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Synced sales data grouped by meal slot
  const mealSlotSummaries = useMemo(() => {
    const slots: MealSlot[] = ['morning', 'afternoon', 'night'];
    return slots.map((slot) => {
      const tx = getMockPOSTransactions(provider, slot);
      const totals = calculatePOSTotals(tx, slot);
      const windowRange = provider.mealSlotWindows?.[slot] || {
        morning: { start: '06:00', end: '10:00' },
        afternoon: { start: '12:00', end: '15:00' },
        night: { start: '19:00', end: '23:00' },
      }[slot];

      return {
        slot,
        label: getMealSlotLabel(slot),
        windowStr: `${windowRange.start} – ${windowRange.end}`,
        tickets: totals.ticketCount,
        portions: totals.totalPortions,
        amount: totals.totalAmount,
      };
    });
  }, [provider, provider.mealSlotWindows, billingConnection?.lastSyncedAt]);

  const grandTotals = useMemo(() => {
    return mealSlotSummaries.reduce(
      (acc, s) => ({
        tickets: acc.tickets + s.tickets,
        portions: acc.portions + s.portions,
        amount: acc.amount + s.amount,
      }),
      { tickets: 0, portions: 0, amount: 0 }
    );
  }, [mealSlotSummaries]);

  return (
    <div
      id="billing-connection-section"
      className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5 text-left"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isConnected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isError
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">Billing Integration</h2>
              {isConnected && (
                <span
                  id="billing-tab-chip-connected"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Connected
                </span>
              )}
              {status === 'not_connected' && (
                <span
                  id="billing-tab-chip-not-connected"
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                >
                  Not connected
                </span>
              )}
              {isError && (
                <span
                  id="billing-tab-chip-error"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Sync error
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync sales data to auto-calculate remaining food surplus.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConnected && (
            <>
              <Button
                type="button"
                id="btn-sync-billing-tab"
                variant="secondary"
                size="sm"
                disabled={isSyncing}
                onClick={handleSync}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
              >
                {isSyncing ? 'Syncing...' : 'Sync now'}
              </Button>
              <Button
                type="button"
                id="btn-disconnect-billing-tab"
                variant="secondary"
                size="sm"
                onClick={onDisconnectBilling}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                icon={<Unlink className="w-3.5 h-3.5" />}
              >
                Disconnect
              </Button>
            </>
          )}

          {status === 'not_connected' && (
            <Button
              type="button"
              id="btn-connect-billing-tab"
              variant="primary"
              size="md"
              onClick={onOpenConnectModal}
              icon={<ArrowUpRight className="w-4 h-4" />}
            >
              Connect billing
            </Button>
          )}

          {isError && (
            <>
              <Button
                type="button"
                id="btn-retry-billing-tab"
                variant="primary"
                size="sm"
                disabled={isSyncing}
                onClick={handleSync}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
              >
                {isSyncing ? 'Retrying...' : 'Retry sync'}
              </Button>
              <Button
                type="button"
                id="btn-disconnect-billing-tab"
                variant="secondary"
                size="sm"
                onClick={onDisconnectBilling}
                className="text-slate-600 hover:bg-slate-50"
                icon={<Unlink className="w-3.5 h-3.5" />}
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Connection Details & Connected Features */}
      {isConnected ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Active Connector</span>
                <span className="font-semibold text-slate-800">
                  {billingConnection?.connectorName || 'Demo POS'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Sync Status</span>
                <span className="font-semibold text-slate-800" id="billing-tab-last-synced-val">
                  {formatLastSynced(billingConnection?.lastSyncedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Toggle: Auto-fill sold quantity per meal */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Auto-fill sold quantity per meal
              </span>
              <span className="text-[11px] text-slate-500">
                Populates sold portions automatically from synced sales tickets into Today&apos;s estimate
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
              <input
                type="checkbox"
                id="toggle-autofill-sold-qty"
                checked={autoFillEnabled}
                onChange={(e) => onToggleAutoFill(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* 2. Preview table of today's synced sales grouped by Breakfast, Lunch, Dinner */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-500" />
                <span>Today&apos;s Synced Sales</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Grouped by Breakfast, Lunch &amp; Dinner
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs" id="synced-sales-preview-table">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5">Meal Slot</th>
                    <th className="py-2.5 px-3">Service Hours</th>
                    <th className="py-2.5 px-3 text-center">Tickets</th>
                    <th className="py-2.5 px-3 text-right">Portions Sold</th>
                    <th className="py-2.5 px-3.5 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {mealSlotSummaries.map((s) => (
                    <tr key={s.slot} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">{s.label}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{s.windowStr}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{s.tickets}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        {s.portions} portions
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-slate-700">
                        ₹{s.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/70 border-t border-slate-200 text-slate-900 font-bold">
                  <tr>
                    <td className="py-2.5 px-3.5">Total Today</td>
                    <td className="py-2.5 px-3 text-slate-400 font-normal text-[11px]">3 meal slots</td>
                    <td className="py-2.5 px-3 text-center font-mono">{grandTotals.tickets}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-900">
                      {grandTotals.portions} portions
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      ₹{grandTotals.amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-600 space-y-2">
          <p className="leading-relaxed">
            Connecting a billing integration automates sold portion calculation (prepared portions minus sold portions minus discards) for each meal slot.
          </p>
        </div>
      )}

      {/* Manual Quick Donate Line */}
      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-center gap-2.5 text-xs text-emerald-900">
        <Zap className="w-4 h-4 shrink-0 text-emerald-600" />
        <span className="font-medium">
          No billing software? Use Quick Donate: enter portions manually.
        </span>
      </div>
    </div>
  );
};
