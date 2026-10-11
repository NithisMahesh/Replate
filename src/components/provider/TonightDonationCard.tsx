import React, { useState } from 'react';
import { FoodDonation, MealSlot } from '../../types/surplusLink';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, ShieldCheck, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { getMealSlotLabel } from '../../utils/posAndPredictionUtils';

export interface SoldQuantityMode {
  isBillingConnected: boolean;
  isAuto: boolean;
  isOverridden: boolean;
  onOverride: (newSold: number) => void;
  onResetToAuto: () => void;
}

interface TonightDonationCardProps {
  surplusPortions: number;
  missingFields: string[];
  pickupDeadlineFormatted: string;
  onOpenDeadlineSheet: () => void;
  calculation: { prepared: number; sold: number; discards: number; source: string };
  tonightDonation: FoodDonation | null;
  isSkippedTonight: boolean;
  onConfirm: () => void;
  onChangeAmount: () => void;
  onNoSurplusTonight: () => void;
  onUnskip: () => void;
  onOpenMissingDetails: () => void;
  isApproved?: boolean;
  exclusionBanner?: { reasonLabel: string; detail: string } | null;
  isProductionSaved?: boolean;
  mealSlot?: MealSlot;
  soldMode?: SoldQuantityMode;
}

export const TonightDonationCard: React.FC<TonightDonationCardProps> = ({
  surplusPortions,
  missingFields,
  pickupDeadlineFormatted,
  onOpenDeadlineSheet,
  calculation,
  tonightDonation,
  isSkippedTonight,
  onConfirm,
  onChangeAmount,
  onNoSurplusTonight,
  onUnskip,
  onOpenMissingDetails,
  isApproved = true,
  exclusionBanner,
  isProductionSaved = true,
  mealSlot = 'night',
  soldMode,
}) => {
  const [showCalculation, setShowCalculation] = useState(false);
  const [isEditingSold, setIsEditingSold] = useState(false);
  const [soldInput, setSoldInput] = useState(String(calculation.sold));
  const toast = useToast();
  const mealLabel = getMealSlotLabel(mealSlot);

  React.useEffect(() => {
    setSoldInput(String(calculation.sold));
    setIsEditingSold(false);
  }, [calculation.sold, mealSlot]);

  const handleSaveSold = () => {
    const val = parseInt(soldInput, 10);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid sold quantity (0 or more)');
      return;
    }
    if (soldMode?.onOverride) {
      soldMode.onOverride(val);
      toast.success(
        soldMode.isBillingConnected
          ? `Sold quantity manually overridden to ${val} portions`
          : `Updated sold quantity to ${val} portions`
      );
    }
    setIsEditingSold(false);
  };

  const handleConfirmWithToast = () => {
    onConfirm();
    toast.success(`Confirmed ${surplusPortions} portions of ${mealLabel}!`);
  };

  const handleSkipWithToast = () => {
    onNoSurplusTonight();
    toast.info(`Recorded: No surplus for ${mealLabel.toLowerCase()}`);
  };

  const handleUnskipWithToast = () => {
    onUnskip();
    toast.info(`Surplus logging enabled for ${mealLabel.toLowerCase()}`);
  };

  if (isSkippedTonight) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4 transition-all duration-150">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <RotateCcw className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            No surplus logged for {mealLabel.toLowerCase()}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your kitchen is logged as zero surplus for {mealLabel.toLowerCase()}. Dispatchers have updated collection routes.
          </p>
        </div>
        <div className="pt-2">
          <Button
            variant="secondary"
            onClick={handleUnskipWithToast}
          >
            Log surplus instead
          </Button>
        </div>
      </div>
    );
  }

  if (tonightDonation) {
    const isScheduled = tonightDonation.status === 'Scheduled';
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5 transition-all duration-150">
        {/* Red banner if excluded by route planner */}
        {exclusionBanner && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 space-y-1.5 shadow-xs animate-in fade-in">
            <div className="font-bold flex items-center gap-2 text-rose-800 text-sm">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>{exclusionBanner.reasonLabel || 'Excluded from Route'}</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-semibold">
              {exclusionBanner.detail}
            </p>
            <p className="text-[11px] text-rose-700">
              The algorithm excluded this donation to protect food safety. You can adjust the deadline or change portions.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>{mealLabel} Donation Published</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
              {tonightDonation.confirmedPortions} portions confirmed
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{tonightDonation.foodItem}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 self-start sm:self-auto">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Pickup by {tonightDonation.collectionDeadline}</span>
          </div>
        </div>

        {isScheduled && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span>Driver: {tonightDonation.driverName || 'Murugan Selvam'}</span>
              </div>
              <p className="text-xs text-slate-600">Show this code to the driver:</p>
            </div>
            <div className="bg-white border-2 border-emerald-500 rounded-xl px-5 py-2 text-center shadow-xs">
              <span className="text-2xl font-bold tracking-widest text-emerald-950 font-mono">
                {tonightDonation.verificationOtp || '4821'}
              </span>
            </div>
          </div>
        )}

        {tonightDonation.status === 'Collected' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="leading-relaxed">Picked up by driver ({tonightDonation.collectedPortions || tonightDonation.confirmedPortions} portions). Intake verified at NGO hub soon.</span>
          </div>
        )}

        {(tonightDonation.status === 'Received' || tonightDonation.status === 'Distributed') && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">Delivered & distributed to community shelter residents!</span>
          </div>
        )}

        {tonightDonation.status === 'Confirmed' && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="leading-relaxed">Awaiting driver dispatch. Route planner is batching your stop.</span>
          </div>
        )}
      </div>
    );
  }

  const hasIncompleteDefaults = missingFields.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5 transition-all duration-150">
      {/* Red banner if excluded by route planner */}
      {exclusionBanner && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 space-y-1.5 shadow-xs animate-in fade-in">
          <div className="font-bold flex items-center gap-2 text-rose-800 text-sm">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>{exclusionBanner.reasonLabel || 'Excluded from Route'}</span>
          </div>
          <p className="text-xs text-rose-900 leading-relaxed font-semibold">
            {exclusionBanner.detail}
          </p>
          <p className="text-[11px] text-rose-700">
            The algorithm excluded this donation to protect food safety. You can adjust the deadline or change portions.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight leading-tight">
          You may have {surplusPortions} portions of surplus for {mealLabel}
        </h2>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenDeadlineSheet}
            className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 transition-colors duration-150 cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{pickupDeadlineFormatted}</span>
            <span className="text-xs text-slate-400 ml-0.5">• Edit</span>
          </button>
        </div>
      </div>

      {/* Estimation Breakdown Section */}
      <div className="border border-slate-200/80 rounded-2xl bg-slate-50/70 p-4 text-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Surplus estimation math ({mealLabel})</span>
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            {calculation.prepared} − {calculation.sold} − {calculation.discards} = <strong className="text-emerald-700 font-bold">{surplusPortions} portions</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* 1. Prepared */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              1. Prepared
            </span>
            <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
              {calculation.prepared} portions
            </span>
            <span className="text-[10px] text-slate-400">Meal production above</span>
          </div>

          {/* 2. Sold */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                2. Sold
              </span>
              {soldMode?.isBillingConnected && soldMode?.isAuto && (
                <span
                  id="sold-qty-auto-badge"
                  className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                >
                  Auto
                </span>
              )}
              {soldMode?.isBillingConnected && soldMode?.isOverridden && (
                <span
                  id="sold-qty-manual-override-badge"
                  className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                >
                  Manual override
                </span>
              )}
              {!soldMode?.isBillingConnected && (
                <span className="text-[9px] text-slate-400 font-medium">Manual</span>
              )}
            </div>

            {isEditingSold ? (
              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  type="number"
                  min="0"
                  id="input-override-sold-qty"
                  value={soldInput}
                  onChange={(e) => setSoldInput(e.target.value)}
                  className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold border rounded-lg border-slate-300 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  id="btn-save-override-sold-qty"
                  onClick={handleSaveSold}
                  className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSold(false)}
                  className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-sm font-bold text-slate-800 font-mono" id="sold-qty-display">
                  {calculation.sold} portions
                </span>

                {soldMode?.isBillingConnected ? (
                  soldMode?.isOverridden ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id="btn-edit-override-sold-qty"
                        onClick={() => setIsEditingSold(true)}
                        className="text-[10px] font-semibold text-amber-800 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        id="btn-reset-auto-sold-qty"
                        onClick={() => {
                          soldMode.onResetToAuto();
                          toast.info('Reverted to live POS auto-sync');
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Reset to Auto
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="btn-override-sold-qty"
                      onClick={() => setIsEditingSold(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      Override
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    id="btn-edit-manual-sold-qty"
                    onClick={() => setIsEditingSold(true)}
                    className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>
            )}
            <p className="text-[10px] text-slate-400 truncate">{calculation.source}</p>
          </div>

          {/* 3. Discards */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              3. Discards
            </span>
            <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
              {calculation.discards} portions
            </span>
            <span className="text-[10px] text-slate-400">Buffer / kitchen waste</span>
          </div>
        </div>
      </div>

      {/* Pending approval notice */}
      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            <span>Account Pending Verification</span>
          </div>
          <p className="leading-relaxed">
            Your food business registration is currently pending admin approval. You cannot publish donations until approved. Presenters can approve this with 1-click in the <strong>Demo Tools</strong> drawer.
          </p>
        </div>
      )}

      {/* Main Confirm Button */}
      <div>
        {!isApproved ? (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            className="opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 border-slate-300"
          >
            Approval Required to Confirm Surplus
          </Button>
        ) : !isProductionSaved ? (
          <Button
            id="confirm-surplus-btn"
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            className="opacity-70 cursor-not-allowed bg-slate-100 text-slate-600 border-slate-300 font-semibold"
          >
            Save {mealLabel} Production above to confirm surplus
          </Button>
        ) : hasIncompleteDefaults ? (
          <Button
            id="confirm-surplus-btn"
            variant="primary"
            size="lg"
            fullWidth
            onClick={onOpenMissingDetails}
            className="!bg-amber-500 hover:!bg-amber-600 !border-amber-600 text-slate-950 font-semibold"
          >
            Set {missingFields[0]} to confirm {mealLabel} ({surplusPortions} portions)
          </Button>
        ) : (
          <Button
            id="confirm-surplus-btn"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleConfirmWithToast}
          >
            Confirm {surplusPortions} portions of {mealLabel}
          </Button>
        )}
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={onChangeAmount}
        >
          Change amount
        </Button>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={handleSkipWithToast}
          className="hover:!bg-rose-50 hover:!text-rose-700 hover:!border-rose-200 text-xs sm:text-sm"
        >
          No surplus for {mealLabel}
        </Button>
      </div>
    </div>
  );
};
