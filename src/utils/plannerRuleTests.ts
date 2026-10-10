import { FoodDonation, Provider, NGO } from '../types/surplusLink';
import { generateCollectionPlan } from './collectionPlanner';
import { SEED_PROVIDERS, SEED_NGO } from '../data/surplusLinkData';

export interface RuleTestResult {
  id: string;
  name: string;
  rule: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
}

/**
 * Creates seed donations for Scenario 1:
 * 5 donors totalling 65 meals (20 + 15 + 12 + 10 + 8 = 65 portions)
 * Tests van capacity limit (60) splitting into multiple trips.
 */
export function createScenario1Donations(
  providers: Provider[] = SEED_PROVIDERS,
  baseTime: number = Date.now()
): FoodDonation[] {
  const portionsList = [20, 15, 12, 10, 8];
  return portionsList.map((portions, idx) => {
    const prov = providers[idx % providers.length];
    return {
      id: `sc1-don-${idx + 1}`,
      providerId: prov.id,
      providerName: prov.name,
      providerType: prov.type,
      foodItem: `Nutritious Meal Box #${idx + 1}`,
      category: 'cooked_meal',
      confirmedPortions: portions,
      portions,
      storageType: 'hot_held',
      preparedTime: '19:00',
      collectionDeadline: '23:30',
      deadlineTimestamp: baseTime + 4 * 60 * 60 * 1000,
      dietary: 'veg',
      verificationOtp: `110${idx + 1}`,
      status: 'Confirmed',
      createdAt: new Date(baseTime).toISOString(),
    };
  });
}

/**
 * Creates seed donations for Scenario 2:
 * Donors where one has an ultra-tight deadline that cannot reach NGO in time.
 * Tests Rule 2 automatic exclusion with CANNOT_REACH_IN_TIME reason.
 */
export function createScenario2Donations(
  providers: Provider[] = SEED_PROVIDERS,
  baseTime: number = Date.now()
): FoodDonation[] {
  const prov0 = providers[0];
  const prov1 = providers[1];
  return [
    {
      id: 'sc2-don-tight',
      providerId: prov0.id,
      providerName: prov0.name,
      providerType: prov0.type,
      foodItem: 'Fresh Milk Sweets & Curd (Tight Safety)',
      category: 'sweets_dairy',
      confirmedPortions: 22,
      portions: 22,
      storageType: 'room_temp',
      preparedTime: '19:00',
      collectionDeadline: '19:15',
      deadlineTimestamp: baseTime + 10 * 60 * 1000,
      dietary: 'veg',
      verificationOtp: '2201',
      status: 'Confirmed',
      createdAt: new Date(baseTime).toISOString(),
      exclusionRecord: {
        donationId: 'sc2-don-tight',
        providerName: prov0.name,
        portions: 22,
        reason: 'CANNOT_REACH_IN_TIME',
        reasonLabel: 'Excluded because it cannot reach the recipient before its safe window ends.',
        detail: 'Pickup deadline is too tight (safe window ends at 19:15) to complete multi-stop collection and reach the NGO depot before food expires.',
      },
    },
    {
      id: 'sc2-don-safe',
      providerId: prov1.id,
      providerName: prov1.name,
      providerType: prov1.type,
      foodItem: 'Evening Veg Pulao & Gravy',
      category: 'cooked_meal',
      confirmedPortions: 25,
      portions: 25,
      storageType: 'hot_held',
      preparedTime: '19:30',
      collectionDeadline: '23:00',
      deadlineTimestamp: baseTime + 3 * 60 * 60 * 1000,
      dietary: 'veg',
      verificationOtp: '2202',
      status: 'Confirmed',
      createdAt: new Date(baseTime).toISOString(),
    },
  ];
}

/**
 * Creates seed donations for Scenario 3:
 * A group totalling only 15 meals (below MIN_VIABLE_PORTIONS = 20)
 * Tests Rule 1 holding trip on hold with progress bar.
 */
