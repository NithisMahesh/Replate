import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { CollectionPlan, TripPlan, MealSlot, FoodDonation } from '../../types/surplusLink';
import { confirmedPool, ngoImpact } from '../../selectors';
import { generateCollectionPlan } from '../../utils/collectionPlanner';
import { getCurrentMealSlot, getMealSlotLabel } from '../../utils/posAndPredictionUtils';
import { DonorSelectionList } from './DonorSelectionList';
import { GeneratedPlanGroups } from './GeneratedPlanGroups';
import { PlanGeneratedModal } from './PlanGeneratedModal';
import { PickupsTab } from './PickupsTab';
import { NgoImpactTab } from './NgoImpactTab';
import { NgoSettingsTab } from './NgoSettingsTab';
import { NgoMap } from '../NgoMap';
import { useToast } from '../shared/Toast';
import { IncomingInboxTab } from './IncomingInboxTab';
import {
  Route,
  Truck,
  TrendingUp,
  Settings,
  HeartHandshake,
  MapPin,
  Users,
  Clock,
  Inbox,
  AlertTriangle,
} from 'lucide-react';

export type NgoTab = 'plan' | 'incoming' | 'pickups' | 'impact' | 'settings';

export const NgoShell: React.FC = () => {
  const {
    ngo,
    providers,
    donations,
    collections,
    acceptTripCollection,
    allocateTrip,
    updateTripDriver,
    updateVehiclePosition,
    updateStopProgress,
    recordCollectionReceived,
    recordCollectionDistributed,
    loadDemoDonationsBatch,
    plannerConfig,
    recordExcludedDonations,
  } = useSurplusLink();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState<NgoTab>('plan');
  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot>(getCurrentMealSlot);
  const [collectionPlan, setCollectionPlan] = useState<CollectionPlan | null>(null);
  const [highlightedTripId, setHighlightedTripId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDonationIds, setSelectedDonationIds] = useState<string[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<CollectionPlan | null>(null);

  // QR Submissions & Unseen Badge Tracking
  const [seenSubmissionIds, setSeenSubmissionIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('replate_ngo_seen_submissions');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const submittedQrDonations = useMemo(() => {
    return donations.filter((d) => d.source === 'qr_form' && d.status === 'Submitted');
  }, [donations]);

  const unseenSubmissionsCount = useMemo(() => {
    return submittedQrDonations.filter((d) => !seenSubmissionIds.has(d.id)).length;
  }, [submittedQrDonations, seenSubmissionIds]);

  // When on incoming tab, mark current submissions as seen to clear badge
  useEffect(() => {
    if (activeTab === 'incoming' && submittedQrDonations.length > 0) {
      setSeenSubmissionIds((prev) => {
        let changed = false;
        const next = new Set(prev);
        submittedQrDonations.forEach((d) => {
          if (!next.has(d.id)) {
            next.add(d.id);
            changed = true;
          }
        });
        if (changed) {
          try {
            localStorage.setItem('replate_ngo_seen_submissions', JSON.stringify(Array.from(next)));
          } catch {}
          return next;
        }
        return prev;
      });
    }
  }, [activeTab, submittedQrDonations]);

  // In-app notification when a new QR submission arrives
  const prevSubmittedCountRef = useRef(submittedQrDonations.length);
  useEffect(() => {
    if (submittedQrDonations.length > prevSubmittedCountRef.current) {
      const latest = submittedQrDonations[0];
      if (latest && !seenSubmissionIds.has(latest.id)) {
        toast.info(
          `New surplus submitted: ${latest.providerName} (${latest.confirmedPortions || latest.portions} portions)`
        );
      }
    }
    prevSubmittedCountRef.current = submittedQrDonations.length;
  }, [submittedQrDonations, seenSubmissionIds, toast]);

  // Confirmed pool strictly derived via selector
  const pool: FoodDonation[] = confirmedPool({ donations });

  // Confirmed count badges per meal slot
  const mealSlotCounts = useMemo(() => {
    return {
      morning: pool.filter((d) => (d.mealSlot || 'night') === 'morning').length,
      afternoon: pool.filter((d) => (d.mealSlot || 'night') === 'afternoon').length,
      night: pool.filter((d) => (d.mealSlot || 'night') === 'night').length,
    };
  }, [pool]);

  // Current meal pool (never mix meals)
  const mealPool = useMemo(() => {
    return pool.filter((d) => (d.mealSlot || 'night') === activeMealSlot);
  }, [pool, activeMealSlot]);

  const mealPoolIdsKey = mealPool.map((d) => d.id).sort().join(',');

  // Overall NGO impact strictly derived via selector
  const metrics = ngoImpact({ donations });

  const percentQuota = Math.min(
    100,
    Math.round((metrics.distributed / (ngo.nightlyPeopleFed || 80)) * 100)
  );

  // Sync selectedDonationIds with mealPool
  useEffect(() => {
    setSelectedDonationIds(mealPool.map((d) => d.id));
  }, [mealPoolIdsKey, activeMealSlot]);

  // Live timer for urgent deadlines
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Urgent deadlines under 1 hour (< 60 mins remaining)
  const urgentDeadlines = useMemo(() => {
    return donations.filter((d) => {
      if (['Collected', 'Received', 'Distributed', 'Expired', 'Rejected'].includes(d.status)) {
        return false;
      }
      const diff = d.deadlineTimestamp - now;
      return diff > 0 && diff <= 60 * 60 * 1000;
    });
  }, [donations, now]);

  // Total trips on hold across planner and queued collections
  const onHoldTripsCount = useMemo(() => {
    const planOnHold = collectionPlan?.onHoldTrips?.length ?? 0;
    const queuedTrips = collections.filter((c) => c.status === 'Queued').length;
    return planOnHold + queuedTrips;
  }, [collectionPlan, collections]);

  const handleSelectMealSlot = (slot: MealSlot) => {
    setActiveMealSlot(slot);
    setCollectionPlan(null);
  };

  const handleToggleDonation = (id: string) => {
    setSelectedDonationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDonationIds(mealPool.map((d) => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedDonationIds([]);
  };

  const handleGeneratePlan = async () => {
    if (isPlanModalOpen) return;
    const selectedDonations = mealPool.filter((d) => selectedDonationIds.includes(d.id));
    if (selectedDonations.length === 0) return;
    setIsGenerating(true);
    try {
      const plan = await generateCollectionPlan(
        selectedDonations,
        providers,
        ngo,
        plannerConfig,
        undefined,
        activeMealSlot
      );
      setCollectionPlan(plan);
      setModalPlan(plan);
      setIsPlanModalOpen(true);
      if (plan.excludedDonations && plan.excludedDonations.length > 0) {
        recordExcludedDonations(plan.excludedDonations);
      }
      toast.success(
        `Generated ${getMealSlotLabel(activeMealSlot)} collection plan with ${plan.trips.length} trip(s)! Saved ~${plan.totalDistanceSavedKm} km`
      );
    } catch {
      toast.error('Failed to generate collection plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptTrip = async (trip: TripPlan) => {
    const newCollectionId = await allocateTrip(trip, ngo.vehicle.driverName);
    setHighlightedTripId(newCollectionId);
    setCollectionPlan(null);
    setIsPlanModalOpen(false);
    toast.success(`Trip #${trip.tripNumber} accepted and scheduled for ${ngo.vehicle.driverName}!`);
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
      id: 'incoming' as const,
      label: 'Incoming',
      icon: Inbox,
      badge: unseenSubmissionsCount > 0 ? `${unseenSubmissionsCount} new` : undefined,
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
              <span>{ngo.serviceRadiusKm ?? 5.0} km service radius</span>
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
                        : item.id === 'incoming'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse font-extrabold'
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
        {/* "NOW" Strip at the top of every NGO tab */}
        <section
          aria-label="Live operations alert strip"
          className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-slate-900 text-white shadow-2xs">
              NOW
            </span>
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              Live Operations:
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Chip 1: New Submissions */}
            <button
              type="button"
              onClick={() => setActiveTab('incoming')}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                unseenSubmissionsCount > 0 || submittedQrDonations.length > 0
                  ? 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
              aria-label={`New submissions: ${submittedQrDonations.length}`}
            >
              <Inbox className="w-4 h-4 text-blue-600 shrink-0" />
              <span>New Submissions</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  unseenSubmissionsCount > 0
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-blue-200 text-blue-900'
                }`}
              >
                {submittedQrDonations.length}
              </span>
            </button>

            {/* Chip 2: Trips On Hold */}
            <button
              type="button"
              onClick={() => {
                if (collections.some((c) => c.status === 'Queued')) {
                  setActiveTab('pickups');
                } else {
                  setActiveTab('plan');
                }
              }}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                onHoldTripsCount > 0
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
              aria-label={`Trips on hold: ${onHoldTripsCount}`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Trips on Hold</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-200 text-amber-900">
                {onHoldTripsCount}
              </span>
            </button>

            {/* Chip 3: Deadlines Under 1 Hour */}
            <button
              type="button"
              onClick={() => {
                const hasQrUrgent = submittedQrDonations.some(
                  (d) => d.deadlineTimestamp - now <= 3600000 && d.deadlineTimestamp > now
                );
                if (hasQrUrgent) {
                  setActiveTab('incoming');
                } else {
                  setActiveTab('plan');
                }
              }}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                urgentDeadlines.length > 0
                  ? 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 animate-pulse'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
              aria-label={`Deadlines under 1 hour: ${urgentDeadlines.length}`}
            >
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Deadlines &lt; 1h</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  urgentDeadlines.length > 0
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {urgentDeadlines.length}
              </span>
            </button>
          </div>
        </section>

        {/* TAB 1: PLAN */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            {/* Meal Slot Selector with Badge Above Planner */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Meal Slot Planner</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Plan routes independently per meal. Breakfast, Lunch, and Dinner donations are never mixed in one trip.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60" role="tablist">
                {(
                  [
                    { id: 'morning', label: 'Breakfast', window: '06:00–10:00' },
                    { id: 'afternoon', label: 'Lunch', window: '12:00–15:00' },
                    { id: 'night', label: 'Dinner', window: '19:00–23:00' },
                  ] as const
                ).map((tab) => {
                  const isSelected = activeMealSlot === tab.id;
                  const count = mealSlotCounts[tab.id];
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`ngo-meal-tab-${tab.id}`}
                      onClick={() => handleSelectMealSlot(tab.id)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/80 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        id={`badge-confirmed-${tab.id}`}
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          count > 0
                            ? isSelected
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Map View */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Provider Availability Map ({getMealSlotLabel(activeMealSlot)})</span>
                  <span className="text-slate-500 font-medium">Madurai Depot & Provider Network</span>
                </div>
                <div className="relative z-0 isolate h-[420px] sm:h-[460px] w-full">
                  <NgoMap
                    ngo={ngo}
                    providers={providers}
                    confirmedDonations={mealPool.filter((d) => selectedDonationIds.includes(d.id))}
                    plan={collectionPlan}
                    activeMealSlot={activeMealSlot}
                    isVisible={activeTab === 'plan'}
                  />
                </div>
              </div>

              {/* Donor List */}
              <div className="xl:col-span-5">
                <DonorSelectionList
                  donations={mealPool}
                  selectedDonationIds={selectedDonationIds}
                  onToggleDonation={handleToggleDonation}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onLoadDemoBatch={loadDemoDonationsBatch}
                  onGeneratePlan={handleGeneratePlan}
                  isGenerating={isGenerating}
                  vanCapacity={plannerConfig.vanCapacityPortions}
                  mealSlot={activeMealSlot}
                />
              </div>
            </div>

            {/* Generated Collection Trips (Dispatchable, On Hold, Excluded Groups) */}
            {collectionPlan && (
              <div id="generated-plan-results">
                <GeneratedPlanGroups
                  plan={collectionPlan}
                  collections={collections}
                  onAcceptTrip={handleAcceptTrip}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INCOMING INBOX */}
        {activeTab === 'incoming' && <IncomingInboxTab />}

        {/* TAB 3: PICKUPS */}
        {activeTab === 'pickups' && (
          <PickupsTab
            collections={collections}
            donations={donations}
            providers={providers}
            ngo={ngo}
            onUpdateStopProgress={updateStopProgress}
            onGoToPlanTab={() => setActiveTab('plan')}
            highlightedTripId={highlightedTripId}
            onUpdateTripDriver={updateTripDriver}
            onUpdateVehiclePosition={updateVehiclePosition}
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

      {/* Plan Generated Modal Popup */}
      <PlanGeneratedModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={modalPlan}
        mealSlot={activeMealSlot}
        onViewPlan={() => {
          setIsPlanModalOpen(false);
          setTimeout(() => {
            const resultsEl = document.getElementById('generated-plan-results');
            if (resultsEl) {
              resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
        onAcceptTrip={handleAcceptTrip}
      />
    </div>
  );
};
