import React, { useState, useEffect } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { CollectionPlan, TripPlan } from '../../types/surplusLink';
import { confirmedPool, ngoImpact } from '../../selectors';
import { generateCollectionPlan } from '../../utils/collectionPlanner';
import { DonorSelectionList } from './DonorSelectionList';
import { GeneratedPlanGroups } from './GeneratedPlanGroups';
import { PickupsTab } from './PickupsTab';
import { NgoImpactTab } from './NgoImpactTab';
import { NgoSettingsTab } from './NgoSettingsTab';
import { NgoMap } from '../NgoMap';
import { useToast } from '../shared/Toast';
import {
  Route,
  Truck,
  TrendingUp,
  Settings,
  HeartHandshake,
  MapPin,
  Users,
} from 'lucide-react';

export type NgoTab = 'plan' | 'pickups' | 'impact' | 'settings';

export const NgoShell: React.FC = () => {
  const {
    ngo,
    providers,
    donations,
    collections,
    acceptTripCollection,
    updateStopProgress,
    recordCollectionReceived,
    recordCollectionDistributed,
    loadDemoDonationsBatch,
    plannerConfig,
    recordExcludedDonations,
  } = useSurplusLink();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState<NgoTab>('plan');
  const [collectionPlan, setCollectionPlan] = useState<CollectionPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDonationIds, setSelectedDonationIds] = useState<string[]>([]);

  // Confirmed pool strictly derived via selector
  const pool = confirmedPool({ donations });
  const poolIdsKey = pool.map((d) => d.id).sort().join(',');

  // Overall NGO impact strictly derived via selector
  const metrics = ngoImpact({ donations });

  const percentQuota = Math.min(
    100,
    Math.round((metrics.distributed / (ngo.nightlyPeopleFed || 80)) * 100)
  );

  // Sync selectedDonationIds with pool
  useEffect(() => {
    setSelectedDonationIds((prev) => {
      const valid = prev.filter((id) => pool.some((d) => d.id === id));
      if (valid.length === 0 && pool.length > 0) {
        return pool.map((d) => d.id);
      }
      if (valid.length === prev.length && valid.every((id, idx) => id === prev[idx])) {
        return prev;
      }
      return valid;
    });
  }, [poolIdsKey]);

  const handleToggleDonation = (id: string) => {
    setSelectedDonationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDonationIds(pool.map((d) => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedDonationIds([]);
  };

  const handleGeneratePlan = async () => {
    const selectedDonations = pool.filter((d) => selectedDonationIds.includes(d.id));
    if (selectedDonations.length === 0) return;
    setIsGenerating(true);
    try {
      const plan = await generateCollectionPlan(selectedDonations, providers, ngo, plannerConfig);
      setCollectionPlan(plan);
      if (plan.excludedDonations && plan.excludedDonations.length > 0) {
        recordExcludedDonations(plan.excludedDonations);
      }
      toast.success(`Generated collection plan with ${plan.trips.length} trip(s)! Saved ~${plan.totalDistanceSavedKm} km`);
    } catch {
      toast.error('Failed to generate collection plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptTrip = (trip: TripPlan) => {
    acceptTripCollection(trip, ngo.vehicle.driverName);
    setActiveTab('pickups');
  };

  const navItems = [
    {
      id: 'plan' as const,
      label: 'Plan',
      icon: Route,
      badge: pool.length > 0 ? `${pool.length} waiting` : undefined,
    },
    {
      id: 'pickups' as const,
      label: 'Pickups',
      icon: Truck,
      badge: collections.length > 0 ? `${collections.length} active` : undefined,
    },
    {
      id: 'impact' as const,
      label: 'Impact',
      icon: TrendingUp,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Desktop-First Sidebar (lg:w-64 shrink-0) */}
      <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-5">
        {/* NGO Depot Identity */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs shadow-emerald-600/30">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">{ngo.name}</h2>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{ngo.distanceKmFromCollege} km to campus</span>
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0" aria-label="NGO Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[42px] cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Feeding Progress Widget in Sidebar */}
        <div className="hidden lg:block pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-amber-600" />
              <span>Nightly Target</span>
            </span>
            <span className="text-emerald-700 font-mono">
              {metrics.distributed}/{ngo.nightlyPeopleFed}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${percentQuota}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 text-right font-medium">
            {percentQuota}% of 80 meals fed
          </div>
        </div>

        {/* Van Status Info */}
        <div className="hidden lg:block p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-slate-500" />
            <span>{ngo.vehicle.model}</span>
          </div>
          <p className="text-slate-500 text-[10px]">
            Capacity: <strong>{plannerConfig.vanCapacityPortions} portions</strong> • Driver: {ngo.vehicle.driverName}
          </p>
        </div>
      </aside>

      {/* Main NGO Dashboard View */}
      <main className="flex-1 w-full min-w-0 space-y-6">
        {/* TAB 1: PLAN */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Map View */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Cluster Routing Map</span>
                  <span className="text-slate-500 font-medium">Madurai Depot & Provider Network</span>
                </div>
                <div className="relative z-0 isolate h-[420px] sm:h-[460px] w-full">
                  <NgoMap
                    ngo={ngo}
                    providers={providers}
                    confirmedDonations={pool.filter((d) => selectedDonationIds.includes(d.id))}
                    trips={collectionPlan ? collectionPlan.trips : []}
                    isVisible={activeTab === 'plan'}
                  />
                </div>
              </div>

              {/* Donor List */}
              <div className="xl:col-span-5">
                <DonorSelectionList
                  donations={pool}
                  selectedDonationIds={selectedDonationIds}
                  onToggleDonation={handleToggleDonation}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onLoadDemoBatch={loadDemoDonationsBatch}
                  onGeneratePlan={handleGeneratePlan}
                  isGenerating={isGenerating}
                  vanCapacity={plannerConfig.vanCapacityPortions}
                />
              </div>
            </div>

            {/* Generated Collection Trips (Dispatchable, On Hold, Excluded Groups) */}
            {collectionPlan && (
              <GeneratedPlanGroups
                plan={collectionPlan}
                collections={collections}
                onAcceptTrip={handleAcceptTrip}
              />
            )}
          </div>
        )}

        {/* TAB 2: PICKUPS */}
        {activeTab === 'pickups' && (
          <PickupsTab
            collections={collections}
            donations={donations}
            providers={providers}
            onUpdateStopProgress={updateStopProgress}
            onGoToPlanTab={() => setActiveTab('plan')}
          />
        )}

        {/* TAB 3: IMPACT */}
        {activeTab === 'impact' && (
          <NgoImpactTab
            ngo={ngo}
            metrics={metrics}
            collections={collections}
            donations={donations}
            onRecordReceived={recordCollectionReceived}
            onRecordDistributed={recordCollectionDistributed}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && <NgoSettingsTab />}
      </main>
    </div>
  );
};