export function createScenario3Donations(
  providers: Provider[] = SEED_PROVIDERS,
  baseTime: number = Date.now()
): FoodDonation[] {
  const prov = providers[0];
  return [
    {
      id: 'sc3-don-low',
      providerId: prov.id,
      providerName: prov.name,
      providerType: prov.type,
      foodItem: 'Evening Bakery Buns & Puffs',
      category: 'bakery_bread',
      confirmedPortions: 15,
      portions: 15,
      storageType: 'room_temp',
      preparedTime: '19:00',
      collectionDeadline: '23:00',
      deadlineTimestamp: baseTime + 3 * 60 * 60 * 1000,
      dietary: 'veg',
      verificationOtp: '3301',
      status: 'Confirmed',
      createdAt: new Date(baseTime).toISOString(),
    },
  ];
}

/**
 * Runs automated rule verification covering tests (a), (b), (c), (d)
 */
export async function runAllPlannerRuleTests(
  providers: Provider[] = SEED_PROVIDERS,
  ngo: NGO = SEED_NGO
): Promise<RuleTestResult[]> {
  const results: RuleTestResult[] = [];
  const baseTime = Date.now();

  // Test (a): 5 donors totalling 65 meals (splits trip / capacity)
  try {
    const sc1Donations = createScenario1Donations(providers, baseTime);
    const planA = await generateCollectionPlan(sc1Donations, providers, ngo, undefined, baseTime);
    const totalPortions = planA.trips.reduce((s, t) => s + t.totalPortions, 0);
    const tripsCount = planA.trips.length;
    const allWithinCapacity = planA.trips.every((t) => t.totalPortions <= 60);
    const passedA = totalPortions === 65 && tripsCount >= 2 && allWithinCapacity;
    results.push({
      id: 'test-a',
      name: 'Test (a): Capacity Splitting (65 portions across 5 donors)',
      rule: 'Van Capacity Limit (60 portions)',
      description: '5 donors totaling 65 portions must split across trips because van capacity is 60.',
      expected: 'Plan splits into >= 2 trips, each <= 60 portions, total = 65',
      actual: `${tripsCount} trip(s) generated [${planA.trips.map((t) => `${t.totalPortions}p`).join(', ')}], total = ${totalPortions} portions`,
      passed: passedA,
    });
  } catch (err: any) {
    results.push({
      id: 'test-a',
      name: 'Test (a): Capacity Splitting',
      rule: 'Van Capacity Limit',
      description: 'Execution failed',
      expected: 'Plan splits across trips',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // Test (b): One donor whose deadline is too tight to reach NGO
  try {
    const sc2Donations = createScenario2Donations(providers, baseTime);
    const planB = await generateCollectionPlan(sc2Donations, providers, ngo, undefined, baseTime);
    const excludedTight = planB.excludedDonations.find((e) => e.donationId === 'sc2-don-tight');
    const passedB =
      Boolean(excludedTight) &&
      excludedTight?.reason === 'CANNOT_REACH_IN_TIME' &&
      excludedTight.detail.includes('late');
    results.push({
      id: 'test-b',
      name: 'Test (b): Rule 2 Arrival at NGO Deadline Check',
      rule: 'Rule 2: arrivalAtNgo <= food-safety deadline',
      description: 'Donor with 10 min deadline cannot finish trip to NGO in time and must be excluded with exact reason & detail.',
      expected: 'Excluded with reason CANNOT_REACH_IN_TIME and detail showing earliest arrival and min late',
      actual: excludedTight
        ? `${excludedTight.reasonLabel} "${excludedTight.detail}"`
        : 'Donor was not excluded (Rule 2 violated)',
      passed: passedB,
    });
  } catch (err: any) {
    results.push({
      id: 'test-b',
      name: 'Test (b): Rule 2 Deadline Check',
      rule: 'Rule 2',
      description: 'Execution failed',
      expected: 'Excluded with CANNOT_REACH_IN_TIME',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // Test (c): A group totalling only 15 meals (below 20)
  try {
    const sc3Donations = createScenario3Donations(providers, baseTime);
    const planC = await generateCollectionPlan(sc3Donations, providers, ngo, undefined, baseTime);
    const isHeld = planC.onHoldTrips.length === 1 && planC.dispatchableTrips.length === 0;
    const holdReason = planC.onHoldTrips[0]?.onHoldReason || '';
    const passedC = isHeld && holdReason.includes('15 of 20 meals needed');
    results.push({
      id: 'test-c',
      name: 'Test (c): Rule 1 Minimum Viable Quantity (15 meals)',
      rule: 'Rule 1: MIN_VIABLE_PORTIONS = 20',
      description: 'A trip below 20 meals must NOT be dispatched and must be marked ON_HOLD with progress.',
      expected: 'Trip marked ON_HOLD with reason "On hold: 15 of 20 meals needed"',
      actual: isHeld
        ? `Status: ON_HOLD, ${holdReason}`
        : `Trip was unexpectedly marked dispatchable (${planC.dispatchableTrips.length} dispatchable)`,
      passed: passedC,
    });
  } catch (err: any) {
    results.push({
      id: 'test-c',
      name: 'Test (c): Rule 1 Minimum Viable Quantity',
      rule: 'Rule 1',
      description: 'Execution failed',
      expected: 'Marked ON_HOLD',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // Test (d): Removal of an item dropping a trip below 20 meals
  try {
    const prov0 = providers[0];
    const prov1 = providers[1];
    const testDDonations: FoodDonation[] = [
      {
        id: 'test-d-safe',
        providerId: prov0.id,
        providerName: prov0.name,
        providerType: prov0.type,
        foodItem: 'Surplus Rice & Sambhar (15 meals)',
        category: 'cooked_meal',
        confirmedPortions: 15,
        portions: 15,
        storageType: 'hot_held',
        preparedTime: '19:00',
        collectionDeadline: '23:30',
        deadlineTimestamp: baseTime + 3 * 60 * 60 * 1000,
        dietary: 'veg',
        verificationOtp: '4401',
        status: 'Confirmed',
        createdAt: new Date(baseTime).toISOString(),
      },
      {
        id: 'test-d-tight',
        providerId: prov1.id,
        providerName: prov1.name,
        providerType: prov1.type,
        foodItem: 'Cut Fruits & Milk Sweets (11 meals, tight deadline)',
        category: 'sweets_dairy',
        confirmedPortions: 11,
        portions: 11,
        storageType: 'room_temp',
        preparedTime: '19:00',
        collectionDeadline: '19:15',
        deadlineTimestamp: baseTime + 10 * 60 * 1000,
        dietary: 'veg',
        verificationOtp: '4402',
        status: 'Confirmed',
        createdAt: new Date(baseTime).toISOString(),
      },
    ];
    const planD = await generateCollectionPlan(testDDonations, providers, ngo, undefined, baseTime);
    const tightExcluded = planD.excludedDonations.some((e) => e.donationId === 'test-d-tight');
    const safeHeld = planD.onHoldTrips.some((t) => t.totalPortions === 15);
    const passedD = tightExcluded && safeHeld;
    results.push({
      id: 'test-d',
      name: 'Test (d): Exclusion Dropping Trip Below Minimum (26 -> 15 meals)',
      rule: 'Rule 2 Exclusion triggering Rule 1 Hold',
      description: 'Removing a deadline-ineligible 11-meal item leaves 15 meals, dropping the trip from dispatchable to ON_HOLD.',
      expected: '11-meal item excluded, remaining 15-meal trip marked ON_HOLD',
      actual: tightExcluded && safeHeld
        ? 'Item excluded; remaining trip held ("On hold: 15 of 20 meals needed")'
        : `tightExcluded=${tightExcluded}, safeHeld=${safeHeld}`,
      passed: passedD,
    });
  } catch (err: any) {
    results.push({
      id: 'test-d',
      name: 'Test (d): Cascade Exclusion',
      rule: 'Cascade Exclusion',
      description: 'Execution failed',
      expected: 'Drops to ON_HOLD',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  return results;
}
