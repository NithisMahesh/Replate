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
} from './types/surplusLink';

export interface SurplusLinkState {
  providers: Provider[];
  ngo: NGO;
  donations: FoodDonation[];
  collections: Collection[];
  notifications: InAppNotification[];
  collectionPlan?: CollectionPlan | null;
  selectedCollectionId?: string | null;
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

    return {
      stopOrder: index + 1,
      donationId: donId,
      donation,
      provider,
      status: progress.status,
      confirmedPortions,
      actualPortionsPickedUp,
      portionsDiscrepancy,
      estimatedArrivalMinutesFromStart: progress.estimatedArrivalMinutesFromStart ?? (index + 1) * 15,
      estimatedArrivalTimeFormatted: progress.estimatedArrivalTimeFormatted || `${21 + Math.floor((index * 15) / 60)}:${String((index * 15) % 60).padStart(2, '0')}`,
      collectedAt: progress.collectedAt,
      failedReason: progress.failReason || donation.failureReason,
      receivedPortions: donation.receivedPortions,
      distributedPortions: donation.distributedPortions,
    };
  });
}
