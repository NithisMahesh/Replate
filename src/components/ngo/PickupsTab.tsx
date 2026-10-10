import React, { useState } from 'react';
import { Collection, FoodDonation, Provider } from '../../types/surplusLink';
import { derivedCollectionStops, DerivedStop } from '../../selectors';
import { Truck, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CollectQuantityModal } from '../driver/CollectQuantityModal';
import { PickupFailedModal } from '../driver/PickupFailedModal';
import { Button } from '../shared/Button';
import { StatusChip } from '../shared/StatusChip';
import { EmptyState } from '../shared/EmptyState';
import { useToast } from '../shared/Toast';

interface PickupsTabProps {
  collections: Collection[];
  donations: FoodDonation[];
  providers: Provider[];
  onUpdateStopProgress: (
    collectionId: string,
    donationId: string,
    newStatus: any,
    actualQty?: number,
    failReason?: string
  ) => void;
  onGoToPlanTab: () => void;
}

export const PickupsTab: React.FC<PickupsTabProps> = ({
  collections,
  donations,
  providers,
  onUpdateStopProgress,
  onGoToPlanTab,
}) => {
  const toast = useToast();
  const [selectedTripId, setSelectedTripId] = useState<string>(collections[0]?.id || '');
  const [collectingStop, setCollectingStop] = useState<DerivedStop | null>(null);
  const [failingStop, setFailingStop] = useState<DerivedStop | null>(null);

  const activeTrip = collections.find((c) => c.id === selectedTripId) || collections[0];

  if (!activeTrip) {
    return (
      <EmptyState
        icon={<Truck className="h-8 w-8 text-slate-400" />}
        title="No Accepted Trips Yet"
        description="Generate and accept a collection trip from the Plan tab to start driver pickups."
        actionLabel="Go to Plan Tab"
        onAction={onGoToPlanTab}
      />
    );
  }

  const stops = derivedCollectionStops(activeTrip, donations, providers);

  const handleEnRoute = (stop: DerivedStop) => {
    onUpdateStopProgress(activeTrip.id, stop.donationId, 'En route');
    toast.info(`Driver en route to ${stop.provider.name}`);
  };

  const handleArrived = (stop: DerivedStop) => {
    onUpdateStopProgress(activeTrip.id, stop.donationId, 'Arrived');
    toast.info(`Driver arrived at ${stop.provider.name}`);
  };

  const handleCollectSuccess = (stop: DerivedStop, actualQty: number) => {
    onUpdateStopProgress(activeTrip.id, stop.donationId, 'Collected', actualQty);
    toast.success(`Collected ${actualQty} portions from ${stop.provider.name}`);
    setCollectingStop(null);
  };

  const handleFailedSuccess = (stop: DerivedStop, reason: string) => {
    onUpdateStopProgress(activeTrip.id, stop.donationId, 'Failed', 0, reason);
    toast.error(`Pickup failed at ${stop.provider.name}: ${reason}`);
    setFailingStop(null);
  };

  return (
    <div className="space-y-5">
      {/* Trip Selector if multiple */}
      {collections.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {collections.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedTripId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[44px] cursor-pointer whitespace-nowrap ${
                activeTrip.id === c.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Trip #{c.tripNumber} ({c.donationIds.length} stops)
            </button>
          ))}
        </div>
      )}

      {/* Trip Info Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              T{activeTrip.tripNumber}
            </span>
            <h3 className="text-base font-semibold text-slate-900">Trip #{activeTrip.tripNumber} Manifest</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Driver: {activeTrip.driver.name} • {activeTrip.route.distanceKm} km • {stops.length} stops
          </p>
        </div>
        <StatusChip status={activeTrip.status} />
      </div>

      {/* Vertical Stepper: One Stop at a Time */}
      <div className="space-y-4">
        {stops.map((stop, idx) => {
          const isCollected = stop.status === 'Collected';
          const isFailed = stop.status === 'Failed';
          const isArrived = stop.status === 'Arrived';
          const isEnRoute = stop.status === 'En route';
          const isPending = stop.status === 'Pending';

          return (
            <div
              key={stop.donationId}
              className={`relative bg-white rounded-2xl border p-4 sm:p-5 shadow-xs space-y-3.5 transition-all duration-150 ${
                isCollected
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isFailed
                  ? 'border-rose-200 bg-rose-50/20'
                  : isArrived
                  ? 'border-sky-400 ring-2 ring-sky-500/20'
                  : isEnRoute
                  ? 'border-amber-400 ring-1 ring-amber-500/20'
                  : 'border-slate-200/80'
              }`}
            >
              {/* Stop Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCollected
                        ? 'bg-emerald-600 text-white'
                        : isFailed
                        ? 'bg-rose-600 text-white'
                        : isArrived
                        ? 'bg-sky-600 text-white'
                        : isEnRoute
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-slate-900 truncate">{stop.provider.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{stop.provider.address}</span>
                    </p>
                  </div>
                </div>
                <StatusChip status={stop.status} />
              </div>

              {/* Stop Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-xs block font-semibold uppercase">Item</span>
                  <span className="font-semibold text-slate-900 text-xs truncate block">{stop.donation.foodItem}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-xs block font-semibold uppercase">Confirmed</span>
                  <span className="font-semibold text-emerald-700 text-xs block">{stop.confirmedPortions} portions</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-xs block font-semibold uppercase">Deadline</span>
                  <span className="font-semibold text-slate-700 text-xs block">{stop.donation.collectionDeadline}</span>
                </div>
              </div>

              {/* OTP */}
              <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Donor Handover OTP:
                </span>
                <span className="font-mono font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                  {stop.donation.verificationOtp}
                </span>
              </div>

              {/* Discrepancy note on Collected */}
              {isCollected && (
                <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-emerald-900 font-medium">
                    Collected: <strong>{stop.actualPortionsPickedUp} portions</strong>
                  </span>
                  {stop.portionsDiscrepancy !== 0 && (
                    <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-lg text-xs">
                      Difference: {stop.portionsDiscrepancy > 0 ? `+${stop.portionsDiscrepancy}` : stop.portionsDiscrepancy}
                    </span>
                  )}
                </div>
              )}

              {/* Failure Reason */}
              {isFailed && (
                <div className="text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3">
                  <strong>Failed:</strong> {stop.failedReason}
                </div>
              )}

              {/* Action Buttons: En route -> Arrived -> Collected */}
              {!isCollected && !isFailed && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <Button
                        variant="primary"
                        size="md"
                        icon={<Truck className="h-4 w-4" />}
                        onClick={() => handleEnRoute(stop)}
                        className="!bg-amber-500 hover:!bg-amber-600 !border-amber-600 text-slate-950"
                      >
                        En route
                      </Button>
                    )}
                    {isEnRoute && (
                      <Button
                        variant="primary"
                        size="md"
                        icon={<MapPin className="h-4 w-4" />}
                        onClick={() => handleArrived(stop)}
                        className="!bg-sky-600 hover:!bg-sky-700 !border-sky-700 text-white"
                      >
                        Arrived
                      </Button>
                    )}
                    {isArrived && (
                      <Button
                        variant="primary"
                        size="md"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        onClick={() => setCollectingStop(stop)}
                      >
                        Collected
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFailingStop(stop)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Report failed pickup
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {collectingStop && (
        <CollectQuantityModal
          stop={collectingStop}
          onConfirm={(actualQty) => handleCollectSuccess(collectingStop, actualQty)}
          onClose={() => setCollectingStop(null)}
        />
      )}
      {failingStop && (
        <PickupFailedModal
          stop={failingStop}
          onConfirm={(reason) => handleFailedSuccess(failingStop, reason)}
          onClose={() => setFailingStop(null)}
        />
      )}
    </div>
  );
};
