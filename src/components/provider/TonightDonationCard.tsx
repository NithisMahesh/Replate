import React, { useState } from 'react';
import { FoodDonation } from '../../types/surplusLink';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, ShieldCheck, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';

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
}) => {
  const [showCalculation, setShowCalculation] = useState(false);
  const toast = useToast();

  const handleConfirmWithToast = () => {
    onConfirm();
    toast.success(`Confirmed ${surplusPortions} portions for tonight!`);
  };

  const handleSkipWithToast = () => {
    onNoSurplusTonight();
    toast.info('Recorded: No surplus tonight');
  };

  const handleUnskipWithToast = () => {
    onUnskip();
    toast.info('Surplus logging enabled for tonight');
  };

  if (isSkippedTonight) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4 transition-all duration-150">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <RotateCcw className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            No surplus logged tonight
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your kitchen is logged as zero surplus for tonight. Dispatchers have updated collection routes.
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
              <span>Tonight's Donation Published</span>
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
            <span className="leading-relaxed">Delivered & distributed to community night shelter residents!</span>
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
          You may have {surplusPortions} portions of surplus tonight
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

      {/* Collapsed calculation section */}
      <div className="border border-slate-200/80 rounded-xl bg-slate-50/70 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowCalculation(!showCalculation)}
          className="min-h-[44px] w-full px-4 py-2.5 flex items-center justify-between text-slate-600 hover:text-slate-900 text-left font-medium transition-colors duration-150 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>How we estimated this</span>
          </span>
          {showCalculation ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {showCalculation && (
          <div className="px-4 pb-3 pt-1 border-t border-slate-200/60 text-slate-600 space-y-1.5">
            <div className="font-mono text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
              {calculation.prepared} prepared − {calculation.sold} sold − {calculation.discards} discards = <strong className="text-emerald-700">{surplusPortions} portions</strong>
            </div>
            <p className="text-xs text-slate-500">{calculation.source}</p>
          </div>
        )}
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
        ) : hasIncompleteDefaults ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onOpenMissingDetails}
            className="!bg-amber-500 hover:!bg-amber-600 !border-amber-600 text-slate-950 font-semibold"
          >
            Set {missingFields[0]} to confirm ({surplusPortions} portions)
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleConfirmWithToast}
          >
            Confirm {surplusPortions} portions
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
          className="hover:!bg-rose-50 hover:!text-rose-700 hover:!border-rose-200"
        >
          No surplus tonight
        </Button>
      </div>
    </div>
  );
};
