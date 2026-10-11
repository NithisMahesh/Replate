import { Provider, POSTransaction, FoodDonation, MealSlot, MealSlotWindows } from '../types/surplusLink';

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  morning: 'Breakfast',
  afternoon: 'Lunch',
  night: 'Dinner',
};

export const DEFAULT_MEAL_SLOT_WINDOWS: Record<
  MealSlot,
  { start: string; end: string; label: string }
> = {
  morning: { start: '06:00', end: '10:00', label: 'Breakfast' },
  afternoon: { start: '12:00', end: '15:00', label: 'Lunch' },
  night: { start: '19:00', end: '23:00', label: 'Dinner' },
};

export function getMealSlotLabel(slot: MealSlot): string {
  return MEAL_SLOT_LABELS[slot] || 'Dinner';
}

export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Returns current meal slot based on device clock and saved meal windows.
 */
export function getCurrentMealSlot(windows?: MealSlotWindows): MealSlot {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const morningWindow = windows?.morning || DEFAULT_MEAL_SLOT_WINDOWS.morning;
  const afternoonWindow = windows?.afternoon || DEFAULT_MEAL_SLOT_WINDOWS.afternoon;
  const nightWindow = windows?.night || DEFAULT_MEAL_SLOT_WINDOWS.night;

  const mStart = timeStringToMinutes(morningWindow.start);
  const mEnd = timeStringToMinutes(morningWindow.end);
  const aStart = timeStringToMinutes(afternoonWindow.start);
  const aEnd = timeStringToMinutes(afternoonWindow.end);
  const nStart = timeStringToMinutes(nightWindow.start);
  const nEnd = timeStringToMinutes(nightWindow.end);

  // 1. Direct containment check
  if (currentMinutes >= mStart && currentMinutes <= mEnd) return 'morning';
  if (currentMinutes >= aStart && currentMinutes <= aEnd) return 'afternoon';
  if (currentMinutes >= nStart && currentMinutes <= nEnd) return 'night';

  // 2. Proximity check when outside active windows
  if (currentMinutes < aStart) {
    if (currentMinutes > mEnd) {
      return currentMinutes - mEnd <= aStart - currentMinutes ? 'morning' : 'afternoon';
    }
    return 'morning';
  }

  if (currentMinutes < nStart) {
    if (currentMinutes > aEnd) {
      return currentMinutes - aEnd <= nStart - currentMinutes ? 'afternoon' : 'night';
    }
    return 'afternoon';
  }

  return 'night';
}

/**
 * Tags timestamp with corresponding mealSlot using provider's saved meal windows.
 */
export function getMealSlotFromTimestamp(timeStr: string, windows?: MealSlotWindows): MealSlot {
  if (!timeStr) return 'night';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const minutes = h * 60 + m;

  const morningWindow = windows?.morning || DEFAULT_MEAL_SLOT_WINDOWS.morning;
  const afternoonWindow = windows?.afternoon || DEFAULT_MEAL_SLOT_WINDOWS.afternoon;
  const nightWindow = windows?.night || DEFAULT_MEAL_SLOT_WINDOWS.night;

  const mStart = timeStringToMinutes(morningWindow.start);
  const mEnd = timeStringToMinutes(morningWindow.end);
  const aStart = timeStringToMinutes(afternoonWindow.start);
  const aEnd = timeStringToMinutes(afternoonWindow.end);
  const nStart = timeStringToMinutes(nightWindow.start);
  const nEnd = timeStringToMinutes(nightWindow.end);

  if (minutes >= mStart && minutes <= mEnd) return 'morning';
  if (minutes >= aStart && minutes <= aEnd) return 'afternoon';
  if (minutes >= nStart && minutes <= nEnd) return 'night';

  if (minutes < aStart) {
    if (minutes > mEnd) {
      return minutes - mEnd <= aStart - minutes ? 'morning' : 'afternoon';
    }
    return 'morning';
  }

  if (minutes < nStart) {
    if (minutes > aEnd) {
      return minutes - aEnd <= nStart - minutes ? 'afternoon' : 'night';
    }
    return 'afternoon';
  }

  return 'night';
}

