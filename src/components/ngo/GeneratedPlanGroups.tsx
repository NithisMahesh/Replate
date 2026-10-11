import React, { useState } from 'react';
import { CollectionPlan, TripPlan, ExcludedDonationRecord, Collection } from '../../types/surplusLink';
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';
import { Button } from '../shared/Button';
import { getMealSlotLabel } from '../../utils/posAndPredictionUtils';

interface GeneratedPlanGroupsProps {
  plan: CollectionPlan;
  collections: Collection[];
  onAcceptTrip: (trip: TripPlan) => void;
}

export const GeneratedPlanGroups: React.FC<GeneratedPlanGroupsProps> = ({
  plan,
  collections,
  onAcceptTrip,
}) => {
  const [acceptingTripNumber, setAcceptingTripNumber] = useState<number | null>(null);

  const handleAccept = async (trip: TripPlan) => {
    setAcceptingTripNumber(trip.tripNumber);
    try {
      await onAcceptTrip(trip);
    } finally {
      setAcceptingTripNumber(null);
    }
  };

  const dispatchableTrips = plan.dispatchableTrips || plan.trips.filter((t) => t.dispatchStatus === 'DISPATCHABLE');
  const onHoldTrips = plan.onHoldTrips || plan.trips.filter((t) => t.dispatchStatus === 'ON_HOLD');
  const excludedDonations = plan.excludedDonations || [];

  return (
    <div className="space-y-8 pt-2">
      {/* GROUP 1: DISPATCHABLE TRIPS */}
      {dispatchableTrips.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Dispatchable Trips ({dispatchableTrips.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Ready for driver dispatch
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Routes meeting the 20-meal threshold with all food-safety deadlines verified.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {dispatchableTrips.map((trip) => {
              const isAccepted =
                trip.stops.length > 0 &&
                trip.stops.some((s) => collections.some((c) => c.donationIds.includes(s.donationId)));
              return (
                <div
                  key={trip.tripNumber}
                  className="bg-emerald-50/20 rounded-2xl border-2 border-emerald-300/80 p-5 sm:p-6 shadow-xs space-y-4"
                >
                  {/* Trip Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                          T{trip.tripNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">
                              Trip #{trip.tripNumber}
                            </h4>
                            {trip.mealSlot && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {getMealSlotLabel(trip.mealSlot)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {trip.distanceKm} km • ~{trip.durationMins} mins • {trip.totalPortions} portions
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-xl">
                        Saved {trip.distanceSavedKm} km vs separate trips (estimate)
                      </span>
                      {!isAccepted ? (
                        <Button
                          variant="primary"
                          size="md"
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          loading={acceptingTripNumber === trip.tripNumber}
                          disabled={acceptingTripNumber !== null}
                          onClick={() => handleAccept(trip)}
                          className="min-h-[42px] cursor-pointer"
                        >
                          Accept & dispatch
                        </Button>
                      ) : (
                        <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          Trip dispatched
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stops in Order */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Stops in Order ({trip.stops.length}):
                    </span>
                    <div className="space-y-2">
                      {trip.stops.map((stop) => {
                        const isMet = stop.isDeadlineMet !== false;
                        return (
                          <div
                            key={stop.donationId}
                            className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {stop.stopOrder}
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 text-xs block truncate">
                                  {stop.providerName}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate">
                                  {stop.address}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono text-xs">
                                {stop.portions}p
                              </span>
                              <span className="text-slate-600 font-medium text-xs flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {stop.collectionDeadline}
                              </span>
                              {isMet ? (
                                <span className="text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>Deadline Met</span>
                                </span>
                              ) : (
                                <span className="text-rose-800 bg-rose-100/80 border border-rose-300 px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5">
                                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                                  <span>Deadline Risk</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* GROUP 2: ON HOLD TRIPS */}
      {onHoldTrips.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                On Hold ({onHoldTrips.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Sub-threshold volume
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Trips require at least 20 meals to unlock economically viable dispatch.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {onHoldTrips.map((trip) => {
              const minMeals = trip.minViablePortions || 20;
              const percent = Math.min(100, Math.round((trip.totalPortions / minMeals) * 100));
              return (
                <div
                  key={trip.tripNumber}
                  className="bg-white rounded-2xl border-2 border-amber-200 p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center">
                        T{trip.tripNumber}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Trip #{trip.tripNumber} (On Hold)
                        </h4>
                        <p className="text-xs text-amber-800 font-semibold mt-0.5">
                          {trip.totalPortions} / {minMeals} meals needed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-amber-800 font-semibold">
                        Needs {minMeals} meals, has {trip.totalPortions}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        className="opacity-70 cursor-not-allowed bg-slate-100 text-slate-500 border-slate-200"
                      >
                        Accept & dispatch
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar: on-hold trips as a "12 / 20 meals" progress bar */}
                  <div className="space-y-1.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                    <div className="flex justify-between text-xs text-amber-950 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Threshold Progress</span>
                      </span>
                      <span className="font-mono text-xs text-amber-900 font-extrabold">
                        {trip.totalPortions} / {minMeals} meals ({percent}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <details className="text-xs pt-1">
                      <summary className="text-amber-800 font-bold cursor-pointer hover:underline">
                        Why is this on hold?
                      </summary>
                      <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">
                        Trips require at least {minMeals} meals to unlock economically viable dispatch.
                        When more nearby donations arrive, this trip unlocks automatically.
                      </p>
                    </details>
                  </div>

                  {/* Stops preview */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Stops waiting ({trip.stops.length}):
                    </span>
                    <div className="space-y-1.5">
                      {trip.stops.map((stop) => (
                        <div
                          key={stop.donationId}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-slate-800 truncate">
                            {stop.providerName}
                          </span>
                          <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                            {stop.portions} portions
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* GROUP 3: EXCLUDED DONATIONS */}
      {excludedDonations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Excluded ({excludedDonations.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Safety rule violations
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Filtered out because safe holding window ends before van can arrive at recipient depot.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {excludedDonations.map((ex) => (
              <div
                key={ex.donationId}
                className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-xs space-y-2.5 shadow-xs"
              >
                {/* Red chip with icon */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>{ex.providerName} • {ex.portions} portions</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                    Excluded
                  </span>
                </div>
                <p className="text-xs font-bold text-rose-950">
                  {ex.reasonLabel}
                </p>
                {/* Full reason in expander */}
                <details className="group text-xs pt-0.5">
                  <summary className="text-rose-800 font-bold cursor-pointer hover:underline flex items-center gap-1">
                    <span>Full safety details</span>
                  </summary>
                  <p className="mt-1.5 p-2.5 bg-white rounded-xl border border-rose-200 text-rose-900 text-[11px] leading-relaxed">
                    {ex.detail}
                  </p>
                </details>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
