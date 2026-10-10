import { Provider, POSTransaction, FoodDonation } from '../types/surplusLink';

/**
 * Returns a realistic mock list of POS register transactions for tonight's sales.
 */
export function getMockPOSTransactions(provider: Provider): POSTransaction[] {
  const isHostel = provider.type === 'hostel_mess';
  const isBakery = provider.type === 'bakery';

  if (isHostel) {
    return [
      {
        id: `pos-${provider.id}-01`,
        orderNumber: 'POS-TK-801',
        timestamp: '19:15',
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
        item: 'Hostel Guest & Resident Tutor Meals',
        quantityPortions: 10,
        unitPrice: 60,
        totalAmount: 600,
        paymentMode: 'UPI',
        cashierName: 'Counter 1 (Mess Supt)',
      },
    ];
  }

  if (isBakery) {
    return [
      {
        id: `pos-${provider.id}-01`,
        orderNumber: 'INV-BK-2041',
        timestamp: '17:45',
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
        item: 'College Student Evening Parcel Packs',
        quantityPortions: 10,
        unitPrice: 45,
        totalAmount: 450,
        paymentMode: 'Card',
        cashierName: 'Register 1 (Karthik)',
      },
    ];
  }

  // Restaurant
  return [
    {
      id: `pos-${provider.id}-01`,
      orderNumber: 'BILL-RES-501',
      timestamp: '19:00',
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
      item: 'Takeaway Tiffin Parcels (Online / Counter)',
      quantityPortions: 14,
      unitPrice: 75,
      totalAmount: 1050,
      paymentMode: 'Cash',
      cashierName: 'Counter Cashier',
    },
  ];
}

/**
 * Calculates sum of sold portions and total cash/UPI revenue from POS tickets.
 */
export function calculatePOSTotals(transactions: POSTransaction[]): {
  totalPortions: number;
  totalAmount: number;
  ticketCount: number;
} {
  const totalPortions = transactions.reduce((sum, t) => sum + t.quantityPortions, 0);
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  return {
    totalPortions,
    totalAmount,
    ticketCount: transactions.length,
  };
}

export interface HistoricalDonationRecord {
  id: string;
  dayLabel: string;
  dateStr: string;
  foodItem: string;
  portions: number;
  status: string;
}

const HISTORICAL_BASELINES: Record<string, number[]> = {
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
};

/**
 * Returns the last 7 recorded donations for a provider.
 */
export function getProviderLast7Donations(
  providerId: string,
  donationsOrName?: FoodDonation[] | string,
  providerTypeParam?: string,
  currentDonationsParam?: FoodDonation[]
): HistoricalDonationRecord[] {
  let currentDonations: FoodDonation[] = [];
  let providerType = providerTypeParam || 'bakery';

  if (Array.isArray(donationsOrName)) {
    currentDonations = donationsOrName;
  } else if (Array.isArray(currentDonationsParam)) {
    currentDonations = currentDonationsParam;
  }

  const realDonations = currentDonations.filter((d) => d.providerId === providerId);
  const baselinePortions = HISTORICAL_BASELINES[providerId] || [12, 14, 13, 15, 11, 14, 13];
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
    const sampleFood =
      providerType === 'bakery'
        ? 'Assorted Sweet Buns & Bread'
        : providerType === 'hostel_mess'
        ? 'Hostel Rice & Sambar Surplus'
        : 'Evening Tiffin & Meal Thalis';
    result.push({
      id: `hist-${providerId}-${dayOffset}`,
      dayLabel,
      dateStr: historicalDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
      foodItem: sampleFood,
      portions,
      status: 'Distributed',
    });
    dayOffset++;
    baselineIdx++;
  }

  return result.slice(0, 7);
}

/**
 * Calculates rolling average surplus from historical records.
 */
export function calculateRollingAverageSurplus(donations: HistoricalDonationRecord[]): number {
  if (donations.length === 0) return 12;
  const portionsArr = donations.map((d) => d.portions);
  const sum = portionsArr.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / donations.length);
}