export function getMockPOSTransactions(provider: Provider, mealSlot?: MealSlot): POSTransaction[] {
  const isHostel = provider.type === 'hostel_mess';
  const isBakery = provider.type === 'bakery';

  const finalizeTransactions = (rawList: POSTransaction[]) => {
    const syncCount = provider.billingConnection?.syncCount || 0;
    const combined = [...rawList];
    if (provider.billingConnection?.status === 'connected' && syncCount > 0) {
      const morningWindow = provider.mealSlotWindows?.morning || DEFAULT_MEAL_SLOT_WINDOWS.morning;
      const afternoonWindow = provider.mealSlotWindows?.afternoon || DEFAULT_MEAL_SLOT_WINDOWS.afternoon;
      const nightWindow = provider.mealSlotWindows?.night || DEFAULT_MEAL_SLOT_WINDOWS.night;

      for (let s = 1; s <= Math.min(syncCount, 5); s++) {
        combined.push(
          {
            id: `pos-${provider.id}-sync-m-${s}`,
            orderNumber: `SYNC-BF-${100 + s}`,
            timestamp: morningWindow.start,
            mealSlot: 'morning',
            item: `Live Breakfast Counter Batch #${s}`,
            quantityPortions: 3,
            unitPrice: 40,
            totalAmount: 120,
            paymentMode: 'UPI',
            cashierName: 'Cloud POS Sync',
          },
          {
            id: `pos-${provider.id}-sync-a-${s}`,
            orderNumber: `SYNC-LN-${200 + s}`,
            timestamp: afternoonWindow.start,
            mealSlot: 'afternoon',
            item: `Live Lunch Parcel Batch #${s}`,
            quantityPortions: 4,
            unitPrice: 60,
            totalAmount: 240,
            paymentMode: 'UPI',
            cashierName: 'Cloud POS Sync',
          },
          {
            id: `pos-${provider.id}-sync-n-${s}`,
            orderNumber: `SYNC-DN-${300 + s}`,
            timestamp: nightWindow.start,
            mealSlot: 'night',
            item: `Live Dinner Counter Batch #${s}`,
            quantityPortions: 3,
            unitPrice: 55,
            totalAmount: 165,
            paymentMode: 'UPI',
            cashierName: 'Cloud POS Sync',
          }
        );
      }
    }

    const tagged = combined.map((t) => ({
      ...t,
      mealSlot: getMealSlotFromTimestamp(t.timestamp, provider.mealSlotWindows),
    }));
    return mealSlot ? tagged.filter((t) => t.mealSlot === mealSlot) : tagged;
  };

  if (isHostel) {
    const list: POSTransaction[] = [
      // Breakfast (morning)
      {
        id: `pos-${provider.id}-m1`,
        orderNumber: 'POS-BF-801',
        timestamp: '07:30',
        mealSlot: 'morning',
        item: 'Student Breakfast Idli & Pongal Combo',
        quantityPortions: 35,
        unitPrice: 30,
        totalAmount: 1050,
        paymentMode: 'Mess Card',
        cashierName: 'Counter 1 (Mess Supt)',
      },
      {
        id: `pos-${provider.id}-m2`,
        orderNumber: 'POS-BF-802',
        timestamp: '08:45',
        mealSlot: 'morning',
        item: 'Late Student Vada & Upma Tokens',
        quantityPortions: 25,
        unitPrice: 30,
        totalAmount: 750,
        paymentMode: 'Mess Card',
        cashierName: 'Counter 1 (Mess Supt)',
      },
      // Lunch (afternoon)
      {
        id: `pos-${provider.id}-a1`,
        orderNumber: 'POS-LN-801',
        timestamp: '12:30',
        mealSlot: 'afternoon',
        item: 'Hostel Full Meals Thali (Batch 1)',
        quantityPortions: 45,
        unitPrice: 50,
        totalAmount: 2250,
        paymentMode: 'Mess Card',
        cashierName: 'Counter 1 (Mess Supt)',
      },
      {
        id: `pos-${provider.id}-a2`,
        orderNumber: 'POS-LN-802',
        timestamp: '13:20',
        mealSlot: 'afternoon',
        item: 'Hostel Full Meals Thali (Batch 2)',
        quantityPortions: 30,
        unitPrice: 50,
        totalAmount: 1500,
        paymentMode: 'Mess Card',
        cashierName: 'Counter 2 (Late Desk)',
      },
      // Dinner (night)
      {
        id: `pos-${provider.id}-01`,
        orderNumber: 'POS-TK-801',
        timestamp: '19:15',
        mealSlot: 'night',
        item: 'Student Dinner Thali (Biometric Batch A)',
        quantityPortions: 26,
        unitPrice: 45,
        totalAmount: 1170,
        paymentMode: 'Mess Card',
        cashierName: 'Counter 1 (Mess Supt)',
      },
      {
        id: `pos-${provider.id}-02`,
        orderNumber: 'POS-TK-802',
        timestamp: '19:50',
        mealSlot: 'night',
        item: 'Student Dinner Thali (Biometric Batch B)',
        quantityPortions: 28,
        unitPrice: 45,
        totalAmount: 1260,
        paymentMode: 'Mess Card',
        cashierName: 'Counter 1 (Mess Supt)',
      },
      {
        id: `pos-${provider.id}-03`,
        orderNumber: 'POS-TK-803',
        timestamp: '20:30',
        mealSlot: 'night',
        item: 'Late Hostel Resident Token Batch',
        quantityPortions: 16,
        unitPrice: 45,
        totalAmount: 720,
        paymentMode: 'Mess Card',
        cashierName: 'Counter 2 (Late Desk)',
      },
      {
        id: `pos-${provider.id}-04`,
        orderNumber: 'POS-TK-804',
        timestamp: '21:05',
        mealSlot: 'night',
        item: 'Hostel Guest & Resident Tutor Meals',
        quantityPortions: 10,
        unitPrice: 60,
        totalAmount: 600,
        paymentMode: 'UPI',
        cashierName: 'Counter 1 (Mess Supt)',
      },
    ];
    return finalizeTransactions(list);
  }

  if (isBakery) {
    const list: POSTransaction[] = [
      // Breakfast (morning)
      {
        id: `pos-${provider.id}-m1`,
        orderNumber: 'INV-BK-101',
        timestamp: '07:15',
        mealSlot: 'morning',
        item: 'Morning Warm Bread Loaves & Rusks',
        quantityPortions: 25,
        unitPrice: 45,
        totalAmount: 1125,
        paymentMode: 'UPI',
        cashierName: 'Register 1 (Karthik)',
      },
      {
        id: `pos-${provider.id}-m2`,
        orderNumber: 'INV-BK-102',
        timestamp: '08:30',
        mealSlot: 'morning',
        item: 'Breakfast Tea Buns & Butter Toast',
        quantityPortions: 20,
        unitPrice: 35,
        totalAmount: 700,
        paymentMode: 'Cash',
        cashierName: 'Register 1 (Karthik)',
      },
      // Afternoon (lunch)
      {
        id: `pos-${provider.id}-a1`,
        orderNumber: 'INV-BK-201',
        timestamp: '13:00',
        mealSlot: 'afternoon',
        item: 'Veg Puff & Sandwich Combo',
        quantityPortions: 15,
        unitPrice: 40,
        totalAmount: 600,
        paymentMode: 'UPI',
        cashierName: 'Register 2 (Priya)',
      },
      // Dinner (night)
      {
        id: `pos-${provider.id}-01`,
        orderNumber: 'INV-BK-2041',
        timestamp: '17:45',
        mealSlot: 'night',
        item: 'Tea Rusks, Veg Buns & Filter Coffee Combos',
        quantityPortions: 10,
        unitPrice: 40,
        totalAmount: 400,
        paymentMode: 'UPI',
        cashierName: 'Register 1 (Karthik)',
      },
      {
        id: `pos-${provider.id}-02`,
        orderNumber: 'INV-BK-2042',
        timestamp: '18:20',
        mealSlot: 'night',
        item: 'Fresh Sliced Milk Bread Loaves & Jam',
        quantityPortions: 14,
        unitPrice: 50,
        totalAmount: 700,
        paymentMode: 'Cash',
        cashierName: 'Register 1 (Karthik)',
      },
      {
        id: `pos-${provider.id}-03`,
        orderNumber: 'INV-BK-2043',
        timestamp: '19:10',
        mealSlot: 'night',
        item: 'Evening Snack Boxes & Sweet Buns',
        quantityPortions: 12,
        unitPrice: 65,
        totalAmount: 780,
        paymentMode: 'UPI',
        cashierName: 'Register 2 (Priya)',
      },
      {
        id: `pos-${provider.id}-04`,
        orderNumber: 'INV-BK-2044',
        timestamp: '19:55',
        mealSlot: 'night',
        item: 'Evening Parcel Packs',
        quantityPortions: 10,
        unitPrice: 45,
        totalAmount: 450,
        paymentMode: 'Card',
        cashierName: 'Register 1 (Karthik)',
      },
    ];
    return finalizeTransactions(list);
  }

  // Restaurant
  const list: POSTransaction[] = [
    // Breakfast (morning)
    {
      id: `pos-${provider.id}-m1`,
      orderNumber: 'BILL-RES-101',
      timestamp: '07:45',
      mealSlot: 'morning',
      item: 'Morning Ghee Roast & Pongal Combos',
      quantityPortions: 28,
      unitPrice: 70,
      totalAmount: 1960,
      paymentMode: 'UPI',
      cashierName: 'Captain Ramesh',
    },
    {
      id: `pos-${provider.id}-m2`,
      orderNumber: 'BILL-RES-102',
      timestamp: '09:00',
      mealSlot: 'morning',
      item: 'Mini Breakfast Tiffin Thalis',
      quantityPortions: 22,
      unitPrice: 80,
      totalAmount: 1760,
      paymentMode: 'Card',
      cashierName: 'Captain Ramesh',
    },
    // Lunch (afternoon)
    {
      id: `pos-${provider.id}-a1`,
      orderNumber: 'BILL-RES-201',
      timestamp: '12:45',
      mealSlot: 'afternoon',
      item: 'Executive South Indian Lunch Meals',
      quantityPortions: 34,
      unitPrice: 120,
      totalAmount: 4080,
      paymentMode: 'UPI',
      cashierName: 'Counter Cashier',
    },
    {
      id: `pos-${provider.id}-a2`,
      orderNumber: 'BILL-RES-202',
      timestamp: '13:45',
      mealSlot: 'afternoon',
      item: 'Special Sambar Rice & Curd Rice Combos',
      quantityPortions: 20,
      unitPrice: 90,
      totalAmount: 1800,
      paymentMode: 'Cash',
      cashierName: 'Counter Cashier',
    },
    // Dinner (night)
    {
      id: `pos-${provider.id}-01`,
      orderNumber: 'BILL-RES-501',
      timestamp: '19:00',
      mealSlot: 'night',
      item: 'Mallipoo Idli & Crispy Medu Vada Thali',
      quantityPortions: 18,
      unitPrice: 60,
      totalAmount: 1080,
      paymentMode: 'UPI',
      cashierName: 'Captain Ramesh',
    },
    {
      id: `pos-${provider.id}-02`,
      orderNumber: 'BILL-RES-502',
      timestamp: '19:40',
      mealSlot: 'night',
      item: 'Special Ghee Masala Dosa Combos',
      quantityPortions: 16,
      unitPrice: 85,
      totalAmount: 1360,
      paymentMode: 'Card',
      cashierName: 'Captain Ramesh',
    },
    {
      id: `pos-${provider.id}-03`,
      orderNumber: 'BILL-RES-503',
      timestamp: '20:15',
      mealSlot: 'night',
      item: 'South Indian Dinner Meals & Parotta Sets',
      quantityPortions: 15,
      unitPrice: 110,
      totalAmount: 1650,
      paymentMode: 'UPI',
      cashierName: 'Counter Cashier',
    },
    {
      id: `pos-${provider.id}-04`,
      orderNumber: 'BILL-RES-504',
      timestamp: '20:50',
      mealSlot: 'night',
      item: 'Takeaway Tiffin Parcels (Online / Counter)',
      quantityPortions: 14,
      unitPrice: 75,
      totalAmount: 1050,
      paymentMode: 'Cash',
      cashierName: 'Counter Cashier',
    },
  ];
  return finalizeTransactions(list);
}

