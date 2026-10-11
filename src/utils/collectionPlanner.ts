import {
  NGO,
  Provider,
  FoodDonation,
  TripPlan,
  TripStop,
  CollectionPlan,
  ExcludedDonationRecord,
  MealSlot,
} from '../types/surplusLink';
import {
  PlannerConfig,
  getSavedPlannerConfig,
} from '../config/plannerConfig';

/**
 * Calculates Haversine great-circle distance between two GPS coordinates in kilometers
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Format timestamp in user-friendly 12-hour format e.g. "9:42 PM"
 */
export function formatTime12h(timestampMs: number): string {
  const date = new Date(timestampMs);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Estimate road driving minutes between two points using Haversine with urban factor
 * at configured city traffic speed (default 25 km/h)
 */
export function estimateDriveMinutes(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  speedKmh: number = 25
): { distanceKm: number; durationMins: number } {
  const straightDist = haversineDistanceKm(lat1, lng1, lat2, lng2);
  const roadDist = Number((straightDist * 1.35).toFixed(2)); // 1.35 urban circuity factor
  const durationMins = Math.max(1, Math.round((roadDist / speedKmh) * 60));
  return { distanceKm: roadDist, durationMins };
}

/**
 * Calculates road distance using Haversine with 1.35 urban circuity factor
 */
export function haversineRoadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const straight = haversineDistanceKm(lat1, lon1, lat2, lon2);
  return Number((straight * 1.35).toFixed(2));
}

/**
 * Computes road distance from NGO to provider using OSRM with Haversine fallback
 */
export async function computeProviderDistanceKmFromNgo(
  ngo: { lat: number; lng: number },
  provider: { lat: number; lng: number }
): Promise<number> {
  try {
    const route = await fetchOsrmRoute([
      { lat: ngo.lat, lng: ngo.lng },
      { lat: provider.lat, lng: provider.lng },
    ]);
    if (route.success && route.distanceKm > 0) {
      return route.distanceKm;
    }
  } catch {
    // fallback
  }
  return haversineRoadDistanceKm(ngo.lat, ngo.lng, provider.lat, provider.lng);
}

/**
 * Fetches real road distance, duration, and GeoJSON polyline geometry from public OSRM API
 * Note: OSRM expects coordinates in lon,lat order!
 */
export async function fetchOsrmRoute(
  coords: { lat: number; lng: number }[],
  speedKmh: number = 25
): Promise<{
  distanceKm: number;
  durationMins: number;
  polyline: [number, number][];
  success: boolean;
}> {
  try {
    const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Number((route.distance / 1000).toFixed(1));
      const durationMins = Math.max(1, Math.round(route.duration / 60));
      const polyline: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      return {
        distanceKm,
        durationMins,
        polyline,
        success: true,
      };
    }
    throw new Error('OSRM route not found');
  } catch {
    // Fallback: Haversine distance with 1.35 circuity factor and city traffic speed
    let totalDist = 0;
    let totalMins = 0;
    for (let k = 0; k < coords.length - 1; k++) {
      const est = estimateDriveMinutes(
        coords[k].lat,
        coords[k].lng,
        coords[k + 1].lat,
        coords[k + 1].lng,
        speedKmh
      );
      totalDist += est.distanceKm;
      totalMins += est.durationMins;
    }
    return {
      distanceKm: Number(totalDist.toFixed(1)),
      durationMins: Math.max(1, totalMins),
      polyline: coords.map((c) => [c.lat, c.lng]),
      success: false,
    };
  }
}

interface CandidateItem {
  donation: FoodDonation;
  provider: Provider;
}

/**
 * Orders stops using greedy nearest-neighbor heuristic starting from NGO
 */
function orderStopsGreedy(
  items: CandidateItem[],
  ngo: NGO
): CandidateItem[] {
  const unvisited = [...items];
  let currentLoc = { lat: ngo.lat, lng: ngo.lng };
  const ordered: CandidateItem[] = [];

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistanceKm(
        currentLoc.lat,
        currentLoc.lng,
        unvisited[i].provider.lat,
        unvisited[i].provider.lng
      );
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    const next = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(next);
    currentLoc = { lat: next.provider.lat, lng: next.provider.lng };
  }

  return ordered;
}

