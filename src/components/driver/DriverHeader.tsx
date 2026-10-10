import React from 'react';
import { Collection } from '../../types/surplusLink';
import { CollectionTotals } from '../../selectors';
import { Truck, Phone } from 'lucide-react';

interface DriverHeaderProps {
  collections: Collection[];
  activeCollection: Collection;
  totals: CollectionTotals;
  onSelectCollection: (id: string) => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  collections,
  activeCollection,
  totals,
  onSelectCollection,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
      {/* Multiple Collections Selector */}
      {collections.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Active Runs:
          </span>
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCollection(c.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                c.id === activeCollection.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Trip {c.tripNumber} ({c.status})
            </button>
          ))}
        </div>
      )}

      {/* Main Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Trip #{activeCollection.tripNumber} Van Manifest
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    activeCollection.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeCollection.status === 'Partially Failed'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {activeCollection.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Driver: <strong className="text-slate-700">{activeCollection.driver.name}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {activeCollection.driver.phone}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Route Metas */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Planned Route</span>
            <span className="font-bold text-slate-800">
              {activeCollection.route.distanceKm} km • ~{activeCollection.route.durationMins} mins
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-emerald-900">
            <span className="text-emerald-600 block text-[10px] uppercase font-bold">Van Load</span>
            <span className="font-bold">
              {totals.totalCollectedPortions} / {totals.totalConfirmedPortions} portions
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 pt-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Stops Completed: <strong>{totals.collectedCount}</strong> of <strong>{totals.stopCount}</strong></span>
          <span>{totals.stopCount > 0 ? Math.round((totals.collectedCount / totals.stopCount) * 100) : 0}% collected</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${totals.stopCount > 0 ? (totals.collectedCount / totals.stopCount) * 100 : 0}%` }}
          />
          {totals.failedCount > 0 && (
            <div
              className="bg-red-400 h-full transition-all duration-500"
              style={{ width: `${(totals.failedCount / totals.stopCount) * 100}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
