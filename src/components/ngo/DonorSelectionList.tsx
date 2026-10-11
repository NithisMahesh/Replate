import React, { useState, useEffect } from 'react';
import { FoodDonation, MealSlot } from '../../types/surplusLink';
import { Sparkles, Route, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { EmptyState } from '../shared/EmptyState';
import { useToast } from '../shared/Toast';
import { getMealSlotLabel } from '../../utils/posAndPredictionUtils';
import { useSurplusLink } from '../../context/SurplusLinkContext';

interface DonorSelectionListProps {
  donations: FoodDonation[];
  selectedDonationIds: string[];
  onToggleDonation: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onLoadDemoBatch: () => void;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  vanCapacity: number;
  mealSlot?: MealSlot;
}

export const DonorSelectionList: React.FC<DonorSelectionListProps> = ({
  donations,
  selectedDonationIds,
  onToggleDonation,
  onSelectAll,
  onDeselectAll,
  onLoadDemoBatch,
  onGeneratePlan,
  isGenerating,
  vanCapacity,
  mealSlot,
}) => {
  const toast = useToast();
  const { highlightedDonationId } = useSurplusLink();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getUrgencyCountdown = (deadlineTimestamp: number) => {
    const diffMs = deadlineTimestamp - now;
    if (diffMs <= 0) {
      return { label: 'Expired', colorClass: 'bg-slate-100 text-slate-600 border-slate-300' };
    }
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const label = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m ${String(seconds).padStart(2, '0')}s left`;

    if (diffMs > 2 * 60 * 60 * 1000) {
      return { label, colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' };
    } else if (diffMs >= 60 * 60 * 1000) {
      return { label, colorClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
    } else {
      return { label, colorClass: 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold animate-pulse' };
    }
  };

  const selectedDonations = donations.filter((d) => selectedDonationIds.includes(d.id));
  const totalPortions = selectedDonations.reduce(
    (sum, d) => sum + (d.confirmedPortions ?? d.portions ?? 0),
    0
  );
  const percentCapacity = Math.round((totalPortions / vanCapacity) * 100);
  const isOverCapacity = totalPortions > vanCapacity;
  const mealLabel = mealSlot ? getMealSlotLabel(mealSlot) : '';

  const handleLoadDemo = () => {
    onLoadDemoBatch();
    toast.info('Loaded demo confirmed donors into pool');
  };

  return (
    <Card
      title={`Confirmed ${mealLabel} Donors (${donations.length})`}
      subtitle={`Select ${mealLabel.toLowerCase()} donors to batch into collection circuits`}
      action={
        donations.length === 0 ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
            onClick={handleLoadDemo}
          >
            Load demo batch
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline px-1 py-1 cursor-pointer"
            >
              Select all
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-slate-500 hover:text-slate-700 font-semibold underline px-1 py-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {/* Total portions vs van capacity: Progress bar turns RED over 60 */}
        <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <span>Van Load vs Capacity</span>
              {isOverCapacity && (
                <span className="text-rose-700 font-bold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Over 60 (Splits into 2+ trips)
                </span>
              )}
            </span>
            <span
              className={`font-mono text-xs ${
                isOverCapacity
                  ? 'text-rose-700 font-bold'
                  : totalPortions > 0
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500'
              }`}
            >
              {totalPortions} / {vanCapacity} portions ({percentCapacity}%)
            </span>
          </div>

          {/* Progress Bar: Green under 60, TURNS RED OVER 60 */}
          <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverCapacity ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, (totalPortions / vanCapacity) * 100)}%` }}
            />
          </div>
          <details className="text-[11px] text-slate-500 pt-0.5">
            <summary className="font-semibold text-slate-600 cursor-pointer hover:underline">
              {isOverCapacity ? 'Over capacity: Solver will split trips' : 'Van capacity details'}
            </summary>
            <p className="mt-1 leading-relaxed">
              {isOverCapacity
                ? `Selected volume (${totalPortions}) exceeds the ${vanCapacity}-portion vehicle limit. Route solver will automatically optimize into 2+ circuits.`
                : `Electric vehicle holds up to ${vanCapacity} portions per trip to meet food safety deadlines.`}
            </p>
          </details>
        </div>

        {/* Compact Donation List with Checkbox per Donor */}
        {isGenerating ? (
          <div className="space-y-2.5 p-2 animate-pulse" aria-label="Calculating routes">
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-12 bg-slate-100 rounded-xl" />
          </div>
        ) : donations.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-8 w-8 text-slate-400" />}
            title="No confirmed donors waiting"
            description="No surplus donations waiting in this meal pool."
            actionLabel="Load Demo Donors"
            onAction={handleLoadDemo}
            actionIcon={<Sparkles className="h-4 w-4 text-amber-500" />}
          />
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {donations.map((d) => {
              const isChecked = selectedDonationIds.includes(d.id);
              const isHighlighted = d.id === highlightedDonationId;
              const portions = d.confirmedPortions ?? d.portions ?? 0;
              const countdown = getUrgencyCountdown(d.deadlineTimestamp);
              return (
                <label
                  key={d.id}
                  id={`donor-row-${d.id}`}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-all duration-150 ${
                    isHighlighted
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/60 shadow-xs'
                      : isChecked
                      ? 'bg-emerald-50/40 border border-emerald-200/60'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleDonation(d.id)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-slate-900 truncate">{d.providerName}</span>
                        {d.source === 'qr_form' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                            QR
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                        {d.foodItem} • By {d.collectionDeadline}
                      </div>
                      {d.exclusionRecord && (
                        <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md mt-1 truncate">
                          On Hold: {d.exclusionRecord.reasonLabel} ({d.exclusionRecord.detail})
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 ml-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] border ${countdown.colorClass}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{countdown.label}</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
                      {portions} confirmed
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* One Primary Button: [Generate collection plan] */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={selectedDonationIds.length === 0 || isGenerating}
          isLoading={isGenerating}
          icon={<Route className="h-4 w-4" />}
          onClick={onGeneratePlan}
          className="min-h-[48px] text-sm font-bold shadow-xs cursor-pointer"
        >
          {isGenerating ? 'Routing via OSRM...' : 'Generate collection plan'}
        </Button>
      </div>
    </Card>
  );
};
