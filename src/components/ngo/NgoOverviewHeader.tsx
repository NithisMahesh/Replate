import React from 'react';
import { NGO } from '../../types/surplusLink';
import { ImpactMetrics } from '../../types/surplusLink';
import { HeartHandshake, Truck, MapPin } from 'lucide-react';
import { StatusChip } from '../shared/StatusChip';

interface NgoOverviewHeaderProps {
  ngo: NGO;
  metrics: ImpactMetrics;
}

export const NgoOverviewHeader: React.FC<NgoOverviewHeaderProps> = ({
  ngo,
  metrics,
}) => {
  const percentQuota = Math.min(
    100,
    Math.round((metrics.distributed / (ngo.nightlyPeopleFed || 80)) * 100)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 transition-all duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* NGO Profile */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs shadow-emerald-600/30">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">{ngo.name}</h2>
              <StatusChip variant="done">Hub Depot</StatusChip>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{ngo.address}</span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">{ngo.distanceKmFromCollege} km from MIET</span>
            </p>
          </div>
        </div>

        {/* Quota & Vehicle Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl text-slate-900">
            <span className="text-amber-700 block text-xs uppercase font-semibold">
              Nightly Feeding Target
            </span>
            <span className="font-semibold text-sm">
              {metrics.distributed} / {ngo.nightlyPeopleFed} meals served ({percentQuota}%)
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl text-slate-900">
            <span className="text-slate-500 block text-xs uppercase font-semibold flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-slate-500" />
              Electric Van Fleet
            </span>
            <span className="font-semibold text-sm">
              {ngo.vehicle.model} ({ngo.vanCapacityPortions} portions cap)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
