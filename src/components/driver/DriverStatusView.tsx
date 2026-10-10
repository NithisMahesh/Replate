import React, { useState } from 'react';
import { Collection, FoodDonation, Provider, StopProgressStatus } from '../../types/surplusLink';
import { collectionTotals, derivedCollectionStops, DerivedStop } from '../../selectors';
import { DriverHeader } from './DriverHeader';
import { DriverStopCard } from './DriverStopCard';
import { CollectQuantityModal } from './CollectQuantityModal';
import { PickupFailedModal } from './PickupFailedModal';
import { IntakeDistributionCard } from './IntakeDistributionCard';
import { Truck } from 'lucide-react';

interface DriverStatusViewProps {
  collections: Collection[];
  donations: FoodDonation[];
  providers: Provider[];
  onUpdateStopProgress: (
    collectionId: string,
    donationId: string,
    newStatus: StopProgressStatus,
    actualQty?: number,
    failReason?: string
  ) => void;
  onRecordReceived?: (collectionId: string, quantityReceived: number) => void;
  onRecordDistributed?: (
    collectionId: string,
    quantityDistributed: number,
    notes?: string
  ) => void;
}

export const DriverStatusView: React.FC<DriverStatusViewProps> = ({
  collections,
  donations,
  providers,
  onUpdateStopProgress,
  onRecordReceived,
  onRecordDistributed,
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    collections[0]?.id || ''
  );
  const [collectingStop, setCollectingStop] = useState<DerivedStop | null>(null);
  const [failingStop, setFailingStop] = useState<DerivedStop | null>(null);

  const activeCollection =
    collections.find((c) => c.id === selectedCollectionId) || collections[0];

  if (!activeCollection) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
        <Truck className="h-10 w-10 text-slate-300 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">No Scheduled Collections Active</h3>
        <p className="max-w-md mx-auto text-slate-500">
          Go to the <strong>"Collection Routes"</strong> tab and click <strong>"Accept Collection"</strong> on any trip card to schedule a driver run.
        </p>
      </div>
    );
  }

  // Derive live totals and stops using normalized selectors
  const totals = collectionTotals(activeCollection, donations);
  const stops = derivedCollectionStops(activeCollection, donations, providers);

  return (
    <div className="space-y-6">
      {/* 1. Header with Trip, Driver & Route Load Info */}
      <DriverHeader
        collections={collections}
        activeCollection={activeCollection}
        totals={totals}
        onSelectCollection={setSelectedCollectionId}
      />

      {/* 2. List of Stops on the Route */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            Ordered Pickup Stops ({stops.length})
          </h4>
          <span className="text-xs text-slate-500">
            Optimized route ordering via OSRM
          </span>
        </div>

        <div className="space-y-3">
          {stops.map((stop) => (
            <DriverStopCard
              key={stop.donationId}
              stop={stop}
              onUpdateStatus={(donId, status) =>
                onUpdateStopProgress(activeCollection.id, donId, status)
              }
              onOpenCollectModal={(s) => setCollectingStop(s)}
              onOpenFailModal={(s) => setFailingStop(s)}
            />
          ))}
        </div>
      </div>

      {/* 3. Post-Collection Intake & Feeding Distribution Audit */}
      {totals.collectedCount > 0 && onRecordReceived && onRecordDistributed && (
        <IntakeDistributionCard
          activeCollection={activeCollection}
          totals={totals}
          onRecordReceived={onRecordReceived}
          onRecordDistributed={onRecordDistributed}
        />
      )}

      {/* Actual Quantity Modal */}
      {collectingStop && (
        <CollectQuantityModal
          stop={collectingStop}
          onConfirm={(actualQty) => {
            onUpdateStopProgress(
              activeCollection.id,
              collectingStop.donationId,
              'Collected',
              actualQty
            );
            setCollectingStop(null);
          }}
          onClose={() => setCollectingStop(null)}
        />
      )}

      {/* Mark Pickup Failed Modal */}
      {failingStop && (
        <PickupFailedModal
          stop={failingStop}
          onConfirm={(reason) => {
            onUpdateStopProgress(
              activeCollection.id,
              failingStop.donationId,
              'Failed',
              undefined,
              reason
            );
            setFailingStop(null);
          }}
          onClose={() => setFailingStop(null)}
        />
      )}
    </div>
  );
};
