import {
  FoodDonation,
  Collection,
  Provider,
  ImpactMetrics,
  StopProgressStatus,
  NGO,
  InAppNotification,
  CollectionPlan,
  MealSlot,
  MealImpactSummary,
  EventLogEntry,
} from './types/surplusLink';

export interface SurplusLinkState {
  providers: Provider[];
  ngo: NGO;
  donations: FoodDonation[];
  collections: Collection[];
  notifications: InAppNotification[];
  collectionPlan?: CollectionPlan | null;
  selectedCollectionId?: string | null;
  eventLog?: EventLogEntry[];
}

/**
 * Returns all donations made by a specific provider, latest first.
 */
export function donationsForProvider(
  state: { donations: FoodDonation[] },
  providerId: string
): FoodDonation[] {
  return state.donations.filter((d) => d.providerId === providerId);
}

/**
 * Returns the confirmed pool of donations ready for collection planning.
 */
export function confirmedPool(
  state: { donations: FoodDonation[] }
): FoodDonation[] {
  return state.donations.filter((d) => d.status === 'Confirmed');
}

/**
 * Returns the confirmed pool of donations ready for collection planning, filtered by mealSlot.
 */
export function confirmedPoolByMeal(
  state: { donations: FoodDonation[] },
  mealSlot?: MealSlot
): FoodDonation[] {
  return state.donations.filter(
    (d) => d.status === 'Confirmed' && (!mealSlot || (d.mealSlot || 'night') === mealSlot)
  );
}

/**
 * Returns active collections (Scheduled or In Progress), newest active trip first.
 */
export function activeCollections(state: { collections: Collection[] }): Collection[] {
  return (state.collections || [])
    .filter((c) => c.status === 'Scheduled' || c.status === 'In Progress')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
}

/**
 * Returns queued collections waiting for the van, ordered by queue time.
 */