/**
 * Calculates sum of sold portions and total cash/UPI revenue from POS tickets,
 * optionally filtered by mealSlot.
 */
export function calculatePOSTotals(
  transactions: POSTransaction[],
  mealSlot?: MealSlot
): {
  totalPortions: number;
  totalAmount: number;
  ticketCount: number;
} {
  const filtered = mealSlot ? transactions.filter((t) => t.mealSlot === mealSlot) : transactions;
  const totalPortions = filtered.reduce((sum, t) => sum + t.quantityPortions, 0);
  const totalAmount = filtered.reduce((sum, t) => sum + t.totalAmount, 0);
  return {
    totalPortions,
    totalAmount,
    ticketCount: filtered.length,
  };
}

export interface HistoricalDonationRecord {
  id: string;
  dayLabel: string;
  dateStr: string;
  foodItem: string;
  portions: number;
  status: string;
  mealSlot: MealSlot;
}

const HISTORICAL_BASELINES_BY_MEAL: Record<MealSlot, Record<string, number[]>> = {
  morning: {
    'prov-m1': [14, 12, 16, 13, 11, 15, 13],
    'prov-m2': [12, 14, 13, 15, 10, 13, 12],
    'prov-b1': [10, 12, 11, 13, 9, 11, 11],
    'prov-b2': [8, 9, 11, 10, 7, 10, 8],
    'prov-r1': [12, 13, 11, 14, 12, 10, 12],
  },
  afternoon: {
    'prov-m1': [20, 18, 22, 19, 17, 21, 19],
    'prov-m2': [18, 20, 19, 21, 16, 19, 18],
    'prov-r1': [16, 17, 15, 18, 16, 14, 16],
    'prov-r2': [22, 24, 21, 25, 23, 22, 23],
  },
  night: {
    'prov-m1': [16, 14, 18, 15, 13, 17, 15],
    'prov-m2': [15, 16, 14, 18, 12, 16, 14],
    'prov-b1': [11, 13, 12, 14, 10, 12, 12],
    'prov-b2': [9, 10, 12, 11, 8, 11, 9],
    'prov-b3': [13, 15, 14, 12, 16, 14, 14],
    'prov-b4': [8, 10, 9, 11, 10, 8, 10],
    'prov-b5': [12, 14, 13, 11, 15, 12, 13],
    'prov-b6': [10, 11, 13, 12, 9, 10, 11],
    'prov-b7': [7, 8, 10, 9, 8, 9, 8],
    'prov-b8': [11, 12, 10, 13, 12, 11, 11],
    'prov-b9': [9, 11, 10, 12, 8, 10, 10],
    'prov-r1': [14, 15, 13, 16, 14, 12, 14],
    'prov-r2': [18, 20, 17, 21, 19, 18, 19],
    'prov-r3': [12, 14, 13, 15, 11, 14, 13],
    'prov-r4': [15, 17, 16, 14, 18, 15, 16],
  },
};