/**
 * RULE 2 Route and Deadline Evaluator
 * arrivalAtNgo = trip start time + travel time to that stop + handling time at that stop (default 5 min)
 *                + travel time of the remaining route from that stop to the NGO + final handover buffer (default 10 min).
 * Checks arrival at NGO against each donation's food-safety deadline.
 */
async function evaluateTripTiming(
  orderedItems: CandidateItem[],
  ngo: NGO,
  startTime: number,
  config: PlannerConfig
): Promise<{
  allPassed: boolean;
  failingItems: Array<{ item: CandidateItem; arrivalAtNgo: number; minsLate: number }>;
  tripStops: TripStop[];
  routeDistanceKm: number;
  routeDurationMins: number;
  polylineCoords: [number, number][];
  isEstimatedDistance: boolean;
  separateTripsDistanceKm: number;
}> {
  if (orderedItems.length === 0) {
    return {
      allPassed: true,
      failingItems: [],
      tripStops: [],
      routeDistanceKm: 0,
      routeDurationMins: 0,
      polylineCoords: [],
      isEstimatedDistance: false,
      separateTripsDistanceKm: 0,
    };
  }

  const coords = [
    { lat: ngo.lat, lng: ngo.lng },
    ...orderedItems.map((s) => ({ lat: s.provider.lat, lng: s.provider.lng })),
    { lat: ngo.lat, lng: ngo.lng },
  ];

  const routeResult = await fetchOsrmRoute(coords, config.cityTrafficSpeedKmh);
  const totalDrivingMins = routeResult.durationMins;
  const isEstimatedDistance = !routeResult.success;

  const legTimesMins: number[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const est = estimateDriveMinutes(
      coords[i].lat,
      coords[i].lng,
      coords[i + 1].lat,
      coords[i + 1].lng,
      config.cityTrafficSpeedKmh
    );
    legTimesMins.push(est.durationMins);
  }

  const sumLegs = legTimesMins.reduce((a, b) => a + b, 0) || 1;
  const scale = totalDrivingMins / sumLegs;
  const adjustedLegMins = legTimesMins.map((t) => Math.max(1, Math.round(t * scale)));

  let elapsedMinutes = 0;
  const tripStops: TripStop[] = [];
  const failingItems: Array<{ item: CandidateItem; arrivalAtNgo: number; minsLate: number }> = [];
  const m = orderedItems.length;

  for (let idx = 0; idx < m; idx++) {
    const item = orderedItems[idx];
    const legDriveToStop = adjustedLegMins[idx];
    elapsedMinutes += legDriveToStop;
    const stopArrivalMs = startTime + elapsedMinutes * 60 * 1000;

    const remainingDriveMins = adjustedLegMins.slice(idx + 1).reduce((a, b) => a + b, 0);
    const remainingHandlingMins = (m - idx) * config.handlingTimePerStopMins;
    const timeFromStopToNgoHandover =
      remainingDriveMins + remainingHandlingMins + config.finalHandoverBufferMins;
    const arrivalAtNgoMs = stopArrivalMs + timeFromStopToNgoHandover * 60 * 1000;
    const deadlineMs = item.donation.deadlineTimestamp;
    const isSafe = arrivalAtNgoMs <= deadlineMs;
    const marginMins = Math.round((deadlineMs - arrivalAtNgoMs) / 60000);

    if (!isSafe) {
      const minsLate = Math.max(1, Math.ceil((arrivalAtNgoMs - deadlineMs) / 60000));
      failingItems.push({ item, arrivalAtNgo: arrivalAtNgoMs, minsLate });
    }

    tripStops.push({
      stopOrder: idx + 1,
      providerId: item.provider.id,
      providerName: item.provider.name,
      providerType: item.provider.type,
      address: item.provider.address,
      lat: item.provider.lat,
      lng: item.provider.lng,
      donationId: item.donation.id,
      foodItem: item.donation.foodItem,
      portions: item.donation.confirmedPortions ?? item.donation.portions,
      collectionDeadline: item.donation.collectionDeadline,
      deadlineTimestamp: item.donation.deadlineTimestamp,
      verificationOtp: item.donation.verificationOtp,
      estimatedArrivalMinutesFromStart: elapsedMinutes,
      isDeadlineMet: isSafe,
      mealSlot: item.donation.mealSlot || 'night',
      arrivalAtNgoTimestamp: arrivalAtNgoMs,
      arrivalAtNgoFormatted: formatTime12h(arrivalAtNgoMs),
      deadlineFormatted: formatTime12h(deadlineMs),
      marginMinutes: marginMins,
    });

    elapsedMinutes += config.handlingTimePerStopMins;
  }

  let separateTripsDistanceKm = 0;
  orderedItems.forEach((s) => {
    const oneWayKm = haversineDistanceKm(ngo.lat, ngo.lng, s.provider.lat, s.provider.lng);
    separateTripsDistanceKm += oneWayKm * 2 * 1.35;
  });
  separateTripsDistanceKm = Number(separateTripsDistanceKm.toFixed(1));

  const totalTripDurationMins =
    totalDrivingMins + m * config.handlingTimePerStopMins + config.finalHandoverBufferMins;

  return {
    allPassed: failingItems.length === 0,
    failingItems,
    tripStops,
    routeDistanceKm: routeResult.distanceKm,
    routeDurationMins: totalTripDurationMins,
    polylineCoords: routeResult.polyline,
    isEstimatedDistance,
    separateTripsDistanceKm,
  };
}

