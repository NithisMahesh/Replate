import React from 'react';
import { Provider, FoodDonation } from '../../types/surplusLink';
import { ImpactMetrics } from '../../types/surplusLink';
import { TrendingUp, Sparkles, ShieldCheck, HeartHandshake, Truck, CheckCircle2, Utensils } from 'lucide-react';
import { StatCard } from '../shared/StatCard';
import { Card } from '../shared/Card';

interface ProviderImpactTabProps {
  provider: Provider;
  metrics: ImpactMetrics;
  donations: FoodDonation[];
}

export const ProviderImpactTab: React.FC<ProviderImpactTabProps> = ({
  provider,
  metrics,
}) => {
  // Funnel calculations
  const base = Math.max(1, metrics.donated);
  const collectedPct = Math.round((metrics.collected / base) * 100);
  const receivedPct = Math.round((metrics.received / base) * 100);
  const distributedPct = Math.round((metrics.distributed / base) * 100);
  const hasDistributed = metrics.distributed > 0;

  return (
    <div className="space-y-6">
      {/* Congratulatory Message after NGO records distribution */}
      {hasDistributed ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-150">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
              <Sparkles className="h-4 w-4" />
              <span>Community Feeding Impact Verified</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Congratulations {provider.name}!
            </h3>
            <p className="text-sm text-emerald-100 max-w-xl leading-relaxed">
              <strong>{metrics.distributed} portions</strong> from your kitchen were successfully distributed to night shelter residents and community centers in Madurai! Zero food wasted.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-3 rounded-xl text-center shrink-0">
            <div className="text-2xl sm:text-3xl font-bold">{metrics.successfulCollectionsCount}</div>
            <div className="text-xs text-emerald-100 mt-0.5">Successful Pickups</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-500 flex items-center gap-3 shadow-xs">
          <ShieldCheck className="h-5 w-5 text-slate-400 shrink-0" />
          <span className="leading-relaxed">
            Once Annam Seva Trust completes distribution runs, live congratulations and meal impact milestones will appear here.
          </span>
        </div>
      )}

      {/* Four Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Donated"
          value={<>{metrics.donated} <span className="text-xs font-normal text-slate-500">portions</span></>}
          caption="Confirmed surplus"
          icon={<HeartHandshake className="h-4 w-4 text-slate-600" />}
        />
        <StatCard
          label="Collected"
          value={<>{metrics.collected} <span className="text-xs font-normal text-slate-500">portions</span></>}
          caption="Picked up by driver"
          icon={<Truck className="h-4 w-4 text-sky-600" />}
        />
        <StatCard
          label="Received"
          value={<>{metrics.received} <span className="text-xs font-normal text-slate-500">portions</span></>}
          caption="Intake verified at depot"
          icon={<CheckCircle2 className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          label="Distributed"
          value={<>{metrics.distributed} <span className="text-xs font-normal text-slate-500">portions</span></>}
          caption="Served to people in need"
          icon={<Utensils className="h-4 w-4 text-emerald-600" />}
        />
      </div>

      {/* Simple Funnel Chart */}
      <Card
        title="Redistribution Funnel"
        subtitle="Donation to Table Pipeline"
        action={
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>{distributedPct}% efficiency</span>
          </span>
        }
      >
        <div className="space-y-4 pt-1">
          {/* Donated */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>1. Donated (Confirmed)</span>
              <span>{metrics.donated} portions (100%)</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full w-full" />
            </div>
          </div>

          {/* Collected */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-sky-800">
              <span>2. Collected (Driver Pickup)</span>
              <span>{metrics.collected} portions ({collectedPct}%)</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, collectedPct)}%` }}
              />
            </div>
          </div>

          {/* Received */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-amber-800">
              <span>3. Received (Depot Check-in)</span>
              <span>{metrics.received} portions ({receivedPct}%)</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, receivedPct)}%` }}
              />
            </div>
          </div>

          {/* Distributed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-emerald-800">
              <span>4. Distributed (Meals Served)</span>
              <span>{metrics.distributed} portions ({distributedPct}%)</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, distributedPct)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
