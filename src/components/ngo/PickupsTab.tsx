import React, { useState, useEffect } from 'react';
import {
  Collection,
  FoodDonation,
  Provider,
  NGO,
  StopProgressStatus,
  VehiclePosition,
} from '../../types/surplusLink';
import { derivedCollectionStops, DerivedStop, groupedCollections } from '../../selectors';
import {
  Truck,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Clock,
  UserCheck,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { CollectQuantityModal } from '../driver/CollectQuantityModal';
import { PickupFailedModal } from '../driver/PickupFailedModal';
import { Button } from '../shared/Button';
import { StatusChip } from '../shared/StatusChip';
import { EmptyState } from '../shared/EmptyState';
import { useToast } from '../shared/Toast';
import { getMealSlotLabel } from '../../utils/posAndPredictionUtils';
import { PickupsRouteMap } from './PickupsRouteMap';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { DonationTimeline } from '../shared/DonationTimeline';

interface PickupsTabProps {
  collections: Collection[];
  donations: FoodDonation[];
  providers: Provider[];
  ngo: NGO;
  onUpdateStopProgress: (
    collectionId: string,
    donationId: string,
    newStatus: StopProgressStatus,
    actualQty?: number,
    failReason?: string
  ) => void;
  onGoToPlanTab: () => void;
  highlightedTripId?: string | null;
  onUpdateTripDriver?: (collectionId: string, driverName: string, driverPhone?: string) => void;
  onUpdateVehiclePosition?: (
    collectionId: string,
    vehiclePosition: VehiclePosition,
    routeProgress?: number
  ) => void;
}

export const PickupsTab: React.FC<PickupsTabProps> = ({
  collections,
  donations,
  providers,
  ngo,
  onUpdateStopProgress,
  onGoToPlanTab,
  highlightedTripId,
  onUpdateTripDriver,
  onUpdateVehiclePosition,
}) => {
  const toast = useToast();
  const { eventLog, highlightedDonationId } = useSurplusLink();
  const [collectingStop, setCollectingStop] = useState<{ stop: DerivedStop; collectionId: string } | null>(null);
  const [failingStop, setFailingStop] = useState<{ stop: DerivedStop; collectionId: string } | null>(null);
  const [editingDriverTripId, setEditingDriverTripId] = useState<string | null>(null);
  const [driverInput, setDriverInput] = useState<string>('');

  const { active, queued, completed } = groupedCollections({ collections });

  // Currently selected active trip for the map route path view
  const [selectedMapTripId, setSelectedMapTripId] = useState<string>(
    active[0]?.id || collections[0]?.id || ''
  );

  useEffect(() => {
    if (highlightedTripId && collections.some((c) => c.id === highlightedTripId)) {
      setSelectedMapTripId(highlightedTripId);
    } else if (active.length > 0 && !active.some((c) => c.id === selectedMapTripId)) {
      setSelectedMapTripId(active[0].id);
    } else if (active.length === 0 && collections.length > 0 && !collections.some((c) => c.id === selectedMapTripId)) {
      setSelectedMapTripId(collections[0].id);
    }
  }, [highlightedTripId, collections, active, selectedMapTripId]);

  if (collections.length === 0) {
    return (
      <EmptyState
        icon={<Truck className="h-8 w-8 text-slate-400" />}
        title="No Accepted Trips Yet"
        description="Accept a collection trip in Plan to start driver pickups."
        actionLabel="Go to Plan Tab"
        onAction={onGoToPlanTab}
      />
    );
  }

  const selectedMapTrip = collections.find((c) => c.id === selectedMapTripId) || active[0] || collections[0];

  const handleEnRoute = (collectionId: string, stop: DerivedStop) => {
    onUpdateStopProgress(collectionId, stop.donationId, 'En route');
    toast.info(`Driver en route to ${stop.provider.name}`);
  };

  const handleArrived = (collectionId: string, stop: DerivedStop) => {
    onUpdateStopProgress(collectionId, stop.donationId, 'Arrived');
    toast.info(`Driver arrived at ${stop.provider.name}`);
  };

  const handleCollectSuccess = (collectionId: string, stop: DerivedStop, actualQty: number) => {
    onUpdateStopProgress(collectionId, stop.donationId, 'Collected', actualQty);
    toast.success(`Collected ${actualQty} portions from ${stop.provider.name}`);
    setCollectingStop(null);
  };

  const handleFailedSuccess = (collectionId: string, stop: DerivedStop, reason: string) => {
    onUpdateStopProgress(collectionId, stop.donationId, 'Failed', 0, reason);
    toast.error(`Pickup failed at ${stop.provider.name}: ${reason}`);
    setFailingStop(null);
  };

  const handleSaveDriver = (collectionId: string) => {
    if (driverInput.trim()) {
      onUpdateTripDriver?.(collectionId, driverInput.trim());
      toast.success(`Assigned driver "${driverInput.trim()}" to Trip`);
    }
    setEditingDriverTripId(null);
  };

  const renderTripCard = (trip: Collection) => {
    const stops = derivedCollectionStops(trip, donations, providers);
    const isHighlighted = highlightedTripId === trip.id;
    const isQueued = trip.status === 'Queued';
    const isCompleted = trip.status === 'Completed' || trip.status === 'Partially Failed';
    const isMapSelected = selectedMapTrip?.id === trip.id;

    return (
      <div
        key={trip.id}
        id={`trip-card-${trip.id}`}
        className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-200 ${
          isHighlighted
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
            : isMapSelected && !isCompleted && !isQueued
            ? 'border-emerald-300 ring-1 ring-emerald-400/20'
            : isQueued
            ? 'border-amber-200 bg-amber-50/10'
            : isCompleted
            ? 'border-slate-200/70 bg-slate-50/20 opacity-95'
            : 'border-slate-200/90'
        }`}
      >
        {/* Trip Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-8 h-8 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-slate-700'
                    : isQueued
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-emerald-600'
                }`}
              >
                T{trip.tripNumber}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Trip #{trip.tripNumber} Manifest
                  </h3>
                  {trip.mealSlot && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {getMealSlotLabel(trip.mealSlot)}
                    </span>
                  )}
                  {isHighlighted && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                      Newly Accepted
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {trip.route.distanceKm} km • ~{trip.route.durationMins} mins • {stops.length} stops
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!isCompleted && !isQueued && (
              <button
                type="button"
                onClick={() => setSelectedMapTripId(trip.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isMapSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Navigation className="w-3 h-3" />
                <span>{isMapSelected ? 'Viewed on Map' : 'View Path'}</span>
              </button>
            )}
            {/* Vehicle Status Chip */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
              <Truck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>{isCompleted ? 'Van: Idle' : isQueued ? 'Van: In Queue' : 'Van: On Route'}</span>
            </span>
            <StatusChip status={trip.status} />
          </div>
        </div>

        {/* Remaining Distance & ETA as Two Numbers with Icons */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Dist</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">{trip.route.distanceKm} km</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated ETA</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">~{trip.route.durationMins} mins</span>
            </div>
          </div>
        </div>

        {/* Vehicle / Driver Assignment & Queued Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs">
          {/* Driver Field with Reassign Action */}
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-semibold">Assigned Driver:</span>
            {editingDriverTripId === trip.id ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="text"
                  value={driverInput}
                  onChange={(e) => setDriverInput(e.target.value)}
                  placeholder="Driver name"
                  className="px-2 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveDriver(trip.id)}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDriverTripId(null)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <strong className="text-slate-900 font-bold">{trip.driver?.name || 'Unassigned'}</strong>
                {!isCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDriverTripId(trip.id);
                      setDriverInput(trip.driver?.name || '');
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                  >
                    Change Driver
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Vehicle Status / Time info */}
          <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {isCompleted
                ? `Completed ${trip.completedAt ? new Date(trip.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
                : isQueued
                ? 'Queue position: Waiting for van'
                : `Scheduled at ${new Date(trip.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
        </div>

        {/* Queued Explanation Banner */}
        {isQueued && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Queued: Waiting for the van.</strong>
              <p className="text-amber-800 text-[11px] mt-0.5">
                The NGO van is currently busy on an active route. This trip will automatically start when the earlier trip finishes, or you can reassign it to an alternate driver above.
              </p>
            </div>
          </div>
        )}

        {/* Vertical Stop Stepper with Large Buttons */}
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200 space-y-4 pt-2">
          {stops.map((stop, idx) => {
            const isStopCollected = stop.status === 'Collected';
            const isStopFailed = stop.status === 'Failed';
            const isStopArrived = stop.status === 'Arrived';
            const isStopEnRoute = stop.status === 'En route';
            const isStopPending = stop.status === 'Pending';

            const isDonationHighlighted = stop.donationId === highlightedDonationId;

            return (
              <div
                key={stop.donationId}
                id={`pickup-stop-${stop.donationId}`}
                className={`relative bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-3 transition-all duration-150 ${
                  isDonationHighlighted
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/20'
                    : isStopCollected
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isStopFailed
                    ? 'border-rose-200 bg-rose-50/20'
                    : isStopArrived
                    ? 'border-sky-400 ring-2 ring-sky-500/20'
                    : isStopEnRoute
                    ? 'border-amber-400 ring-1 ring-amber-500/20'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Stepper Node Icon on vertical line */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-xs shrink-0 ${
                    isStopCollected
                      ? 'bg-emerald-600 text-white'
                      : isStopFailed
                      ? 'bg-rose-600 text-white'
                      : isStopArrived
                      ? 'bg-sky-600 text-white'
                      : isStopEnRoute
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {idx + 1}
                </div>

                {/* Stop Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {stop.provider.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{stop.provider.address}</span>
                    </p>
                  </div>
                  <StatusChip status={stop.status} />
                </div>

                {/* Stop Info Chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                    {stop.donation.foodItem}
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-mono">
                    {stop.confirmedPortions} portions
                  </span>
                  <span className="text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Deadline: {stop.donation.collectionDeadline}</span>
                  </span>
                </div>

                {/* Collapsed Details: OTP & Timeline */}
                <details className="text-xs pt-1 border-t border-slate-100">
                  <summary className="font-semibold text-slate-500 hover:text-slate-900 cursor-pointer flex items-center gap-1.5 py-1">
                    <span>Show OTP & timeline details</span>
                  </summary>
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" /> Donor Handover OTP:
                      </span>
                      <span className="font-mono font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded border border-emerald-200 text-xs">
                        {stop.donation.verificationOtp}
                      </span>
                    </div>
                    <DonationTimeline donation={stop.donation} events={eventLog} compact={true} />
                  </div>
                </details>

                {/* Discrepancy Note on Collected */}
                {isStopCollected && (
                  <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-emerald-900 font-medium">
                      Collected: <strong>{stop.actualPortionsPickedUp} portions</strong>
                    </span>
                    {stop.shortfallPortions > 0 ? (
                      <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                        {stop.shortfallPortions} portion{stop.shortfallPortions === 1 ? '' : 's'} short
                      </span>
                    ) : stop.portionsDiscrepancy !== 0 ? (
                      <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                        Discrepancy: {stop.portionsDiscrepancy > 0 ? `+${stop.portionsDiscrepancy}` : stop.portionsDiscrepancy}
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Failure Reason */}
                {isStopFailed && (
                  <div className="text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2.5">
                    <strong>Failed:</strong> {stop.failedReason}
                  </div>
                )}

                {/* Stop Action Buttons: min-h-[44px] touch targets */}
                {!isStopCollected && !isStopFailed && !isQueued && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {isStopPending && (
                        <Button
                          variant="primary"
                          size="md"
                          icon={<Truck className="h-4 w-4" />}
                          onClick={() => handleEnRoute(trip.id, stop)}
                          className="!bg-amber-500 hover:!bg-amber-600 !border-amber-600 text-slate-950 font-bold min-h-[44px] px-4 cursor-pointer"
                        >
                          En route
                        </Button>
                      )}
                      {isStopEnRoute && (
                        <Button
                          variant="primary"
                          size="md"
                          icon={<MapPin className="h-4 w-4" />}
                          onClick={() => handleArrived(trip.id, stop)}
                          className="!bg-sky-600 hover:!bg-sky-700 !border-sky-700 text-white font-bold min-h-[44px] px-4 cursor-pointer"
                        >
                          Arrived
                        </Button>
                      )}
                      {isStopArrived && (
                        <Button
                          variant="primary"
                          size="md"
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          onClick={() => setCollectingStop({ stop, collectionId: trip.id })}
                          className="min-h-[44px] px-5 font-bold cursor-pointer"
                        >
                          Collected
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFailingStop({ stop, collectionId: trip.id })}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer text-xs min-h-[44px]"
                    >
                      Report failed pickup
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overview Counter Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            <span>Driver Pickups & Routes ({collections.length} total)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of all active, queued, and completed trips for the NGO.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {active.length} Active
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {queued.length} Queued
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {completed.length} Completed
          </span>
        </div>
      </div>

      {/* PART B & C: ACTUAL ROAD PATH & VEHICLE TRACKING MAP */}
      {selectedMapTrip && (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Live Road Path & Vehicle Tracking {active.length > 1 ? `(Trip #${selectedMapTrip.tripNumber})` : ''}
              </h3>
            </div>

            {/* Trip Selector if multiple active trips exist */}
            {active.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist">
                <span className="text-xs font-semibold text-slate-500 mr-1">Active Trips:</span>
                {active.map((trip) => (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => setSelectedMapTripId(trip.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedMapTrip.id === trip.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Trip #{trip.tripNumber} ({trip.donationIds.length} stops)
                  </button>
                ))}
              </div>
            )}
          </div>

          <PickupsRouteMap
            trip={selectedMapTrip}
            donations={donations}
            providers={providers}
            ngo={ngo}
            onUpdateStopProgress={onUpdateStopProgress}
            onUpdateVehiclePosition={onUpdateVehiclePosition}
            isVisible={true}
          />
        </section>
      )}

      {/* SECTION 1: ACTIVE TRIPS */}
      {active.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Active Trips ({active.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              In progress & scheduled
            </span>
          </div>
          <div className="space-y-5">
            {active.map(renderTripCard)}
          </div>
        </section>
      )}

      {/* SECTION 2: QUEUED TRIPS */}
      {queued.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                Queued Trips ({queued.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Waiting for the van
            </span>
          </div>
          <div className="space-y-5">
            {queued.map(renderTripCard)}
          </div>
        </section>
      )}

      {/* SECTION 3: COMPLETED TRIPS (COLLAPSED BY DEFAULT) */}
      {completed.length > 0 && (
        <details className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h3 className="text-base font-bold text-slate-700">
                Completed Trips ({completed.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all">
              <span className="group-open:hidden">▼ Show Completed ({completed.length})</span>
              <span className="hidden group-open:inline">▲ Hide Completed</span>
            </span>
          </summary>
          <div className="space-y-5 pt-4 mt-3 border-t border-slate-100">
            {completed.map(renderTripCard)}
          </div>
        </details>
      )}

      {/* MODALS */}
      {collectingStop && (
        <CollectQuantityModal
          stop={collectingStop.stop}
          onConfirm={(actualQty) => handleCollectSuccess(collectingStop.collectionId, collectingStop.stop, actualQty)}
          onClose={() => setCollectingStop(null)}
        />
      )}
      {failingStop && (
        <PickupFailedModal
          stop={failingStop.stop}
          onConfirm={(reason) => handleFailedSuccess(failingStop.collectionId, failingStop.stop, reason)}
          onClose={() => setFailingStop(null)}
        />
      )}
    </div>
  );
};
