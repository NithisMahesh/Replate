import React, { useState } from 'react';
import { TripPlan } from '../../types/surplusLink';
import { CheckCircle2, Clock, ChevronDown, ChevronUp, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { StatusChip } from '../shared/StatusChip';
import { useToast } from '../shared/Toast';

interface TripPlanCardProps {
  trip: TripPlan;
  onAcceptTrip: (trip: TripPlan) => void;
  isAlreadyAccepted?: boolean;
}

export const TripPlanCard: React.FC<TripPlanCardProps> = ({
  trip,
  onAcceptTrip,
  isAlreadyAccepted = false,
}) => {
  const toast = useToast();
  const [showWhy, setShowWhy] = useState(false);
  const isDispatchable = trip.dispatchStatus === 'DISPATCHABLE';
  const minNeeded = trip.minViablePortions || 20;
  const percentMin = Math.min(100, Math.round((trip.totalPortions / minNeeded) * 100));

  const handleAccept = () => {
    if (!isDispatchable) return;
    onAcceptTrip(trip);
    toast.success(`Trip #${trip.tripNumber} accepted! Dispatched to driver.`);
  };

  return (
    <div
      className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-150 ${
        isDispatchable
          ? 'border-slate-200/80'
          : 'border-amber-200 bg-amber-50/10'
      }`}
    >
      {/* Trip Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs ${
              isDispatchable
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : 'bg-amber-500 shadow-amber-500/30 text-slate-950'
            }`}
          >
            T{trip.tripNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-900">Trip #{trip.tripNumber}</h4>
              {isDispatchable ? (
                <StatusChip variant="done">Dispatchable</StatusChip>
              ) : (
                <StatusChip variant="pending">On Hold</StatusChip>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {trip.stops.length} stops • {trip.distanceKm} km • ~{trip.durationMins} mins • {trip.totalPortions} portions
            </p>
          </div>
        </div>

        {/* Saved Distance & Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          {trip.distanceSavedKm > 0 && (
            <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-emerald-900 text-xs font-semibold">
              Saved {trip.distanceSavedKm} km vs separate trips (estimate)
            </div>
          )}
          {!isAlreadyAccepted ? (
            <Button
              variant="primary"
              size="md"
              disabled={!isDispatchable}
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleAccept}
              title={
                !isDispatchable
                  ? `Trip requires at least ${minNeeded} meals to dispatch (Rule 1).`
                  : undefined
              }
            >
              {isDispatchable ? 'Accept & dispatch' : 'Accept trip (On hold)'}
            </Button>
          ) : (
            <StatusChip variant="done">
              Trip accepted
            </StatusChip>
          )}
        </div>
      </div>

      {/* RULE 1 Notice & Progress Bar for ON_HOLD Trips */}
      {!isDispatchable && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Rule 1: {trip.onHoldReason || `On hold: ${trip.totalPortions} of ${minNeeded} meals needed`}</span>
            </span>
            <span>
              {trip.totalPortions} / {minNeeded} meals ({percentMin}%)
            </span>
          </div>
          <div className="h-2 w-full bg-amber-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${percentMin}%` }}
            />
          </div>
          <p className="text-xs text-amber-800">
            Trip will automatically unlock for dispatch once additional confirmed donations are grouped.
          </p>
        </div>
      )}

      {/* Stops in Order */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Stops in order ({trip.stops.length}):
        </span>
        <div className="space-y-2">
          {trip.stops.map((stop, idx) => {
            const isDeadlineMet = stop.isDeadlineMet !== false;
            return (
              <div
                key={stop.donationId}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{stop.providerName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Deadline: {stop.collectionDeadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                    {stop.portions} portions
                  </span>
                  {isDeadlineMet ? (
                    <StatusChip variant="done">
                      On time
                    </StatusChip>
                  ) : (
                    <StatusChip variant="failed">
                      Tight deadline
                    </StatusChip>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "Why?" Expandable: Food Safety Arrival Check */}
      <div className="border border-slate-200/80 rounded-xl bg-slate-50/70 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowWhy(!showWhy)}
          className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between text-slate-700 hover:text-slate-900 font-medium transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Why? Food-Safety Arrival Check (Rule 2)</span>
          </span>
          {showWhy ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showWhy && (
          <div className="p-3.5 border-t border-slate-200/70 bg-white space-y-2.5 animate-in fade-in duration-150">
            <p className="text-xs text-slate-600 leading-relaxed">
              Every stop's arrival at the NGO depot must occur before that donation's safe window ends:
              <br />
              <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-800">
                arrivalAtNgo = start + travelToStop + 5m handling + remainingRouteToNGO + 10m handover buffer
              </code>
            </p>
            <div className="divide-y divide-slate-100">
              {trip.stops.map((stop) => {
                const arrivalFormatted = stop.arrivalAtNgoFormatted || 'En route';
                const deadlineFormatted = stop.deadlineFormatted || stop.collectionDeadline;
                const margin = stop.marginMinutes ?? 0;
                const isSafe = stop.isDeadlineMet;

                return (
                  <div
                    key={stop.donationId}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs first:pt-1 last:pb-1"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{stop.providerName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Delivered to NGO by: <strong className="text-slate-700">{arrivalFormatted}</strong> • Safe until: <strong className="text-slate-700">{deadlineFormatted}</strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isSafe ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          +{margin} min margin
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                          Late by {Math.abs(margin)} min
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
