import React from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { MapPin, Navigation, Truck } from 'lucide-react';
import { confirmedPool } from '../../selectors';

export const ClusterOverviewBar: React.FC = () => {
  const { college, providers, ngo, donations } = useSurplusLink();
  const pool = confirmedPool({ donations });
  const totalPortionsAvailable = pool.reduce(
    (sum, d) => sum + (d.confirmedPortions ?? d.portions ?? 0),
    0
  );

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* College & Perimeter Context */}
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="flex items-center gap-1 font-semibold text-slate-900">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            {college.name}
          </span>
          <span className="text-slate-300">•</span>
          <span>1.5 km Radius Cluster (Madurai, TN)</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 font-medium">
            {providers.length} Providers (9 Bakeries, 4 Restaurants, 2 Messes)
          </span>
        </div>
        {/* NGO Context */}
        <div className="flex flex-wrap items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md text-amber-900 font-medium">
            <Navigation className="h-3.5 w-3.5 text-amber-600" />
            <span>NGO: {ngo.name}</span>
            <span className="text-amber-400">•</span>
            <span>3.0 km</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-mono">
            <Truck className="h-3.5 w-3.5 text-slate-500" />
            <span>Van Cap: {ngo.vanCapacityPortions} portions</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-emerald-900 font-bold">
            <span>Confirmed Pool: {totalPortionsAvailable} portions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