/**
 * Main Collection Planning Engine
 * Strictly implements RULE 1, RULE 2, RULE 3 and iterative route stability
 */
export async function generateCollectionPlan(
  confirmedDonations: FoodDonation[],
  providers: Provider[],
  ngo: NGO,
  customConfig?: Partial<PlannerConfig>,
  customStartTime?: number,
  targetMealSlot?: MealSlot
): Promise<CollectionPlan> {
  const config: PlannerConfig = {
    ...getSavedPlannerConfig(),
    ...(customConfig || {}),
  };

  const providerMap = new Map(providers.map((p) => [p.id, p]));
  const startTime = customStartTime ?? Date.now();
  const excludedDonations: ExcludedDonationRecord[] = [];

  const effectiveMealSlot: MealSlot =
    targetMealSlot || (confirmedDonations[0]?.mealSlot || 'night');

  // STEP 1 & 2: Start with Confirmed donations matching the target mealSlot.
  // Donations from different meals are never mixed in one trip.
  const eligibleCandidates: CandidateItem[] = [];

  for (const d of confirmedDonations) {
    if (d.status !== 'Confirmed') continue;
    const dMealSlot: MealSlot = d.mealSlot || 'night';
    if (dMealSlot !== effectiveMealSlot) continue;

    let provider = providerMap.get(d.providerId);
    if (!provider) {
      if (d.lat !== undefined && d.lng !== undefined) {
        const pLat = d.lat;
        const pLng = d.lng;
        const distKm = haversineRoadDistanceKm(ngo.lat, ngo.lng, pLat, pLng);
        provider = {
          id: d.providerId || `provider-${d.id}`,
          name: d.providerName || 'Local Donor',
          type: d.providerType || 'restaurant',
          lat: pLat,
          lng: pLng,
          distanceKmFromNgo: distKm,
          closingTime: d.collectionDeadline || '23:00',
          address: d.locationLandmark || `${pLat.toFixed(4)}, ${pLng.toFixed(4)}`,
          phone: d.contactPhone || '9876543210',
          contactPerson: d.providerName || 'Store Manager',
        };
      } else {
        continue;
      }
    }

    // Check 2a: MISSING_SAFETY_INFO
    if (!d.category || !d.storageType) {
      excludedDonations.push({
        donationId: d.id,
        providerName: provider.name,
        portions: d.confirmedPortions ?? d.portions ?? 0,
        reason: 'MISSING_SAFETY_INFO',
        reasonLabel: 'Excluded because required food-safety details are missing.',
        detail: 'Missing food category or storage condition information.',
        mealSlot: dMealSlot,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    // Check 2b: DEADLINE_PASSED (safe window already ended prior to dispatch start)
    if (d.deadlineTimestamp <= startTime) {
      const expiredFormatted = formatTime12h(d.deadlineTimestamp);
      excludedDonations.push({
        donationId: d.id,
        providerName: provider.name,
        portions: d.confirmedPortions ?? d.portions ?? 0,
        reason: 'DEADLINE_PASSED',
        reasonLabel: 'Excluded because its safe window has already ended.',
        detail: `Safe window expired at ${expiredFormatted}.`,
        mealSlot: dMealSlot,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    // Check 2c: OUT_OF_RADIUS (provider located beyond NGO service radius)
    const distFromNgo = provider.distanceKmFromNgo || haversineRoadDistanceKm(ngo.lat, ngo.lng, provider.lat, provider.lng);
    const radiusLimit = ngo.serviceRadiusKm ?? 5.0;
    if (distFromNgo > radiusLimit) {
      excludedDonations.push({
        donationId: d.id,
        providerName: provider.name,
        portions: d.confirmedPortions ?? d.portions ?? 0,
        reason: 'OUT_OF_RADIUS',
        reasonLabel: "Excluded because it is outside this NGO's service radius.",
        detail: `Provider is located ${distFromNgo} km away, exceeding service radius of ${radiusLimit} km.`,
        mealSlot: dMealSlot,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    eligibleCandidates.push({ donation: d, provider });
  }

  // STEP 3: Order by strictest deadline first, then nearest distance, respecting van capacity (60)
  eligibleCandidates.sort((a, b) => {
    const deadlineDiff = a.donation.deadlineTimestamp - b.donation.deadlineTimestamp;
    if (deadlineDiff !== 0) return deadlineDiff;
    const distA = haversineDistanceKm(ngo.lat, ngo.lng, a.provider.lat, a.provider.lng);
    const distB = haversineDistanceKm(ngo.lat, ngo.lng, b.provider.lat, b.provider.lng);
    return distA - distB;
  });

  const tripGroups: CandidateItem[][] = [];
  const unassigned = [...eligibleCandidates];

  while (unassigned.length > 0) {
    const currentTrip: CandidateItem[] = [];
    let currentPortions = 0;
    let i = 0;

    while (i < unassigned.length) {
      const candidate = unassigned[i];
      const portions = candidate.donation.confirmedPortions ?? candidate.donation.portions;
      if (currentPortions + portions <= config.vanCapacityPortions) {
        currentTrip.push(candidate);
        currentPortions += portions;
        unassigned.splice(i, 1);
      } else {
        i++;
      }
    }

    if (currentTrip.length === 0 && unassigned.length > 0) {
      currentTrip.push(unassigned.shift()!);
    }

    tripGroups.push(currentTrip);
  }

  // STEP 4: For each trip, compute route and check Rule 2 for every stop.
  // Remove failing items (to Excluded), then RECOMPUTE route and re-check until no item fails.
  const validatedTripBundles: Array<{
    items: CandidateItem[];
    evalResult: Awaited<ReturnType<typeof evaluateTripTiming>>;
  }> = [];

  for (const group of tripGroups) {
    let currentItems = [...group];

    while (currentItems.length > 0) {
      const ordered = orderStopsGreedy(currentItems, ngo);
      const evalResult = await evaluateTripTiming(ordered, ngo, startTime, config);

      if (evalResult.allPassed) {
        validatedTripBundles.push({ items: ordered, evalResult });
        break;
      }

      // Remove failing items (Rule 3)
      for (const failing of evalResult.failingItems) {
        const arrivalFormatted = formatTime12h(failing.arrivalAtNgo);
        const deadlineFormatted = formatTime12h(failing.item.donation.deadlineTimestamp);
        excludedDonations.push({
          donationId: failing.item.donation.id,
          providerName: failing.item.provider.name,
          portions: failing.item.donation.confirmedPortions ?? failing.item.donation.portions,
          reason: 'CANNOT_REACH_IN_TIME',
          reasonLabel: 'Excluded because it cannot reach the recipient before its safe window ends.',
          detail: `Earliest arrival ${arrivalFormatted}, safe until ${deadlineFormatted} (${failing.minsLate} min late)`,
          timestamp: new Date().toISOString(),
        });
      }

      const failingIds = new Set(evalResult.failingItems.map((f) => f.item.donation.id));
      currentItems = currentItems.filter((it) => !failingIds.has(it.donation.id));
    }
  }

  // STEP 5: Apply Rule 1. If below minViablePortions (20), try merging into another feasible trip first.
  const mergedBundles = [...validatedTripBundles];

  for (let i = 0; i < mergedBundles.length; i++) {
    const bundleI = mergedBundles[i];
    if (!bundleI || bundleI.items.length === 0) continue;
    const portionsI = bundleI.items.reduce(
      (sum, it) => sum + (it.donation.confirmedPortions ?? it.donation.portions),
      0
    );

    if (portionsI < config.minViablePortions) {
      for (let j = 0; j < mergedBundles.length; j++) {
        if (i === j) continue;
        const bundleJ = mergedBundles[j];
        if (!bundleJ || bundleJ.items.length === 0) continue;
        const portionsJ = bundleJ.items.reduce(
          (sum, it) => sum + (it.donation.confirmedPortions ?? it.donation.portions),
          0
        );

        if (portionsI + portionsJ <= config.vanCapacityPortions) {
          const combinedItems = [...bundleJ.items, ...bundleI.items];
          const combinedOrdered = orderStopsGreedy(combinedItems, ngo);
          const combinedEval = await evaluateTripTiming(combinedOrdered, ngo, startTime, config);
          if (combinedEval.allPassed) {
            mergedBundles[j] = { items: combinedOrdered, evalResult: combinedEval };
            mergedBundles.splice(i, 1);
            i--;
            break;
          }
        }
      }
    }
  }

  // Build final TripPlan objects with DISPATCHABLE or ON_HOLD status
  const finalTrips: TripPlan[] = [];

  for (let idx = 0; idx < mergedBundles.length; idx++) {
    const bundle = mergedBundles[idx];
    const totalPortions = bundle.items.reduce(
      (sum, it) => sum + (it.donation.confirmedPortions ?? it.donation.portions),
      0
    );
    const isDispatchable = totalPortions >= config.minViablePortions;
    const onHoldReason = isDispatchable
      ? undefined
      : `On hold: ${totalPortions} of ${config.minViablePortions} meals needed`;

    const distanceSavedKm = Math.max(
      0,
      Number((bundle.evalResult.separateTripsDistanceKm - bundle.evalResult.routeDistanceKm).toFixed(1))
    );
    const distanceSavedPercent =
      bundle.evalResult.separateTripsDistanceKm > 0
        ? Math.round((distanceSavedKm / bundle.evalResult.separateTripsDistanceKm) * 100)
        : 0;

    finalTrips.push({
      tripNumber: idx + 1,
      mealSlot: effectiveMealSlot,
      stops: bundle.evalResult.tripStops,
      totalPortions,
      capacityMax: config.vanCapacityPortions,
      distanceKm: bundle.evalResult.routeDistanceKm,
      durationMins: bundle.evalResult.routeDurationMins,
      isEstimatedDistance: bundle.evalResult.isEstimatedDistance,
      polylineCoordinates: bundle.evalResult.polylineCoords,
      separateTripsDistanceKm: bundle.evalResult.separateTripsDistanceKm,
      distanceSavedKm,
      distanceSavedPercent,
      allDeadlinesMet: bundle.evalResult.allPassed,
      dispatchStatus: isDispatchable ? 'DISPATCHABLE' : 'ON_HOLD',
      onHoldReason,
      minViablePortions: config.minViablePortions,
    });
  }

  const dispatchableTrips = finalTrips.filter((t) => t.dispatchStatus === 'DISPATCHABLE');
  const onHoldTrips = finalTrips.filter((t) => t.dispatchStatus === 'ON_HOLD');
  const grandTotalPortions = finalTrips.reduce((sum, t) => sum + t.totalPortions, 0);
  const grandTotalDistanceKm = Number(
    finalTrips.reduce((sum, t) => sum + t.distanceKm, 0).toFixed(1)
  );
  const grandSeparateDistance = finalTrips.reduce((sum, t) => sum + t.separateTripsDistanceKm, 0);
  const grandDistanceSaved = Math.max(
    0,
    Number((grandSeparateDistance - grandTotalDistanceKm).toFixed(1))
  );
  const grandDistanceSavedPercent =
    grandSeparateDistance > 0
      ? Math.round((grandDistanceSaved / grandSeparateDistance) * 100)
      : 0;

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    trips: finalTrips,
    dispatchableTrips,
    onHoldTrips,
    excludedDonations,
    totalPortions: grandTotalPortions,
    totalDistanceKm: grandTotalDistanceKm,
    totalDistanceSavedKm: grandDistanceSaved,
    totalDistanceSavedPercent: grandDistanceSavedPercent,
    totalDonorsCount: finalTrips.reduce((sum, t) => sum + t.stops.length, 0),
    excludedCount: excludedDonations.length,
  };
}
