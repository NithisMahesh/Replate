import React, { useState } from 'react';
import { Provider, POSTransaction, FoodDonation } from '../../types/surplusLink';
import { HistoricalDonationRecord } from '../../utils/posAndPredictionUtils';
import { X, Sparkles, CreditCard, RotateCcw, ListFilter, CheckCircle2 } from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';

interface ProviderDemoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider;
  providers: Provider[];
  onSelectProvider: (id: string) => void;
  isPosConnected: boolean;
  onTogglePos: () => void;
  posTransactions: POSTransaction[];
  posTotalSoldPortions: number;
  predictedSurplus: number;
  historyRecords: HistoricalDonationRecord[];
  onApplyPrediction: (portions: number) => void;
  tonightDonation: FoodDonation | null;
  onResetData: () => void;
}

export const ProviderDemoDrawer: React.FC<ProviderDemoDrawerProps> = ({
  isOpen,
  onClose,
  provider,
  providers,
  onSelectProvider,
  isPosConnected,
  onTogglePos,
  posTransactions,
  posTotalSoldPortions,
  predictedSurplus,
  historyRecords,
  onApplyPrediction,
  tonightDonation,
  onResetData,
}) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyPrediction(predictedSurplus);
    toast.success(`Applied predicted ~${predictedSurplus} portions`);
    onClose();
  };

  const handleReset = () => {
    onResetData();
    toast.info('Demo data reset to initial defaults');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Demo & Simulation Tools</h3>
            <p className="text-xs text-slate-500">Test edge cases, billing POS feeds, and predictions</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors duration-150 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Provider Switcher */}
        <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Switch Active Provider
          </label>
          <select
            value={provider.id}
            onChange={(e) => onSelectProvider(e.target.value)}
            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Connect POS */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-900">Billing / POS Integration</span>
            </div>
            <button
              type="button"
              onClick={onTogglePos}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 cursor-pointer ${
                isPosConnected ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150 ${
                  isPosConnected ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isPosConnected
              ? `Connected: ${posTotalSoldPortions} portions auto-synced from 4 mock POS register sales.`
              : 'Toggle to simulate live POS feed auto-filling sold quantity.'}
          </p>
          {isPosConnected && (
            <div>
              <button
                type="button"
                onClick={() => setShowTransactions(!showTransactions)}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>{showTransactions ? 'Hide POS receipts' : 'View mock transactions'}</span>
              </button>
              {showTransactions && (
                <div className="mt-2 space-y-1 max-h-36 overflow-y-auto bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                  {posTransactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                      <span>{tx.item} ({tx.quantityPortions} qty)</span>
                      <span className="font-mono text-slate-500">₹{tx.totalAmount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Rolling-Average Surplus Prediction */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-900">Rolling Surplus Prediction</span>
          </div>
          <div className="text-sm font-semibold text-amber-950 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
            <span>Likely surplus tonight: ~{predictedSurplus}</span>
            <span className="text-xs font-medium text-amber-800 bg-white/80 px-2 py-0.5 rounded-lg">
              7-day avg
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Computed from past {historyRecords.length} recorded donation logs.
          </p>
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleApply}
          >
            Apply predicted ~{predictedSurplus} portions
          </Button>
        </div>

        {/* 4. Tonight status info */}
        {tonightDonation && (
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-xs space-y-1">
            <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Tonight's donation ID: {tonightDonation.id}</span>
            </div>
            <p className="text-xs text-slate-600">
              Status: <strong>{tonightDonation.status}</strong> • OTP: <strong>{tonightDonation.verificationOtp}</strong>
            </p>
          </div>
        )}

        {/* 5. Reset All Demo Data */}
        <div className="pt-auto border-t border-slate-100 pt-4">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            icon={<RotateCcw className="h-4 w-4 text-slate-500" />}
            onClick={handleReset}
          >
            Reset Demo State to Initial Defaults
          </Button>
        </div>
      </div>
    </div>
  );
};
