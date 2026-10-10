import React from 'react';
import { CollectionPlan, TripPlan, ExcludedDonationRecord, Collection } from '../../types/surplusLink';
import { CheckCircle2, Clock, AlertTriangle, ShieldAlert, Check, X } from 'lucide-react';
import { Button } from '../shared/Button';

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
              const isAccepted = collections.some((c) => c.tripNumber === trip.tripNumber);
              return (
                <div
                  key={trip.tripNumber}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4"
                >
                  {/* Trip Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                          T{trip.tripNumber}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-slate-900">
                            Trip #{trip.tripNumber}
                          </h4>
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
                          onClick={() => onAcceptTrip(trip)}
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
                                <span className="text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Deadline Met
                                </span>
                              ) : (
                                <span className="text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1">
                                  <X className="h-3 w-3" /> Deadline Risk
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

                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75"
                    >
                      On hold: {trip.totalPortions} of {minMeals} meals needed
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-semibold">
                      <span>Threshold Progress</span>
                      <span>{percent}% ({trip.totalPortions}/{minMeals} meals)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
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
                className="bg-rose-50/70 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 text-xs text-rose-950 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm truncate">{ex.providerName}</h4>
                  </div>
                  <span className="font-mono font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200 text-xs">
                    {ex.portions} portions
                  </span>
                </div>
                <p className="font-semibold text-rose-900 text-xs leading-relaxed">
                  {ex.reasonLabel}
                </p>
                <p className="text-[11px] text-rose-700 leading-normal">
                  {ex.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
