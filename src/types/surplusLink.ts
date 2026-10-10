export type ProviderType = 'bakery' | 'restaurant' | 'hostel_mess';

export interface CollegeAnchor {
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  address: string;
}

export interface ProviderDefaults {
  usualFoodItem: string;
  category: FoodCategory;
  storageType: StorageType;
  closingTime: string;
  usualPreparedQty: number;
  usualSoldQty: number;
  usualDiscardQty: number;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  lat: number;
  lng: number;
  distanceKmFromCollege: number;
  closingTime: string;
  address: string;
  phone: string;
  contactPerson: string;
  defaults?: ProviderDefaults;
  isSkippedTonight?: boolean;
  isApproved?: boolean;
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
  distanceKmFromCollege: number; // 3.0 km away
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

// Simplified donation status: exactly 8 statuses
export type DonationStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Scheduled'
  | 'En route'
  | 'Arrived'
  | 'Collected'
  | 'Received'
  | 'Distributed'
  | 'Failed'
  | 'Cancelled';

export interface FoodDonation {
  id: string;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  foodItem: string;
  category: FoodCategory;
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
  dietary: 'veg' | 'non-veg';
  verificationOtp: string;
  status: DonationStatus;
  createdAt: string;
  notes?: string;
  // Logistics tracking
  scheduledCollectionId?: string;
  scheduledTripNumber?: number;
  driverName?: string;
  estimatedPickupTime?: string;
  failureReason?: string;
  receivedAt?: string;
  distributedAt?: string;
  exclusionRecord?: ExcludedDonationRecord;
}

export type ExclusionReason =
  | 'CANNOT_REACH_IN_TIME'
  | 'DEADLINE_PASSED'
  | 'MISSING_SAFETY_INFO';

export interface ExcludedDonationRecord {
  donationId: string;
  providerName: string;
  portions: number;
  reason: ExclusionReason;
  reasonLabel: string;
  detail: string;
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
  arrivalAtNgoTimestamp?: number;
  arrivalAtNgoFormatted?: string;
  deadlineFormatted?: string;
  marginMinutes?: number;
}

export interface TripPlan {
  tripNumber: number;
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

export type CollectionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Partially Failed';

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

// Normalized single source of truth Collection:
// Stores only: id, tripNumber, driver, donationIds[] (ordered stops), route info, trip status,
// and stopProgress map keyed by donationId.
export interface Collection {
  id: string;
  tripNumber: number;
  driver: DriverInfo;
  donationIds: string[]; // ordered stops
  route: CollectionRouteInfo;
  status: CollectionStatus;
  stopProgress: Record<string, StopProgress>; // keyed by donationId
  scheduledAt: string;
  completedAt?: string;
  distributionNotes?: string;
}

export interface ImpactMetrics {
  donated: number; // Confirmed portions
  collected: number; // Actual portions collected
  received: number; // Intake verified at NGO
  distributed: number; // Distributed as meals served
  successfulCollectionsCount: number;
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
