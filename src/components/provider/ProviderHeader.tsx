import React from 'react';
import { Provider } from '../../types/surplusLink';
import { Store, Building2, Utensils, SlidersHorizontal, ShieldAlert } from 'lucide-react';
import { StatusChip } from '../shared/StatusChip';

interface ProviderHeaderProps {
  selectedProvider: Provider;
  statusText: string;
  statusVariant: 'ready' | 'scheduled' | 'collected' | 'delivered' | 'skipped' | 'idle';
  onOpenDemoTools: () => void;
  activeTab: 'today' | 'billing' | 'impact';
  setActiveTab: (tab: 'today' | 'billing' | 'impact') => void;
  isApproved?: boolean;
}

export const ProviderHeader: React.FC<ProviderHeaderProps> = ({
  selectedProvider,
  statusText,
  statusVariant,
  onOpenDemoTools,
  activeTab,
  setActiveTab,
  isApproved = true,
}) => {
  const getProviderIcon = (type: Provider['type']) => {
    switch (type) {
      case 'bakery':
        return <Store className="h-5 w-5 text-amber-500" />;
      case 'restaurant':
        return <Utensils className="h-5 w-5 text-emerald-600" />;
      case 'hostel_mess':
        return <Building2 className="h-5 w-5 text-sky-600" />;
    }
  };

  const mapStatusVariant = () => {
    switch (statusVariant) {
      case 'ready':
      case 'delivered':
        return 'done' as const;
      case 'scheduled':
        return 'in_progress' as const;
      case 'collected':
        return 'pending' as const;
      case 'skipped':
        return 'failed' as const;
      default:
        return 'neutral' as const;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all duration-150">
        <div className="flex items-center justify-between gap-3">
          {/* Business identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              {getProviderIcon(selectedProvider.type)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-lg sm:text-xl text-slate-900 truncate">
                  {selectedProvider.name}
                </h1>
                {!isApproved && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-amber-700" />
                    Pending Approval
                  </span>
                )}
                {selectedProvider.billingConnection?.status === 'connected' && (
                  <span
                    id="header-billing-connected-badge"
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                    title={`Billing connected (${selectedProvider.billingConnection.connectorName || 'Connected'})`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Billing connected
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 leading-none mt-1">
                <span className="capitalize">{selectedProvider.type.replace('_', ' ')}</span>
                <span>•</span>
                <span>Closes {selectedProvider.closingTime}</span>
                <span>•</span>
                <span className="text-slate-400">{selectedProvider.distanceKmFromNgo} km to NGO hub</span>
              </div>
            </div>
          </div>

          {/* Right: Status chip & Demo tools trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusChip variant={mapStatusVariant()}>
              {statusText}
            </StatusChip>
            <button
              onClick={onOpenDemoTools}
              title="Open Demo & Simulation Tools"
              className="min-h-[44px] min-w-[44px] p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors duration-150 flex items-center justify-center border border-slate-200/80 cursor-pointer"
              aria-label="Open Demo Tools"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Three Tabs: "Today", "Billing", and "Impact" */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60" role="tablist">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex-1 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'today'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          role="tab"
          aria-selected={activeTab === 'today'}
        >
          <span>Today</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`flex-1 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          role="tab"
          aria-selected={activeTab === 'billing'}
        >
          <span>Billing</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('impact')}
          className={`flex-1 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'impact'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          role="tab"
          aria-selected={activeTab === 'impact'}
        >
          <span>Impact</span>
        </button>
      </div>
    </div>
  );
};
