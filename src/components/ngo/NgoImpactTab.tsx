import React from 'react';
import { NGO, Collection, FoodDonation } from '../../types/surplusLink';
import { ImpactMetrics } from '../../types/surplusLink';
import { collectionTotals } from '../../selectors';
import { TripAuditRow } from './TripAuditRow';
import { ImpactFunnelCard } from '../ImpactFunnelCard';
import { HeartHandshake, Truck, Package, Utensils } from 'lucide-react';
import { Card } from '../shared/Card';
import { StatCard } from '../shared/StatCard';

interface NgoImpactTabProps {
  ngo: NGO;
  metrics: ImpactMetrics;
  collections: Collection[];
  donations: FoodDonation[];
  onRecordReceived: (collectionId: string, qty: number) => void;
  onRecordDistributed: (collectionId: string, qty: number, notes?: string) => void;
}

export const NgoImpactTab: React.FC<NgoImpactTabProps> = ({
  ngo,
  metrics,
  collections,
  donations,
  onRecordReceived,
  onRecordDistributed,
}) => {
  const percentQuota = Math.min(
    100,
    Math.round((metrics.distributed / (ngo.nightlyPeopleFed || 80)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* 1. Trip Intake & Distribution Entry */}
      <Card
        title="Trip Intake & Distribution Entry"
        subtitle="Record depot receipt and meals served per completed trip"
      >
        {collections.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl">
            No collection trips recorded yet. Accept trips in the Plan tab first.
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((c) => {
              const totals = collectionTotals(c, donations);
              return (
                <TripAuditRow
                  key={c.id}
                  collection={c}
                  totals={totals}
                  onRecordReceived={onRecordReceived}
                  onRecordDistributed={onRecordDistributed}
                />
              );
            })}
          </div>
        )}
      </Card>

      {/* 2. Summary Cards using StatCard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Donated"
          value={<>{metrics.donated} <span className="text-xs font-normal text-slate-500">portions</span></>}
          caption="Total confirmed by donors"
          icon={<HeartHandshake className="h-4 w-4 text-slate-600" />}
        />
        <StatCard
          label="Collected"
          value={<>{metrics.collected} <span className="text-xs font-normal text-slate-500">portions</span></>}
          caption="Loaded into electric van"
          icon={<Truck className="h-4 w-4 text-sky-600" />}
        />
        <StatCard
          label="Received"
          value={<>{metrics.received} <span className="text-xs font-normal text-slate-500">portions</span></>}
          caption="Audited at depot"
          icon={<Package className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          label="Distributed"
          value={<>{metrics.distributed} <span className="text-xs font-normal text-slate-500">meals</span></>}
          caption="Served to people in need"
          icon={<Utensils className="h-4 w-4 text-emerald-600" />}
        />
      </div>

      {/* 3. Funnel Chart using ngoImpact */}
      <ImpactFunnelCard
        metrics={metrics}
        title="Nightly Redistribution Funnel"
        subtitle="Aggregate surplus flow from donor confirmation to community dining."
        entityName={ngo.name}
        isProviderView={false}
      />

      {/* 4. Nightly Target Progress */}
      <Card
        title="Nightly Feeding Target"
        subtitle={`Goal: ${ngo.nightlyPeopleFed} meals served nightly to local community`}
        action={
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {metrics.distributed} / {ngo.nightlyPeopleFed} meals ({percentQuota}%)
          </span>
        }
      >
        <div className="space-y-2">
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${percentQuota}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Only portions audited and distributed count towards meals served.
          </p>
        </div>
      </Card>
    </div>
  );
};
