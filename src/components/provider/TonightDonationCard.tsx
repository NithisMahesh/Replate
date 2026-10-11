import React, { useState } from 'react';
import { FoodDonation, MealSlot } from '../../types/surplusLink';
import {
  ChevronDown, ChevronUp, Clock, CheckCircle2, Truck,
  ShieldCheck, RotateCcw, Sparkles, PauseCircle, AlertTriangle,
  Thermometer, ChefHat, CalendarClock, UtensilsCrossed,
} from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { getMealSlotLabel } from '../../utils/posAndPredictionUtils';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { DonationTimeline } from '../shared/DonationTimeline';

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

// Compute countdown text + colour class from a deadline string "Pickup by HH:MM"
function useDeadlineCountdown(deadlineFormatted: string): { text: string; cls: string } {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const match = deadlineFormatted.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return { text: deadlineFormatted, cls: 'text-slate-600' };

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  const deadline = new Date();
  deadline.setHours(h, m, 0, 0);
  if (deadline.getTime() < now) deadline.setDate(deadline.getDate() + 1);

  const diffMs = deadline.getTime() - now;
  const diffMin = Math.round(diffMs / 60_000);

  let text: string;
  let cls: string;
  if (diffMin <= 0) {
    text = 'Deadline passed';
    cls = 'text-red-700 font-bold';
  } else if (diffMin < 60) {
    text = `${diffMin} min left`;
    cls = 'text-red-600 font-bold animate-pulse';
  } else if (diffMin < 120) {
    text = `${Math.floor(diffMin / 60)}h ${diffMin % 60}m left`;
    cls = 'text-amber-700 font-semibold';
  } else {
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    text = `${hrs}h${mins > 0 ? ` ${mins}m` : ''} left`;
    cls = 'text-green-700 font-semibold';
  }
  return { text, cls };
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
  const [showDetails, setShowDetails] = useState(false);
  const [isEditingSold, setIsEditingSold] = useState(false);
  const [soldInput, setSoldInput] = useState(String(calculation.sold));
  const toast = useToast();
  const mealLabel = getMealSlotLabel(mealSlot);
  const { eventLog, highlightedDonationId } = useSurplusLink();
  const countdown = useDeadlineCountdown(pickupDeadlineFormatted);

  React.useEffect(() => {
    setSoldInput(String(calculation.sold));
    setIsEditingSold(false);
  }, [calculation.sold, mealSlot]);

  const handleSaveSold = () => {
    const val = parseInt(soldInput, 10);
    if (isNaN(val) || val < 0) {
      toast.error('Enter a valid sold quantity (0 or more)');
      return;
    }
    if (soldMode?.onOverride) {
      soldMode.onOverride(val);
      toast.success(
        soldMode.isBillingConnected
          ? `Sold quantity overridden to ${val} portions`
          : `Updated sold quantity to ${val} portions`
      );
    }
    setIsEditingSold(false);
  };

  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmWithToast = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      await onConfirm();
      toast.success(`Confirmed ${surplusPortions} portions of ${mealLabel}!`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSkipWithToast = () => {
    onNoSurplusTonight();
    toast.undo(`Recorded: No surplus for ${mealLabel.toLowerCase()}`, () => {
      onUnskip();
    });
  };

  const handleUnskipWithToast = () => {
    onUnskip();
    toast.info(`Surplus logging enabled for ${mealLabel.toLowerCase()}`);
  };

  // ── Skipped state ────────────────────────────────────────────────────────
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
            Zero surplus recorded. Dispatchers have updated collection routes.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="secondary" onClick={handleUnskipWithToast}>
            Log surplus instead
          </Button>
        </div>
      </div>
    );
  }

  // ── Confirmed/In-progress donation state ─────────────────────────────────
  if (tonightDonation) {
    const isScheduled = tonightDonation.status === 'Scheduled';
    const isHighlighted = highlightedDonationId === tonightDonation.id;
    const isSubThreshold = tonightDonation.status === 'Confirmed' && tonightDonation.confirmedPortions < 15;
    const activeExclusion = tonightDonation.exclusionRecord || exclusionBanner;

    return (
      <div
        id={`donation-card-${tonightDonation.id}`}
        className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-5 transition-all duration-200 ${
          isHighlighted
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/10'
            : 'border-slate-200/80'
        }`}
      >
        {/* Shared timeline */}
        <DonationTimeline donation={tonightDonation} events={eventLog} />

        {/* On-Hold notice */}
        {isSubThreshold && !activeExclusion && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <PauseCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Surplus batch on temporary hold</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              <strong>{tonightDonation.confirmedPortions} portions</strong> is under the 15-portion threshold.
              Route optimizer will dispatch once paired with nearby stops.
            </p>
          </div>
        )}

        {/* Exclusion notice */}
        {activeExclusion && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 space-y-1.5 shadow-xs animate-in fade-in">
            <div className="font-bold flex items-center gap-2 text-rose-800 text-sm">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Surplus on hold · {activeExclusion.reasonLabel || 'Excluded from route'}</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-semibold">{activeExclusion.detail}</p>
            <p className="text-[11px] text-rose-700">
              Adjust the pickup deadline or update portions to qualify for the next dispatch.
            </p>
          </div>
        )}

        {/* Hero: big portions number */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>{mealLabel} Donation Published</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
              {tonightDonation.confirmedPortions}
              <span className="text-base font-normal text-slate-500 ml-1">portions</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">{tonightDonation.foodItem}</p>
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
            <span>
              Picked up by driver ({tonightDonation.collectedPortions || tonightDonation.confirmedPortions} portions).
              Intake verification pending at NGO hub.
            </span>
          </div>
        )}

        {(tonightDonation.status === 'Received' || tonightDonation.status === 'Distributed') && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Delivered and distributed to community shelter residents!</span>
          </div>
        )}

        {tonightDonation.status === 'Confirmed' && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Awaiting driver dispatch. Route planner is batching your stop.</span>
          </div>
        )}
      </div>
    );
  }

  // ── Pre-confirm: hero card ────────────────────────────────────────────────
  const hasIncompleteDefaults = missingFields.length > 0;

  return (
    <>
      {/* Card body — no primary button here (it lives in sticky bar below) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5 transition-all duration-150 pb-[80px] sm:pb-5">

        {/* Exclusion notice */}
        {exclusionBanner && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 space-y-1.5 shadow-xs animate-in fade-in">
            <div className="font-bold flex items-center gap-2 text-rose-800 text-sm">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>{exclusionBanner.reasonLabel || 'Excluded from route'}</span>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-semibold">{exclusionBanner.detail}</p>
            <p className="text-[11px] text-rose-700">
              Adjust the deadline or change portions to re-qualify.
            </p>
          </div>
        )}

        {/* ── HERO: big portions number ── */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Estimated surplus · {mealLabel}
          </p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-slate-900 leading-none tabular-nums">
              {surplusPortions}
            </span>
            <span className="text-lg text-slate-500 mb-1">portions</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ~ {calculation.source}
          </p>
        </div>

        {/* ── Icon chips: food type, storage, deadline ── */}
        <div className="flex flex-wrap gap-2">
          {/* Food type */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 min-h-[32px]">
            <UtensilsCrossed className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Veg surplus meals</span>
          </span>

          {/* Storage */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 min-h-[32px]">
            <Thermometer className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Room temp</span>
          </span>

          {/* Deadline chip — taps to edit; color-coded countdown */}
          <button
            type="button"
            onClick={onOpenDeadlineSheet}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 min-h-[32px] hover:bg-slate-200/80 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label={`Deadline: ${pickupDeadlineFormatted}. Tap to edit.`}
          >
            <CalendarClock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>{pickupDeadlineFormatted}</span>
            <span className={`ml-0.5 ${countdown.cls}`}>· {countdown.text}</span>
          </button>
        </div>

        {/* Pending approval notice */}
        {!isApproved && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              <span>Account pending verification</span>
            </div>
            <p className="leading-relaxed">
              Your food business registration is pending admin approval.
              You cannot publish donations until approved.
              Presenters can approve this in <strong>Demo Tools</strong>.
            </p>
          </div>
        )}

        {/* ── Collapsed "Details" expander ── */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            id="toggle-donation-details"
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700 min-h-[44px] cursor-pointer"
            aria-expanded={showDetails}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Details — estimation, food safety and billing notes</span>
            </div>
            {showDetails
              ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
              : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
          </button>

          {showDetails && (
            <div className="p-4 space-y-4 text-xs border-t border-slate-200 bg-white animate-in fade-in slide-in-from-top-1">
              {/* Estimation breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ChefHat className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Surplus estimate — {mealLabel}</span>
                  <span className="font-mono text-[11px] text-slate-500 ml-auto">
                    {calculation.prepared} − {calculation.sold} − {calculation.discards} ={' '}
                    <strong className="text-emerald-700">{surplusPortions}</strong> portions
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Prepared */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      1. Prepared
                    </span>
                    <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                      {calculation.prepared}
                    </span>
                    <span className="text-[10px] text-slate-400">portions</span>
                  </div>

                  {/* Sold */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        2. Sold
                      </span>
                      {soldMode?.isBillingConnected && soldMode?.isAuto && (
                        <span id="sold-qty-auto-badge" className="px-1.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Auto
                        </span>
                      )}
                      {soldMode?.isBillingConnected && soldMode?.isOverridden && (
                        <span id="sold-qty-manual-override-badge" className="px-1.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Override
                        </span>
                      )}
                      {!soldMode?.isBillingConnected && (
                        <span className="text-[9px] text-slate-400 font-medium">Manual</span>
                      )}
                    </div>

                    {isEditingSold ? (
                      <div className="flex items-center gap-1 pt-0.5">
                        <input
                          type="number"
                          min="0"
                          id="input-override-sold-qty"
                          value={soldInput}
                          onChange={(e) => setSoldInput(e.target.value)}
                          className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold border rounded-lg border-slate-300 focus:ring-1 focus:ring-emerald-500"
                        />
                        <button type="button" id="btn-save-override-sold-qty" onClick={handleSaveSold} className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer">
                          Save
                        </button>
                        <button type="button" onClick={() => setIsEditingSold(false)} className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-700 cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-sm font-bold text-slate-800 font-mono" id="sold-qty-display">
                          {calculation.sold}
                        </span>
                        {soldMode?.isBillingConnected ? (
                          soldMode?.isOverridden ? (
                            <div className="flex items-center gap-1">
                              <button type="button" id="btn-edit-override-sold-qty" onClick={() => setIsEditingSold(true)} className="text-[10px] font-semibold text-amber-800 hover:underline cursor-pointer">Edit</button>
                              <span className="text-slate-300">•</span>
                              <button type="button" id="btn-reset-auto-sold-qty" onClick={() => { soldMode.onResetToAuto(); toast.info('Reverted to live POS auto-sync'); }} className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer">Reset</button>
                            </div>
                          ) : (
                            <button type="button" id="btn-override-sold-qty" onClick={() => setIsEditingSold(true)} className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer">Override</button>
                          )
                        ) : (
                          <button type="button" id="btn-edit-manual-sold-qty" onClick={() => setIsEditingSold(true)} className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer">Change</button>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 truncate">{calculation.source}</p>
                  </div>

                  {/* Discards */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      3. Discards
                    </span>
                    <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                      {calculation.discards}
                    </span>
                    <span className="text-[10px] text-slate-400">buffer / waste</span>
                  </div>
                </div>
              </div>

              {/* Food safety note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Food safety note
                </div>
                <p className="leading-relaxed text-[11px]">
                  Once confirmed, pickup must happen before the deadline. Food stored beyond the window
                  will be automatically excluded from routes to protect recipient safety.
                </p>
              </div>

              {/* Billing note */}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Donation data is logged for your monthly impact report and reconciliation with billing if connected.
              </p>
            </div>
          )}
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="secondary" size="md" fullWidth onClick={onChangeAmount}>
            Change amount
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleSkipWithToast}
            className="hover:!bg-rose-50 hover:!text-rose-700 hover:!border-rose-200 text-xs sm:text-sm"
          >
            No surplus
          </Button>
        </div>
      </div>

      {/* ── Sticky bottom action bar (mobile primary button) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
        {!isApproved ? (
          <Button variant="secondary" size="lg" fullWidth disabled className="opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 border-slate-300">
            Approval required
          </Button>
        ) : !isProductionSaved ? (
          <Button id="confirm-surplus-btn" variant="secondary" size="lg" fullWidth disabled className="opacity-70 cursor-not-allowed bg-slate-100 text-slate-600 border-slate-300 font-semibold">
            Save {mealLabel} production first
          </Button>
        ) : hasIncompleteDefaults ? (
          <Button id="confirm-surplus-btn" variant="primary" size="lg" fullWidth onClick={onOpenMissingDetails} className="!bg-amber-500 hover:!bg-amber-600 !border-amber-600 text-slate-950 font-semibold">
            Set {missingFields[0]} to continue
          </Button>
        ) : (
          <Button id="confirm-surplus-btn" variant="primary" size="lg" fullWidth loading={isConfirming} disabled={isConfirming} onClick={handleConfirmWithToast}>
            Confirm {surplusPortions} portions of {mealLabel}
          </Button>
        )}
      </div>

      {/* ── Desktop inline primary button (hidden on mobile) ── */}
      <div className="hidden sm:block -mt-3 px-5 pb-5 bg-white rounded-b-2xl border-x border-b border-slate-200/80 shadow-xs">
        {!isApproved ? (
          <Button variant="secondary" size="lg" fullWidth disabled className="opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 border-slate-300">
            Approval required to confirm surplus
          </Button>
        ) : !isProductionSaved ? (
          <Button id="confirm-surplus-btn-desktop" variant="secondary" size="lg" fullWidth disabled className="opacity-70 cursor-not-allowed bg-slate-100 text-slate-600 border-slate-300 font-semibold">
            Save {mealLabel} production above to confirm surplus
          </Button>
        ) : hasIncompleteDefaults ? (
          <Button id="confirm-surplus-btn-desktop" variant="primary" size="lg" fullWidth onClick={onOpenMissingDetails} className="!bg-amber-500 hover:!bg-amber-600 !border-amber-600 text-slate-950 font-semibold">
            Set {missingFields[0]} to confirm {mealLabel} ({surplusPortions} portions)
          </Button>
        ) : (
          <Button id="confirm-surplus-btn-desktop" variant="primary" size="lg" fullWidth loading={isConfirming} disabled={isConfirming} onClick={handleConfirmWithToast}>
            Confirm {surplusPortions} portions of {mealLabel}
          </Button>
        )}
      </div>
    </>
  );
};