/**
 * Returns the last 7 recorded donations for a provider, filtered by mealSlot.
 */
export function getProviderLast7Donations(
  providerId: string,
  donationsOrName?: FoodDonation[] | string,
  providerTypeParam?: string,
  currentDonationsParam?: FoodDonation[],
  mealSlot: MealSlot = 'night'
): HistoricalDonationRecord[] {
  let currentDonations: FoodDonation[] = [];
  const providerType = providerTypeParam || 'bakery';

  if (Array.isArray(donationsOrName)) {
    currentDonations = donationsOrName;
  } else if (Array.isArray(currentDonationsParam)) {
    currentDonations = currentDonationsParam;
  }

  const realDonations = currentDonations.filter(
    (d) => d.providerId === providerId && (d.mealSlot === mealSlot || !d.mealSlot)
  );

  const baselineMap = HISTORICAL_BASELINES_BY_MEAL[mealSlot] || HISTORICAL_BASELINES_BY_MEAL.night;
  const defaultBaseline = mealSlot === 'morning' ? [10, 12, 11, 13, 9, 12, 11] : mealSlot === 'afternoon' ? [18, 20, 17, 21, 16, 19, 18] : [12, 14, 13, 15, 11, 14, 13];
  const baselinePortions = baselineMap[providerId] || defaultBaseline;
  const result: HistoricalDonationRecord[] = [];

  realDonations.forEach((d, idx) => {
    if (result.length < 7) {
      result.push({
        id: d.id,
        dayLabel: idx === 0 ? 'Today (Active)' : `Recent Run #${idx}`,
        dateStr: new Date(d.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        }),
        foodItem: d.foodItem,
        portions: d.confirmedPortions ?? d.portions,
        status: d.status,
        mealSlot: d.mealSlot || mealSlot,
      });
    }
  });

  let dayOffset = 1;
  let baselineIdx = 0;
  while (result.length < 7) {
    const historicalDate = new Date();
    historicalDate.setDate(historicalDate.getDate() - dayOffset);
    const dayLabel = dayOffset === 1 ? 'Yesterday' : `${dayOffset} days ago`;
    const portions = baselinePortions[baselineIdx % baselinePortions.length];
    
    let sampleFood = 'Meals Surplus';
    if (mealSlot === 'morning') {
      sampleFood = providerType === 'bakery' ? 'Morning Buns & Rusks' : providerType === 'hostel_mess' ? 'Hostel Idli & Pongal' : 'Morning Tiffin Packs';
    } else if (mealSlot === 'afternoon') {
      sampleFood = providerType === 'hostel_mess' ? 'Hostel Rice & Sambar Lunch' : 'Afternoon Meal Thalis';
    } else {
      sampleFood = providerType === 'bakery' ? 'Assorted Sweet Buns & Bread' : providerType === 'hostel_mess' ? 'Hostel Rice & Kootu Dinner' : 'Evening Tiffin & Meal Thalis';
    }

    result.push({
      id: `hist-${providerId}-${mealSlot}-${dayOffset}`,
      dayLabel,
      dateStr: historicalDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
      foodItem: sampleFood,
      portions,
      status: 'Distributed',
      mealSlot,
    });
    dayOffset++;
    baselineIdx++;
  }

  return result.slice(0, 7);
}

/**
 * Calculates rolling average surplus from historical records.
 */
export function calculateRollingAverageSurplus(
  donations: HistoricalDonationRecord[],
  _mealSlot?: MealSlot,
  _providerType?: string
): number {
  if (donations.length === 0) return 12;
  const portionsArr = donations.map((d) => d.portions);
  const sum = portionsArr.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / donations.length);
}
