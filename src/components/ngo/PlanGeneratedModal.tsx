import React, { useEffect, useRef } from 'react';
import { CollectionPlan, MealSlot, TripPlan } from '../../types/surplusLink';
import { getMealSlotLabel } from '../../utils/posAndPredictionUtils';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  Route,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../shared/Button';

interface PlanGeneratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CollectionPlan | null;
  mealSlot?: MealSlot;
  onViewPlan: () => void;
  onAcceptTrip?: (trip: TripPlan) => void;
}

export const PlanGeneratedModal: React.FC<PlanGeneratedModalProps> = ({
  isOpen,
  onClose,
  plan,
  mealSlot,
  onViewPlan,
  onAcceptTrip,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation: Escape key & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on mount
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    // Prevent body background scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  const dispatchableTrips =
    plan.dispatchableTrips && plan.dispatchableTrips.length > 0
      ? plan.dispatchableTrips
      : plan.trips.filter((t) => t.dispatchStatus === 'DISPATCHABLE');
  const onHoldTrips =
    plan.onHoldTrips && plan.onHoldTrips.length > 0
      ? plan.onHoldTrips
      : plan.trips.filter((t) => t.dispatchStatus === 'ON_HOLD');
  const excludedDonations = plan.excludedDonations || [];
  const hasDispatchable = dispatchableTrips.length > 0;
  const firstDispatchableTrip = dispatchableTrips[0];

  const handleAcceptFirst = () => {
    if (firstDispatchableTrip && onAcceptTrip) {
      onClose();
      onAcceptTrip(firstDispatchableTrip);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container - works at 375px width */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-modal-title"
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Route className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="plan-modal-title"
                  className="text-base font-bold text-slate-900 tracking-tight"
                >
                  Collection plan generated
                </h3>
                {mealSlot && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {getMealSlotLabel(mealSlot)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-stop routing summary for {getMealSlotLabel(mealSlot || 'night')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Status Message / Banner */}
          {!hasDispatchable ? (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Info className="w-4 h-4 text-slate-600 shrink-0" />
                <span>No trip can be dispatched yet</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {onHoldTrips.length > 0 && excludedDonations.length > 0
                  ? 'Planned trips are on hold pending additional volume (minimum 20 meals), and other donations were excluded based on food safety or radius limits.'
                  : onHoldTrips.length > 0
                  ? 'Planned trips are on hold because they have not reached the minimum viable 20-meal threshold required for vehicle dispatch.'
                  : excludedDonations.length > 0
                  ? 'All selected donations were excluded due to food safety deadlines or service radius limits.'
                  : 'No eligible donations currently meet the minimum volume and safety threshold for dispatch.'}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {dispatchableTrips.length} trip(s) ready for driver dispatch meeting all thresholds and food-safety deadlines.
              </span>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Dispatchable Trips
              </span>
              <span className="text-xl font-extrabold text-emerald-950 font-mono mt-0.5 block">
                {dispatchableTrips.length}
              </span>
            </div>
            <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Trips On Hold
              </span>
              <span className="text-xl font-extrabold text-amber-950 font-mono mt-0.5 block">
                {onHoldTrips.length}
              </span>
            </div>
            <div className="bg-rose-50/80 border border-rose-200/80 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                Items Excluded
              </span>
              <span className="text-xl font-extrabold text-rose-950 font-mono mt-0.5 block">
                {excludedDonations.length}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Meals Planned
              </span>
              <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
                {plan.totalPortions}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-center col-span-2 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Distance Saved (Estimate)
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono mt-0.5 block">
                Saved ~{plan.totalDistanceSavedKm} km (estimate)
              </span>
            </div>
          </div>

          {/* On Hold Trips Lines ("On hold: X of 20 meals") */}
          {onHoldTrips.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Trips On Hold ({onHoldTrips.length})</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5">
                {onHoldTrips.map((trip) => {
                  const minMeals = trip.minViablePortions || 20;
                  return (
                    <div
                      key={trip.tripNumber}
                      className="bg-amber-50/70 border border-amber-200/70 p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-amber-950">
                        Trip #{trip.tripNumber} ({trip.stops.length} stops)
                      </span>
                      <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                        On hold: {trip.totalPortions} of {minMeals} meals
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Short List of Excluded Items with Reason Text */}
          {excludedDonations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Excluded Donations ({excludedDonations.length})</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {excludedDonations.map((item, idx) => (
                  <div
                    key={item.donationId || idx}
                    className="bg-rose-50/70 border border-rose-200/70 p-2.5 rounded-xl text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-rose-950 truncate">
                        {item.providerName}
                      </span>
                      <span className="font-mono font-bold text-rose-800 shrink-0 text-[11px]">
                        {item.portions} portions
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-tight">
                      <strong>Reason:</strong> {item.detail || item.reasonLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onViewPlan}
            className="cursor-pointer"
          >
            View plan
          </Button>
          {hasDispatchable && (
            <Button
              variant="primary"
              size="md"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleAcceptFirst}
              className="cursor-pointer"
            >
              Accept first trip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
