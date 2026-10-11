export type ProviderType = 'bakery' | 'restaurant' | 'hostel_mess';

export type MealSlot = 'morning' | 'afternoon' | 'night';

export interface MealSlotWindow {
  start: string;
  end: string;
}

export type MealSlotWindows = Record<MealSlot, MealSlotWindow>;

export interface MealProductionLog {
  mealSlot: MealSlot;
  preparedQty: number;
  preparationTime: string;
  closingTime: string;
  savedAt?: string;
}

export interface ProviderDefaults {
  usualFoodItem: string;
  category: FoodCategory;
  storageType: StorageType;
  closingTime: string;
  usualPreparedQty: number;
  usualSoldQty: number;
  usualDiscardQty: number;
  preparationTime?: string;
  mealSlotWindows?: MealSlotWindows;
}

export type BillingStatus = 'not_connected' | 'connected' | 'error';

export interface BillingConnection {
  status: BillingStatus;
  connectorName?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
  autoFillSoldQty?: boolean;
  syncCount?: number;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  lat: number;
  lng: number;
  distanceKmFromNgo: number;
  closingTime: string;
  address: string;
  phone: string;
  contactPerson: string;
  defaults?: ProviderDefaults;
  isSkippedTonight?: boolean;
  skippedMealSlots?: Partial<Record<MealSlot, boolean>>;
  isApproved?: boolean;
  preparationTime?: string;
  preparedQty?: number;
  mealSlotWindows?: MealSlotWindows;
  mealProductions?: Partial<Record<MealSlot, MealProductionLog>>;
  billingConnection?: BillingConnection;
  lastProduction?: {
    mealSlot?: MealSlot;
    preparedQty: number;
    preparationTime: string;
    closingTime: string;
    savedAt?: string;
  };
}

export interface UserSession {
  userId: string;
  email: string;
  role: 'provider' | 'ngo';
  entityId: string;
  entityName: string;
  isApproved: boolean;
}

export interface StoredUser {
  id: string;
  email: string;
  password: string;
  role: 'provider' | 'ngo';
  entityId: string;
  name: string;
  isApproved: boolean;
}

export interface NGOVehicle {
  model: string;
  registrationNumber: string;
  capacityPortions: number; // 60 portions
  driverName: string;
  driverPhone: string;
}

export interface NGO {
  id: string;
  name: string;
  lat: number;
  lng: number;
  serviceRadiusKm: number; // default 5.0 km
  address: string;
  nightlyPeopleFed: number; // 80 people nightly
  vanCapacityPortions: number; // 60 portions
  contactPerson: string;
  phone: string;
  vehicle: NGOVehicle;
}

export type StorageType = 'room_temp' | 'refrigerated' | 'hot_held';

export type FoodCategory =
  | 'cooked_meal'
  | 'bakery_bread'
  | 'snacks_tiffin'
  | 'rice_curry'
  | 'sweets_dairy';

export type DonationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Confirmed'
  | 'Scheduled'
  | 'En route'
  | 'Arrived'
  | 'Collected'
  | 'Received'
  | 'Distributed'
  | 'Failed'
  | 'Cancelled'
  | 'Rejected'
  | 'Expired';

export interface FoodDonation {
  id: string;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  foodItem: string;
  category: FoodCategory;
  mealSlot?: MealSlot;
  // Donation owns all quantity fields:
  confirmedPortions: number;
  collectedPortions?: number;
  receivedPortions?: number;
  distributedPortions?: number;
  portions: number; // Keep for seamless backwards compatibility (synced with confirmedPortions)
  // Audit math fields
  preparedQty?: number;
  soldQty?: number;
  discardQty?: number;
  // Safety & logistics fields
  storageType: StorageType;
  preparedTime: string;
  collectionDeadline: string;
  deadlineTimestamp: number;
  preparedTimestamp?: number;
  dietary: 'veg' | 'non-veg';
  verificationOtp: string;
  status: DonationStatus;
  createdAt: string;
  notes?: string;
  // Public donation metadata
  source?: 'qr_form' | 'provider_app' | 'demo';
  verification?: 'unverified' | 'verified';
  ngoId?: string;
  contactPhone?: string;
  lat?: number;
  lng?: number;
  locationAccuracy?: number;
  locationLandmark?: string;
  // QR Inbox tracking
  calledAt?: string;
  isCalled?: boolean;
  rejectionReason?: string;
  // Logistics tracking
  scheduledCollectionId?: string;
  scheduledTripNumber?: number;
  driverName?: string;
  estimatedPickupTime?: string;
  failureReason?: string;
  collectedAt?: string;
  receivedAt?: string;
  distributedAt?: string;
  exclusionRecord?: ExcludedDonationRecord;
}

export type EventLogType =
  | 'Confirmed'
  | 'Accepted'
  | 'Scheduled'
  | 'Collected'
  | 'Received'
  | 'Distributed'
  | 'Failed'
  | 'Expired';