export function queuedCollections(state: { collections: Collection[] }): Collection[] {
  return (state.collections || [])
    .filter((c) => c.status === 'Queued')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/**
 * Returns completed collections, latest completed first.
 */
export function completedCollections(state: { collections: Collection[] }): Collection[] {
  return (state.collections || [])
    .filter((c) => c.status === 'Completed' || c.status === 'Partially Failed')
    .sort((a, b) => {
      const timeA = new Date(a.completedAt || a.scheduledAt).getTime();
      const timeB = new Date(b.completedAt || b.scheduledAt).getTime();
      return timeB - timeA;
    });
}

/**
 * Returns all collections grouped into active, queued, and completed lists.
 */
export function groupedCollections(state: { collections: Collection[] }): {
  active: Collection[];
  queued: Collection[];
  completed: Collection[];
} {
  return {
    active: activeCollections(state),
    queued: queuedCollections(state),
    completed: completedCollections(state),
  };
}

export interface CollectionTotals {
  totalConfirmedPortions: number;
  totalCollectedPortions: number;
  totalReceivedPortions: number;
  totalDistributedPortions: number;
  stopCount: number;
  collectedCount: number;
  failedCount: number;
  pendingCount: number;
  enRouteCount: number;
  arrivedCount: number;
  isAllCollected: boolean;
  isCompleted: boolean;
  hasFailure: boolean;
}

/**
 * Computes live totals for a collection directly derived from its constituent donations.
 * No quantities are stored duplicate on the collection entity itself.
 */
export function collectionTotals(
  collection: Collection,
  donations: FoodDonation[] | Record<string, FoodDonation>
): CollectionTotals {
  const donationMap: Record<string, FoodDonation> = Array.isArray(donations)
    ? donations.reduce((acc, d) => {
        acc[d.id] = d;
        return acc;
      }, {} as Record<string, FoodDonation>)
    : donations;

  let totalConfirmedPortions = 0;
  let totalCollectedPortions = 0;
  let totalReceivedPortions = 0;
  let totalDistributedPortions = 0;

  let collectedCount = 0;
  let failedCount = 0;
  let pendingCount = 0;
  let enRouteCount = 0;
  let arrivedCount = 0;

  for (const donationId of collection.donationIds) {
    const donation = donationMap[donationId];
    const progress = collection.stopProgress[donationId];
    const status: StopProgressStatus = progress?.status || 'Pending';

    if (donation) {
      const confirmed = donation.confirmedPortions ?? donation.portions ?? 0;
      totalConfirmedPortions += confirmed;
      totalCollectedPortions += donation.collectedPortions ?? 0;
      totalReceivedPortions += donation.receivedPortions ?? 0;
      totalDistributedPortions += donation.distributedPortions ?? 0;
    }

    if (status === 'Collected') collectedCount++;
    else if (status === 'Failed') failedCount++;
    else if (status === 'En route') enRouteCount++;
    else if (status === 'Arrived') arrivedCount++;
    else pendingCount++;
  }

  const stopCount = collection.donationIds.length;
  const isAllCollected = stopCount > 0 && collectedCount === stopCount;
  const hasFailure = failedCount > 0;
  const isCompleted = collection.status === 'Completed' || (stopCount > 0 && (collectedCount + failedCount) === stopCount);

  return {
    totalConfirmedPortions,
    totalCollectedPortions,
    totalReceivedPortions,
    totalDistributedPortions,
    stopCount,
    collectedCount,
    failedCount,
    pendingCount,
    enRouteCount,
    arrivedCount,
    isAllCollected,
    isCompleted,
    hasFailure,
  };
}

function createEmptyMealImpact(): Record<MealSlot, MealImpactSummary> {
  return {
    morning: { donated: 0, collected: 0, received: 0, distributed: 0, successfulCollectionsCount: 0 },
    afternoon: { donated: 0, collected: 0, received: 0, distributed: 0, successfulCollectionsCount: 0 },
    night: { donated: 0, collected: 0, received: 0, distributed: 0, successfulCollectionsCount: 0 },
  };
}

/**
 * Computes the 4-stage pipeline impact for a single provider.
 */
export function providerImpact(
  state: { donations: FoodDonation[] },
  providerId: string
): ImpactMetrics {
  const providerDonations = donationsForProvider(state, providerId);
  let donated = 0;
  let collected = 0;
  let received = 0;
  let distributed = 0;
  let successfulCollectionsCount = 0;
  const byMeal = createEmptyMealImpact();

  for (const d of providerDonations) {
    const slot: MealSlot = d.mealSlot || 'night';
    if (d.status !== 'Draft' && d.status !== 'Cancelled') {
      const p = d.confirmedPortions ?? d.portions ?? 0;
      donated += p;
      byMeal[slot].donated += p;
    }
    if (d.collectedPortions && d.collectedPortions > 0) {
      collected += d.collectedPortions;
      byMeal[slot].collected += d.collectedPortions;
    }
    if (d.receivedPortions && d.receivedPortions > 0) {
      received += d.receivedPortions;
      byMeal[slot].received += d.receivedPortions;
    }
    if (d.distributedPortions && d.distributedPortions > 0) {
      distributed += d.distributedPortions;
      byMeal[slot].distributed += d.distributedPortions;
    }
    if (
      d.status === 'Collected' ||
      d.status === 'Received' ||
      d.status === 'Distributed'
    ) {
      successfulCollectionsCount++;
      byMeal[slot].successfulCollectionsCount++;
    }
  }

  return {
    donated,
    collected,
    received,
    distributed,
    successfulCollectionsCount,
    byMeal,
  };
}

/**
 * Computes the aggregate 4-stage pipeline impact for the NGO hub.
 */
export function ngoImpact(
  state: { donations: FoodDonation[] }
): ImpactMetrics {
  let donated = 0;
  let collected = 0;
  let received = 0;
  let distributed = 0;
  let successfulCollectionsCount = 0;
  const byMeal = createEmptyMealImpact();

  for (const d of state.donations) {
    const slot: MealSlot = d.mealSlot || 'night';
    if (d.status !== 'Draft' && d.status !== 'Cancelled') {
      const p = d.confirmedPortions ?? d.portions ?? 0;
      donated += p;
      byMeal[slot].donated += p;
    }
    if (d.collectedPortions && d.collectedPortions > 0) {
      collected += d.collectedPortions;
      byMeal[slot].collected += d.collectedPortions;
    }
    if (d.receivedPortions && d.receivedPortions > 0) {
      received += d.receivedPortions;
      byMeal[slot].received += d.receivedPortions;
    }
    if (d.distributedPortions && d.distributedPortions > 0) {
      distributed += d.distributedPortions;
      byMeal[slot].distributed += d.distributedPortions;
    }
    if (
      d.status === 'Collected' ||
      d.status === 'Received' ||
      d.status === 'Distributed'
    ) {
      successfulCollectionsCount++;
      byMeal[slot].successfulCollectionsCount++;
    }
  }

  return {
    donated,
    collected,
    received,
    distributed,
    successfulCollectionsCount,
    byMeal,
  };
}

export interface DerivedStop {
  stopOrder: number;
  donationId: string;
  donation: FoodDonation;
  provider: Provider;
  status: StopProgressStatus;
  confirmedPortions: number;
  actualPortionsPickedUp: number;
  portionsDiscrepancy: number;
  shortfallPortions: number;
  estimatedArrivalMinutesFromStart: number;
  estimatedArrivalTimeFormatted: string;
  collectedAt?: string;
  failedReason?: string;
  receivedPortions?: number;
  distributedPortions?: number;
}

/**
 * Derived stop selector:
 * Builds full ordered stops list for a collection on the fly by joining
 * collection.donationIds with state.donations and state.providers.
 */
export function derivedCollectionStops(
  collection: Collection,
  donations: FoodDonation[],
  providers: Provider[]
): DerivedStop[] {
  const donationMap = new Map(donations.map((d) => [d.id, d]));
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  return collection.donationIds.map((donId, index) => {
    const fallbackDonation: FoodDonation = {
      id: donId,
      providerId: 'unknown',
      providerName: 'Unknown Provider',
      providerType: 'restaurant',
      foodItem: 'Surplus Food',
      category: 'cooked_meal',
      mealSlot: 'night',
      confirmedPortions: 0,
      portions: 0,
      storageType: 'room_temp',
      preparedTime: '20:00',
      collectionDeadline: '23:00',
      deadlineTimestamp: Date.now() + 60 * 60 * 1000,
      dietary: 'veg',
      verificationOtp: '0000',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    };
    const donation = donationMap.get(donId) || fallbackDonation;

    const provider = providerMap.get(donation.providerId) || {
      id: donation.providerId,
      name: donation.providerName,
      type: donation.providerType,
      lat: 9.9252,
      lng: 78.1198,
      distanceKmFromNgo: 0.5,
      closingTime: '22:00',
      address: 'Madurai',
      phone: '',
      contactPerson: '',
    };

    const progress = collection.stopProgress[donId] || {
      status: 'Pending' as const,
    };

    const confirmedPortions = donation.confirmedPortions ?? donation.portions ?? 0;
    const actualPortionsPickedUp = donation.collectedPortions ?? (progress.status === 'Collected' ? confirmedPortions : 0);
    const portionsDiscrepancy = progress.status === 'Collected' ? actualPortionsPickedUp - confirmedPortions : 0;
    const shortfallPortions = progress.status === 'Collected' && actualPortionsPickedUp < confirmedPortions
      ? confirmedPortions - actualPortionsPickedUp
      : 0;

    return {
      stopOrder: index + 1,
      donationId: donId,
      donation,
      provider,
      status: progress.status,
      confirmedPortions,
      actualPortionsPickedUp,
      portionsDiscrepancy,
      shortfallPortions,
      estimatedArrivalMinutesFromStart: progress.estimatedArrivalMinutesFromStart ?? (index + 1) * 15,
      estimatedArrivalTimeFormatted: progress.estimatedArrivalTimeFormatted || `${21 + Math.floor((index * 15) / 60)}:${String((index * 15) % 60).padStart(2, '0')}`,
      collectedAt: progress.collectedAt || donation.collectedAt,
      failedReason: progress.failReason || donation.failureReason,
      receivedPortions: donation.receivedPortions,
      distributedPortions: donation.distributedPortions,
    };
  });
}

export interface DataIntegrityResult {
  passed: boolean;
  errors: string[];
  checks: {
    noDoubleBookings: { passed: boolean; message: string };
    noScheduledInPool: { passed: boolean; message: string };
    quantitiesValid: { passed: boolean; message: string };
    totalsBalanced: { passed: boolean; message: string };
  };
  summary: {
    totalDonations: number;
    totalCollections: number;
    poolSize: number;
    eventLogCount: number;
  };
}

/**
 * Integrity Guard: dev-only data consistency checker.
 * Verifies:
 * 1. No donation is in two collections.
 * 2. No scheduled donation is in the plan pool.
 * 3. No negative or over-quantity values (collected <= confirmed, received <= collected, distributed <= received).
 * 4. Totals equal the sum of their parts (collections, NGO impact, provider impact).
 */
export function runDataIntegrityChecks(state: SurplusLinkState): DataIntegrityResult {
  const errors: string[] = [];
  const donations = state.donations || [];
  const collections = state.collections || [];
  const donationMap = new Map(donations.map((d) => [d.id, d]));

  // Check 1: No donation is in two collections
  const donationToCollections = new Map<string, string[]>();
  for (const c of collections) {
    for (const donId of c.donationIds || []) {
      const list = donationToCollections.get(donId) || [];
      list.push(c.id);
      donationToCollections.set(donId, list);
    }
  }

  let doubleBookingCount = 0;
  for (const [donId, cIds] of donationToCollections.entries()) {
    if (cIds.length > 1) {
      doubleBookingCount++;
      const d = donationMap.get(donId);
      errors.push(
        `Donation "${d?.foodItem || donId}" (ID: ${donId}) belongs to multiple collections: ${cIds.join(', ')}`
      );
    }
  }
  const noDoubleBookings = {
    passed: doubleBookingCount === 0,
    message:
      doubleBookingCount === 0
        ? `Pass: All ${collections.length} collections have unique, non-overlapping donation assignments.`
        : `Fail: ${doubleBookingCount} donation(s) booked in multiple collections.`,
  };

  // Check 2: No scheduled donation is in the plan pool
  const pool = confirmedPool({ donations });
  const scheduledInPool: FoodDonation[] = [];
  for (const d of pool) {
    if (
      d.status !== 'Confirmed' ||
      d.scheduledCollectionId ||
      ['Scheduled', 'En route', 'Arrived', 'Collected', 'Received', 'Distributed'].includes(d.status)
    ) {
      scheduledInPool.push(d);
      errors.push(
        `Donation "${d.foodItem}" (ID: ${d.id}) has status "${d.status}" (collection: ${d.scheduledCollectionId || 'none'}) but remains in confirmed plan pool.`
      );
    }
  }
  const noScheduledInPool = {
    passed: scheduledInPool.length === 0,
    message:
      scheduledInPool.length === 0
        ? `Pass: Confirmed plan pool has ${pool.length} items; zero scheduled or active donations present.`
        : `Fail: ${scheduledInPool.length} scheduled donation(s) found in plan pool.`,
  };

  // Check 3: Quantity lifecycle invariants per donation
  // (collected <= confirmed, received <= collected, distributed <= received, all non-negative)
  let quantityViolations = 0;
  for (const d of donations) {
    const confirmed = d.confirmedPortions ?? d.portions ?? 0;
    if (confirmed < 0) {
      quantityViolations++;
      errors.push(`Donation "${d.foodItem}" has negative confirmed quantity: ${confirmed}`);
    }

    if (d.collectedPortions !== undefined) {
      if (d.collectedPortions < 0) {
        quantityViolations++;
        errors.push(`Donation "${d.foodItem}" has negative collected quantity: ${d.collectedPortions}`);
      }
      if (d.collectedPortions > confirmed) {
        quantityViolations++;
        errors.push(
          `Donation "${d.foodItem}" collected (${d.collectedPortions}) exceeds confirmed (${confirmed})`
        );
      }
    }

    if (d.receivedPortions !== undefined) {
      if (d.receivedPortions < 0) {
        quantityViolations++;
        errors.push(`Donation "${d.foodItem}" has negative received quantity: ${d.receivedPortions}`);
      }
      const maxAllowedReceived = d.collectedPortions !== undefined ? d.collectedPortions : confirmed;
      if (d.receivedPortions > maxAllowedReceived + 0.01) {
        quantityViolations++;
        errors.push(
          `Donation "${d.foodItem}" received (${d.receivedPortions}) exceeds collected (${maxAllowedReceived})`
        );
      }
    }

    if (d.distributedPortions !== undefined) {
      if (d.distributedPortions < 0) {
        quantityViolations++;
        errors.push(`Donation "${d.foodItem}" has negative distributed quantity: ${d.distributedPortions}`);
      }
      const maxAllowedDistributed =
        d.receivedPortions !== undefined
          ? d.receivedPortions
          : d.collectedPortions !== undefined
          ? d.collectedPortions
          : confirmed;
      if (d.distributedPortions > maxAllowedDistributed + 0.01) {
        quantityViolations++;
        errors.push(
          `Donation "${d.foodItem}" distributed (${d.distributedPortions}) exceeds received (${maxAllowedDistributed})`
        );
      }
    }
  }
  const quantitiesValid = {
    passed: quantityViolations === 0,
    message:
      quantityViolations === 0
        ? `Pass: All ${donations.length} donations satisfy confirmed >= collected >= received >= distributed >= 0.`
        : `Fail: ${quantityViolations} quantity lifecycle violation(s) detected.`,
  };

  // Check 4: Totals equal the sum of their parts
  let totalsDrift = 0;
  for (const c of collections) {
    const totals = collectionTotals(c, donations);
    let expectedConfirmed = 0;
    let expectedCollected = 0;
    let expectedReceived = 0;
    let expectedDistributed = 0;

    for (const donId of c.donationIds) {
      const d = donationMap.get(donId);
      if (d) {
        expectedConfirmed += d.confirmedPortions ?? d.portions ?? 0;
        expectedCollected += d.collectedPortions ?? 0;
        expectedReceived += d.receivedPortions ?? 0;
        expectedDistributed += d.distributedPortions ?? 0;
      }
    }

    if (Math.abs(totals.totalConfirmedPortions - expectedConfirmed) > 0.01) {
      totalsDrift++;
      errors.push(
        `Collection T#${c.tripNumber} confirmed total mismatch: selector=${totals.totalConfirmedPortions}, sum=${expectedConfirmed}`
      );
    }
    if (Math.abs(totals.totalCollectedPortions - expectedCollected) > 0.01) {
      totalsDrift++;
      errors.push(
        `Collection T#${c.tripNumber} collected total mismatch: selector=${totals.totalCollectedPortions}, sum=${expectedCollected}`
      );
    }
    if (Math.abs(totals.totalReceivedPortions - expectedReceived) > 0.01) {
      totalsDrift++;
      errors.push(
        `Collection T#${c.tripNumber} received total mismatch: selector=${totals.totalReceivedPortions}, sum=${expectedReceived}`
      );
    }
    if (Math.abs(totals.totalDistributedPortions - expectedDistributed) > 0.01) {
      totalsDrift++;
      errors.push(
        `Collection T#${c.tripNumber} distributed total mismatch: selector=${totals.totalDistributedPortions}, sum=${expectedDistributed}`
      );
    }
  }

  // NGO impact sum check
  const ngo = ngoImpact({ donations });
  let sumNgoDonated = 0;
  let sumNgoCollected = 0;
  let sumNgoReceived = 0;
  let sumNgoDistributed = 0;
  for (const d of donations) {
    if (d.status !== 'Draft' && d.status !== 'Cancelled') {
      sumNgoDonated += d.confirmedPortions ?? d.portions ?? 0;
    }
    if (d.collectedPortions && d.collectedPortions > 0) sumNgoCollected += d.collectedPortions;
    if (d.receivedPortions && d.receivedPortions > 0) sumNgoReceived += d.receivedPortions;
    if (d.distributedPortions && d.distributedPortions > 0) sumNgoDistributed += d.distributedPortions;
  }
  if (Math.abs(ngo.donated - sumNgoDonated) > 0.01) {
    totalsDrift++;
    errors.push(`NGO impact donated total (${ngo.donated}) != sum of donations (${sumNgoDonated})`);
  }
  if (Math.abs(ngo.collected - sumNgoCollected) > 0.01) {
    totalsDrift++;
    errors.push(`NGO impact collected total (${ngo.collected}) != sum of donations (${sumNgoCollected})`);
  }
  if (Math.abs(ngo.received - sumNgoReceived) > 0.01) {
    totalsDrift++;
    errors.push(`NGO impact received total (${ngo.received}) != sum of donations (${sumNgoReceived})`);
  }
  if (Math.abs(ngo.distributed - sumNgoDistributed) > 0.01) {
    totalsDrift++;
    errors.push(`NGO impact distributed total (${ngo.distributed}) != sum of donations (${sumNgoDistributed})`);
  }

  const totalsBalanced = {
    passed: totalsDrift === 0,
    message:
      totalsDrift === 0
        ? `Pass: All collection & NGO totals equal the exact sum of their constituent donations.`
        : `Fail: ${totalsDrift} total sum mismatch(es) detected.`,
  };

  const passed =
    noDoubleBookings.passed &&
    noScheduledInPool.passed &&
    quantitiesValid.passed &&
    totalsBalanced.passed;

  return {
    passed,
    errors,
    checks: {
      noDoubleBookings,
      noScheduledInPool,
      quantitiesValid,
      totalsBalanced,
    },
    summary: {
      totalDonations: donations.length,
      totalCollections: collections.length,
      poolSize: pool.length,
      eventLogCount: (state.eventLog || []).length,
    },
  };
}