export interface EventLogEntry {
  id: string;
  time: string;
  type: EventLogType;
  donationId?: string;
  collectionId?: string;
  actor: string;
  message: string;
}

export type ExclusionReason =
  | 'CANNOT_REACH_IN_TIME'
  | 'DEADLINE_PASSED'
  | 'MISSING_SAFETY_INFO'
  | 'OUT_OF_RADIUS';

export interface ExcludedDonationRecord {
  donationId: string;
  providerName: string;
  portions: number;
  reason: ExclusionReason;
  reasonLabel: string;
  detail: string;
  mealSlot?: MealSlot;
  timestamp?: string;
}

export type TripDispatchStatus = 'DISPATCHABLE' | 'ON_HOLD';

export interface POSTransaction {
  id: string;
  orderNumber: string;
  timestamp: string;
  item: string;
  quantityPortions: number;
  unitPrice: number;
  totalAmount: number;
  paymentMode: 'UPI' | 'Card' | 'Mess Card' | 'Cash';
  cashierName?: string;
  mealSlot?: MealSlot;
}

export interface TripStop {
  stopOrder: number;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  address: string;
  lat: number;
  lng: number;
  donationId: string;
  foodItem: string;
  portions: number;
  collectionDeadline: string;
  deadlineTimestamp: number;
  verificationOtp: string;
  estimatedArrivalMinutesFromStart: number;
  isDeadlineMet: boolean;
  mealSlot?: MealSlot;
  arrivalAtNgoTimestamp?: number;
  arrivalAtNgoFormatted?: string;
  deadlineFormatted?: string;
  marginMinutes?: number;
}

export interface TripPlan {
  tripNumber: number;
  mealSlot: MealSlot;
  stops: TripStop[];
  totalPortions: number;
  capacityMax: number;
  distanceKm: number;
  durationMins: number;
  isEstimatedDistance: boolean;
  polylineCoordinates: [number, number][];
  separateTripsDistanceKm: number;
  distanceSavedKm: number;
  distanceSavedPercent: number;
  allDeadlinesMet: boolean;
  dispatchStatus: TripDispatchStatus;
  onHoldReason?: string;
  minViablePortions: number;
}

export interface CollectionPlan {
  id: string;
  createdAt: string;
  trips: TripPlan[];
  dispatchableTrips: TripPlan[];
  onHoldTrips: TripPlan[];
  excludedDonations: ExcludedDonationRecord[];
  totalPortions: number;
  totalDistanceKm: number;
  totalDistanceSavedKm: number;
  totalDistanceSavedPercent: number;
  totalDonorsCount: number;
  excludedCount: number;
}

export type StopProgressStatus = 'Pending' | 'En route' | 'Arrived' | 'Collected' | 'Failed';

export type CollectionStatus = 'Scheduled' | 'In Progress' | 'Queued' | 'Completed' | 'Partially Failed';

export interface DriverInfo {
  name: string;
  phone: string;
}

export interface CollectionRouteInfo {
  distanceKm: number;
  durationMins: number;
  polyline: [number, number][];
  isEstimatedDistance?: boolean;
  separateTripsDistanceKm?: number;
  distanceSavedKm?: number;
  distanceSavedPercent?: number;
}

export interface StopProgress {
  status: StopProgressStatus;
  estimatedArrivalMinutesFromStart?: number;
  estimatedArrivalTimeFormatted?: string;
  collectedAt?: string;
  failReason?: string;
}

export interface VehiclePosition {
  lat: number;
  lng: number;
  updatedAt: string;
  speedKmh: number;
  source: 'simulated' | 'device';
}

// Normalized single source of truth Collection:
// Stores only: id, tripNumber, driver, donationIds[] (ordered stops), route info, trip status,
// and stopProgress map keyed by donationId.
export interface Collection {
  id: string;
  tripNumber: number;
  mealSlot?: MealSlot;
  driver: DriverInfo;
  donationIds: string[]; // ordered stops
  route: CollectionRouteInfo;
  status: CollectionStatus;
  stopProgress: Record<string, StopProgress>; // keyed by donationId
  scheduledAt: string;
  completedAt?: string;
  distributionNotes?: string;
  queuedReason?: string;
  vehiclePosition?: VehiclePosition;
  routeProgress?: number; // 0 to 1
}

export interface MealImpactSummary {
  donated: number;
  collected: number;
  received: number;
  distributed: number;
  successfulCollectionsCount: number;
}

export interface ImpactMetrics {
  donated: number; // Confirmed portions
  collected: number; // Actual portions collected
  received: number; // Intake verified at NGO
  distributed: number; // Distributed as meals served
  successfulCollectionsCount: number;
  byMeal?: Record<MealSlot, MealImpactSummary>;
}

export interface InAppNotification {
  id: string;
  targetRole: 'provider' | 'ngo' | 'dispatcher' | 'all';
  targetProviderId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  relatedCollectionId?: string;
}

export type ActiveRole = 'provider' | 'ngo' | 'dispatcher';
