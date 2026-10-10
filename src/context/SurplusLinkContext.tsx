import React, { createContext, useContext, useReducer, useEffect, useState, useMemo } from 'react';
import {
  CollegeAnchor,
  Provider,
  ProviderDefaults,
  NGO,
  FoodDonation,
  DonationStatus,
  TripPlan,
  Collection,
  StopProgressStatus,
  InAppNotification,
  UserSession,
  StoredUser,
  ProviderType,
  ExcludedDonationRecord,
  CollectionPlan,
} from '../types/surplusLink';
import {
  COLLEGE_ANCHOR,
  SEED_PROVIDERS,
  SEED_NGO,
  SEED_INITIAL_DONATIONS,
  SEED_INITIAL_COLLECTIONS,
  INITIAL_USERS,
} from '../data/surplusLinkData';
import { SurplusLinkState } from '../selectors';
import {
  PlannerConfig,
  getSavedPlannerConfig,
  savePlannerConfig,
} from '../config/plannerConfig';
import { generateCollectionPlan } from '../utils/collectionPlanner';
import {
  createScenario1Donations,
  createScenario2Donations,
  createScenario3Donations,
} from '../utils/plannerRuleTests';

const STORAGE_KEY = 'surpluslink_madurai_state_v5';
const USERS_STORAGE_KEY = 'surpluslink_users_v2';
const SESSION_STORAGE_KEY = 'surpluslink_session_v2';

// Action Types
type Action =
  | {
      type: 'ADD_DONATION';
      payload: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'verificationOtp'>;
    }
  | {
      type: 'UPDATE_DONATION_STATUS';
      payload: { donationId: string; status: DonationStatus };
    }
  | {
      type: 'ACCEPT_AND_DISPATCH_TRIP';
      payload: {
        trip: TripPlan;
        driverName: string;
        remainingPlan?: CollectionPlan | null;
        collectionId?: string;
      };
    }
  | {
      type: 'CREATE_COLLECTION';
      payload: {
        trip: TripPlan;
        driverName: string;
        remainingPlan?: CollectionPlan | null;
        collectionId?: string;
      };
    }
  | {
      type: 'SET_COLLECTION_PLAN';
      payload: CollectionPlan | null;
    }
  | {
      type: 'SET_SELECTED_COLLECTION_ID';
      payload: string | null;
    }
  | {
      type: 'UPDATE_STOP_PROGRESS';
      payload: {
        collectionId: string;
        donationId: string;
        newStatus: StopProgressStatus;
        actualQty?: number;
        failReason?: string;
      };
    }
  | {
      type: 'RECORD_COLLECTION_RECEIVED';
      payload: { collectionId: string; quantityReceived: number };
    }
  | {
      type: 'RECORD_COLLECTION_DISTRIBUTED';
      payload: { collectionId: string; quantityDistributed: number; notes?: string };
    }
  | {
      type: 'LOAD_DEMO_DONATIONS';
    }
  | {
      type: 'DISMISS_NOTIFICATION';
      payload: { notificationId: string };
    }
  | {
      type: 'UPDATE_PROVIDER_DEFAULTS';
      payload: { providerId: string; defaults: Partial<ProviderDefaults> };
    }
  | {
      type: 'SKIP_TONIGHT_DONATION';
      payload: { providerId: string };
    }
  | {
      type: 'UNSKIP_TONIGHT_DONATION';
      payload: { providerId: string };
    }
  | {
      type: 'REGISTER_PROVIDER';
      payload: {
        provider: Provider;
      };
    }
  | {
      type: 'APPROVE_PROVIDER';
      payload: {
        providerId: string;
      };
    }
  | {
      type: 'REGISTER_NGO';
      payload: {
        ngo: NGO;
      };
    }
  | {
      type: 'LOAD_SCENARIO';
      payload: { scenarioNumber: 1 | 2 | 3 };
    }
  | {
      type: 'RECORD_EXCLUSIONS';
      payload: {
        excludedRecords: ExcludedDonationRecord[];
      };
    }
  | {
      type: 'RESET_DEMO_DATA';
    };

const initialDefaultState: SurplusLinkState = {
  providers: SEED_PROVIDERS,
  ngo: SEED_NGO,
  donations: SEED_INITIAL_DONATIONS,
  collections: SEED_INITIAL_COLLECTIONS,
  notifications: [
    {
      id: 'welcome-init',
      targetRole: 'all',
      title: 'Madurai Redistribution Network Ready',
      message: '15 hyper-local food providers and Annam Seva Trust initialized.',
      type: 'info',
      timestamp: '21:00',
    },
  ],
};

function loadInitialState(): SurplusLinkState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDefaultState;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.donations) &&
      Array.isArray(parsed.collections) &&
      Array.isArray(parsed.providers) &&
      parsed.ngo
    ) {
      return {
        providers: parsed.providers || SEED_PROVIDERS,
        ngo: parsed.ngo || SEED_NGO,
        donations: parsed.donations,
        collections: parsed.collections,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      };
    }
    return initialDefaultState;
  } catch (err) {
    console.warn('Failed to load SurplusLink state from localStorage, using seed data:', err);
    return initialDefaultState;
  }
}

function loadInitialUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return INITIAL_USERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback
  }
  return INITIAL_USERS;
}

function loadInitialSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.userId && parsed.role) return parsed;
  } catch {
    // fallback
  }
  return null;
}

function surplusLinkReducer(state: SurplusLinkState, action: Action): SurplusLinkState {
  switch (action.type) {
    case 'ADD_DONATION': {
      const confirmed = action.payload.confirmedPortions ?? action.payload.portions ?? 0;
      const newDonation: FoodDonation = {
        ...action.payload,
        id: `don-${Date.now()}`,
        confirmedPortions: confirmed,
        portions: confirmed,
        verificationOtp: String(Math.floor(1000 + Math.random() * 9000)),
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
      };
      const notif: InAppNotification = {
        id: `notif-${Date.now()}`,
        targetRole: 'all',
        targetProviderId: action.payload.providerId,
        title: `New Surplus Available: ${action.payload.providerName}`,
        message: `${confirmed} portions of "${action.payload.foodItem}" logged. Ready for batch routing.`,
        type: 'success',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return {
        ...state,
        donations: [newDonation, ...state.donations],
        notifications: [notif, ...state.notifications],
      };
    }

    case 'UPDATE_DONATION_STATUS': {
      return {
        ...state,
        donations: state.donations.map((d) =>
          d.id === action.payload.donationId ? { ...d, status: action.payload.status } : d
        ),
      };
    }

    case 'CREATE_COLLECTION': {
      const { trip, driverName } = action.payload;
      const collectionId = `coll-${Date.now()}`;
      const now = new Date();
      const stopProgress: Collection['stopProgress'] = {};
      const newNotifications: InAppNotification[] = [];

      trip.stops.forEach((s) => {
        const arrivalDate = new Date(now.getTime() + s.estimatedArrivalMinutesFromStart * 60 * 1000);
        const arrivalHours = String(arrivalDate.getHours()).padStart(2, '0');
        const arrivalMins = String(arrivalDate.getMinutes()).padStart(2, '0');
        const arrivalTimeFormatted = `${arrivalHours}:${arrivalMins}`;

        stopProgress[s.donationId] = {
          status: 'Pending',
          estimatedArrivalMinutesFromStart: s.estimatedArrivalMinutesFromStart,
          estimatedArrivalTimeFormatted: arrivalTimeFormatted,
        };

        newNotifications.push({
          id: `notif-${Date.now()}-${s.providerId}`,
          targetRole: 'provider',
          targetProviderId: s.providerId,
          title: 'Van Pickup Scheduled!',
          message: `${driverName.trim() || state.ngo.vehicle.driverName} is scheduled to pick up "${s.foodItem}" (${s.portions} portions) at approx ${arrivalTimeFormatted}.`,
          type: 'info',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          relatedCollectionId: collectionId,
        });
      });

      const newCollection: Collection = {
        id: collectionId,
        tripNumber: trip.tripNumber,
        driver: {
          name: driverName.trim() || state.ngo.vehicle.driverName,
          phone: state.ngo.vehicle.driverPhone,
        },
        donationIds: trip.stops.map((s) => s.donationId),
        route: {
          distanceKm: trip.distanceKm,
          durationMins: trip.durationMins,
          polyline: trip.polylineCoordinates,
          isEstimatedDistance: trip.isEstimatedDistance,
          separateTripsDistanceKm: trip.separateTripsDistanceKm,
          distanceSavedKm: trip.distanceSavedKm,
          distanceSavedPercent: trip.distanceSavedPercent,
        },
        status: 'Scheduled',
        stopProgress,
        scheduledAt: new Date().toISOString(),
      };

      newNotifications.unshift({
        id: `notif-${Date.now()}-ngo`,
        targetRole: 'ngo',
        title: `Trip ${trip.tripNumber} Collection Scheduled`,
        message: `${newCollection.driver.name} assigned to collect ${trip.totalPortions} portions across ${trip.stops.length} stops.`,
        type: 'success',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relatedCollectionId: collectionId,
      });

      const updatedDonations = state.donations.map((d) => {
        if (stopProgress[d.id]) {
          return {
            ...d,
            status: 'Scheduled' as DonationStatus,
            scheduledCollectionId: collectionId,
            scheduledTripNumber: trip.tripNumber,
            driverName: newCollection.driver.name,
            estimatedPickupTime: stopProgress[d.id].estimatedArrivalTimeFormatted,
          };
        }
        return d;
      });

      return {
        ...state,
        collections: [newCollection, ...state.collections],
        donations: updatedDonations,
        notifications: [...newNotifications, ...state.notifications],
      };
    }

    case 'UPDATE_STOP_PROGRESS': {
      const { collectionId, donationId, newStatus, actualQty, failReason } = action.payload;
      const targetCollection = state.collections.find((c) => c.id === collectionId);
      if (!targetCollection) return state;

      const targetDonation = state.donations.find((d) => d.id === donationId);
      const confirmedQty = targetDonation ? (targetDonation.confirmedPortions ?? targetDonation.portions) : 0;
      const actual = actualQty ?? confirmedQty;
      const discrepancy = actual - confirmedQty;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const existingProgress = targetCollection.stopProgress[donationId] || { status: 'Pending' };
      const updatedProgress = {
        ...existingProgress,
        status: newStatus,
        collectedAt: newStatus === 'Collected' ? new Date().toISOString() : existingProgress.collectedAt,
        failReason: newStatus === 'Failed' ? failReason || 'Unable to collect surplus' : existingProgress.failReason,
      };

      const newStopProgress = {
        ...targetCollection.stopProgress,
        [donationId]: updatedProgress,
      };

      const stopStatuses = targetCollection.donationIds.map((id) => newStopProgress[id]?.status || 'Pending');
      const allCollected = stopStatuses.every((s) => s === 'Collected');
      const anyFailed = stopStatuses.some((s) => s === 'Failed');
      const anyInProgress = stopStatuses.some((s) => s === 'En route' || s === 'Arrived');

      let colStatus: Collection['status'] = 'In Progress';
      if (allCollected) colStatus = 'Completed';
      else if (anyFailed && !anyInProgress) colStatus = 'Partially Failed';

      const updatedCollections = state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        return {
          ...c,
          status: colStatus,
          stopProgress: newStopProgress,
          completedAt: colStatus === 'Completed' ? new Date().toISOString() : c.completedAt,
        };
      });

      const updatedDonations = state.donations.map((d) => {
        if (d.id !== donationId) return d;
        if (newStatus === 'Collected') {
          return {
            ...d,
            status: 'Collected' as DonationStatus,
            collectedPortions: actual,
          };
        }
        if (newStatus === 'Failed') {
          return {
            ...d,
            status: 'Failed' as DonationStatus,
            failureReason: failReason || 'Collection failed',
          };
        }
        return {
          ...d,
          status: newStatus as DonationStatus,
        };
      });

      const newNotifications: InAppNotification[] = [];
      const foodItemName = targetDonation?.foodItem || 'Surplus Item';
      const providerId = targetDonation?.providerId;

      if (newStatus === 'Collected' && discrepancy !== 0) {
        newNotifications.push({
          id: `notif-${Date.now()}-discrepancy`,
          targetRole: 'all',
          targetProviderId: providerId,
          title: `Quantity Discrepancy Noted (${discrepancy > 0 ? `+${discrepancy}` : discrepancy} Portions)`,
          message: `At stop "${foodItemName}": Confirmed ${confirmedQty} portions, but driver recorded ${actual} actual portions.`,
          type: 'warning',
          timestamp: timeStr,
          relatedCollectionId: collectionId,
        });
      }

      if (newStatus === 'Failed') {
        newNotifications.push(
          {
            id: `notif-${Date.now()}-failed-prov`,
            targetRole: 'provider',
            targetProviderId: providerId,
            title: `Pickup Failed: ${foodItemName}`,
            message: `The driver was unable to collect this surplus. Reason: "${failReason || 'Unknown'}". Your surplus has been unassigned and is eligible for replanning.`,
            type: 'error',
            timestamp: timeStr,
            relatedCollectionId: collectionId,
          },
          {
            id: `notif-${Date.now()}-failed-ngo`,
            targetRole: 'ngo',
            title: `Pickup Failed: ${foodItemName}`,
            message: `Pickup failed (${failReason}). ${confirmedQty} portions capacity freed up in van. Remaining route stops continue as scheduled.`,
            type: 'warning',
            timestamp: timeStr,
            relatedCollectionId: collectionId,
          }
        );
      }

      return {
        ...state,
        collections: updatedCollections,
        donations: updatedDonations,
        notifications: [...newNotifications, ...state.notifications],
      };
    }

    case 'RECORD_COLLECTION_RECEIVED': {
      const { collectionId, quantityReceived } = action.payload;
      const targetColl = state.collections.find((c) => c.id === collectionId);
      if (!targetColl) return state;

      const nowIso = new Date().toISOString();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const collectedDonations = state.donations.filter(
        (d) => targetColl.donationIds.includes(d.id) && (d.status === 'Collected' || d.status === 'Received' || d.status === 'Distributed')
      );
      const totalCollected = collectedDonations.reduce((sum, d) => sum + (d.collectedPortions || d.confirmedPortions || 0), 0) || 1;

      const updatedDonations = state.donations.map((d) => {
        if (!targetColl.donationIds.includes(d.id)) return d;
        if (d.status !== 'Collected' && d.status !== 'Received' && d.status !== 'Distributed') return d;
        const stopCollected = d.collectedPortions || d.confirmedPortions || 0;
        const stopReceived = Math.round(((stopCollected / totalCollected) * quantityReceived) * 10) / 10;
        return {
          ...d,
          status: (d.status === 'Distributed' ? 'Distributed' : 'Received') as DonationStatus,
          receivedPortions: stopReceived,
          receivedAt: nowIso,
        };
      });

      const notif: InAppNotification = {
        id: `notif-${Date.now()}-intake-ngo`,
        targetRole: 'ngo',
        title: `Intake Verified: ${quantityReceived} Portions Received`,
        message: `Trip food intake logged at NGO hub. Ready for evening meal distribution.`,
        type: 'success',
        timestamp: timeStr,
        relatedCollectionId: collectionId,
      };

      return {
        ...state,
        donations: updatedDonations,
        notifications: [notif, ...state.notifications],
      };
    }

    case 'RECORD_COLLECTION_DISTRIBUTED': {
      const { collectionId, quantityDistributed, notes } = action.payload;
      const targetColl = state.collections.find((c) => c.id === collectionId);
      if (!targetColl) return state;

      const nowIso = new Date().toISOString();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const collectedDonations = state.donations.filter(
        (d) => targetColl.donationIds.includes(d.id) && (d.status === 'Collected' || d.status === 'Received' || d.status === 'Distributed')
      );
      const totalCollected = collectedDonations.reduce((sum, d) => sum + (d.collectedPortions || d.confirmedPortions || 0), 0) || 1;

      const providerNotifs: InAppNotification[] = [];
      const updatedDonations = state.donations.map((d) => {
        if (!targetColl.donationIds.includes(d.id)) return d;
        if (d.status !== 'Collected' && d.status !== 'Received' && d.status !== 'Distributed') return d;
        const stopCollected = d.collectedPortions || d.confirmedPortions || 0;
        const stopDistributed = Math.round(((stopCollected / totalCollected) * quantityDistributed) * 10) / 10;
        providerNotifs.push({
          id: `notif-${Date.now()}-${d.providerId}-distrib`,
          targetRole: 'provider',
          targetProviderId: d.providerId,
          title: 'Verified Impact: Meals Distributed!',
          message: `Your donation helped provide ${stopDistributed} meals today.`,
          type: 'success',
          timestamp: timeStr,
          relatedCollectionId: collectionId,
        });
        return {
          ...d,
          status: 'Distributed' as DonationStatus,
          distributedPortions: stopDistributed,
          distributedAt: nowIso,
        };
      });

      const updatedCollections = state.collections.map((c) => {
        if (c.id !== collectionId) return c;
        return {
          ...c,
          distributionNotes: notes,
        };
      });

      const ngoNotif: InAppNotification = {
        id: `notif-${Date.now()}-distrib-ngo`,
        targetRole: 'ngo',
        title: `Distribution Recorded: ${quantityDistributed} Meals Served`,
        message: `Evening feeding complete! Beneficiaries fed tonight. Only distributed portions are tallied as meals served.`,
        type: 'success',
        timestamp: timeStr,
        relatedCollectionId: collectionId,
      };

      return {
        ...state,
        collections: updatedCollections,
        donations: updatedDonations,
        notifications: [ngoNotif, ...providerNotifs, ...state.notifications],
      };
    }

    case 'LOAD_DEMO_DONATIONS': {
      const now = Date.now();
      const demoItems: FoodDonation[] = [
        {
          id: `demo-${now}-1`,
          providerId: 'prov-b3',
          providerName: 'Annapoorna Bread & Biscuit Stall',
          providerType: 'bakery',
          foodItem: 'Fresh Coconut Buns & Milk Rusks',
          category: 'bakery_bread',
          confirmedPortions: 8,
          portions: 8,
          preparedQty: 40,
          soldQty: 31,
          discardQty: 1,
          storageType: 'room_temp',
          preparedTime: '18:30',
          collectionDeadline: '23:59',
          deadlineTimestamp: now + 180 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '3318',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Packed in clean bread crates ready for quick loading.',
        },
        {
          id: `demo-${now}-2`,
          providerId: 'prov-b1',
          providerName: 'Sri Krishna Bakes & Confectionery',
          providerType: 'bakery',
          foodItem: 'Sandwich Bread Loaves & Vegetable Puffs',
          category: 'bakery_bread',
          confirmedPortions: 12,
          portions: 12,
          preparedQty: 55,
          soldQty: 41,
          discardQty: 2,
          storageType: 'room_temp',
          preparedTime: '18:00',
          collectionDeadline: '23:45',
          deadlineTimestamp: now + 160 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '5092',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Sealed food-grade paper bags.',
        },
        {
          id: `demo-${now}-3`,
          providerId: 'prov-m1',
          providerName: 'Kaveri Boys Hostel Dining Mess',
          providerType: 'hostel_mess',
          foodItem: 'Steamed Ponni Rice, Sambar & Poriyal',
          category: 'rice_curry',
          confirmedPortions: 15,
          portions: 15,
          preparedQty: 95,
          soldQty: 77,
          discardQty: 3,
          storageType: 'hot_held',
          preparedTime: '20:15',
          collectionDeadline: '22:45',
          deadlineTimestamp: now + 90 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '8214',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Hot food kept in insulated thermal vessels at >65°C.',
        },
        {
          id: `demo-${now}-4`,
          providerId: 'prov-r1',
          providerName: 'Murugan Idli Shop - College Road',
          providerType: 'restaurant',
          foodItem: 'Mallipoo Idlis, Medu Vada & Chutneys',
          category: 'snacks_tiffin',
          confirmedPortions: 20,
          portions: 20,
          preparedQty: 100,
          soldQty: 76,
          discardQty: 4,
          storageType: 'hot_held',
          preparedTime: '20:30',
          collectionDeadline: '23:00',
          deadlineTimestamp: now + 105 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '7412',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Packed in thermal takeaway foil containers.',
        },
        {
          id: `demo-${now}-5`,
          providerId: 'prov-r4',
          providerName: 'Sree Sabarees Pure Vegetarian Bistro',
          providerType: 'restaurant',
          foodItem: 'Ghee Pongal, Kesari & Coconut Chutney',
          category: 'cooked_meal',
          confirmedPortions: 10,
          portions: 10,
          preparedQty: 60,
          soldQty: 48,
          discardQty: 2,
          storageType: 'hot_held',
          preparedTime: '20:45',
          collectionDeadline: '23:15',
          deadlineTimestamp: now + 120 * 60 * 1000,
          dietary: 'veg',
          verificationOtp: '9160',
          status: 'Confirmed',
          createdAt: new Date().toISOString(),
          notes: 'Hot-held in insulated soup warmers.',
        },
      ];
      return {
        ...state,
        donations: demoItems,
      };
    }

    case 'DISMISS_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload.notificationId),
      };
    }

    case 'UPDATE_PROVIDER_DEFAULTS': {
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.payload.providerId
            ? {
                ...p,
                defaults: {
                  ...(p.defaults as ProviderDefaults),
                  ...action.payload.defaults,
                },
              }
            : p
        ),
      };
    }

    case 'SKIP_TONIGHT_DONATION': {
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.payload.providerId ? { ...p, isSkippedTonight: true } : p
        ),
        notifications: [
          {
            id: `notif-${Date.now()}`,
            targetRole: 'provider',
            targetProviderId: action.payload.providerId,
            title: 'No Surplus Tonight Logged',
            message: 'Recorded zero surplus for tonight. Dispatchers and drivers updated.',
            type: 'info',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...state.notifications,
        ],
      };
    }

    case 'UNSKIP_TONIGHT_DONATION': {
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.payload.providerId ? { ...p, isSkippedTonight: false } : p
        ),
      };
    }

    case 'REGISTER_PROVIDER': {
      return {
        ...state,
        providers: [action.payload.provider, ...state.providers],
        notifications: [
          {
            id: `notif-reg-${Date.now()}`,
            targetRole: 'all',
            title: `New Business Registered: ${action.payload.provider.name}`,
            message: `Registered as ${action.payload.provider.type.replace('_', ' ')}. Status: Pending Admin Approval.`,
            type: 'info',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...state.notifications,
        ],
      };
    }

    case 'APPROVE_PROVIDER': {
      return {
        ...state,
        providers: state.providers.map((p) =>
          p.id === action.payload.providerId ? { ...p, isApproved: true } : p
        ),
        notifications: [
          {
            id: `notif-appr-${Date.now()}`,
            targetRole: 'provider',
            targetProviderId: action.payload.providerId,
            title: 'Account Approved!',
            message: 'Your business has been verified. You can now confirm and publish nightly food surplus.',
            type: 'success',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...state.notifications,
        ],
      };
    }

    case 'REGISTER_NGO': {
      return {
        ...state,
        ngo: action.payload.ngo,
      };
    }

    case 'LOAD_SCENARIO': {
      const { scenarioNumber } = action.payload;
      let scenarioItems: FoodDonation[] = [];
      if (scenarioNumber === 1) {
        scenarioItems = createScenario1Donations(state.providers);
      } else if (scenarioNumber === 2) {
        scenarioItems = createScenario2Donations(state.providers);
      } else {
        scenarioItems = createScenario3Donations(state.providers);
      }

      const otherDonations = state.donations.filter((d) => d.status !== 'Confirmed');
      return {
        ...state,
        donations: [...scenarioItems, ...otherDonations],
      };
    }

    case 'RECORD_EXCLUSIONS': {
      const recordsMap = new Map(action.payload.excludedRecords.map((r) => [r.donationId, r]));
      return {
        ...state,
        donations: state.donations.map((d) => {
          const rec = recordsMap.get(d.id);
          if (rec) {
            return {
              ...d,
              exclusionRecord: rec,
            };
          }
          return d;
        }),
      };
    }

    case 'RESET_DEMO_DATA': {
      return initialDefaultState;
    }

    default:
      return state;
  }
}

export interface RegisterProviderInput {
  name: string;
  type: ProviderType;
  address: string;
  phone: string;
  closingTime: string;
  email: string;
  password: string;
}

export interface RegisterNgoInput {
  name: string;
  address: string;
  vanCapacity: number;
  nightlyPeopleFed: number;
  contactPerson: string;
  phone: string;
  email: string;
  password: string;
}

interface SurplusLinkContextType {
  state: SurplusLinkState;
  // Auth state
  session: UserSession | null;
  users: StoredUser[];
  login: (email: string, password: string, requiredRole: 'provider' | 'ngo') => { success: boolean; error?: string };
  registerProvider: (data: RegisterProviderInput) => { success: boolean; error?: string };
  registerNgo: (data: RegisterNgoInput) => { success: boolean; error?: string };
  logout: () => void;
  approveProvider: (providerId: string) => void;
  switchDemoAccount: (email: string) => void;
  
  // Scoped active provider
  selectedProvider: Provider;
  setSelectedProviderId: (id: string) => void;
  
  college: CollegeAnchor;
  providers: Provider[];
  ngo: NGO;
  donations: FoodDonation[];
  collections: Collection[];
  notifications: InAppNotification[];
  
  // Mutator Actions
  addDonation: (
    donation: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'verificationOtp'>
  ) => void;
  updateDonationStatus: (donationId: string, status: DonationStatus) => void;
  acceptTripCollection: (trip: TripPlan, driverName: string) => void;
  updateStopProgress: (
    collectionId: string,
    donationId: string,
    newStatus: StopProgressStatus,
    actualQty?: number,
    failReason?: string
  ) => void;
  recordCollectionReceived: (collectionId: string, quantityReceived: number) => void;
  recordCollectionDistributed: (
    collectionId: string,
    quantityDistributed: number,
    notes?: string
  ) => void;
  loadDemoDonationsBatch: () => void;
  dismissNotification: (notificationId: string) => void;
  updateProviderDefaults: (providerId: string, defaults: Partial<ProviderDefaults>) => void;
  skipTonightDonation: (providerId: string) => void;
  unskipTonightDonation: (providerId: string) => void;
  loadScenario: (scenarioNumber: 1 | 2 | 3) => void;
  plannerConfig: PlannerConfig;
  updatePlannerConfig: (config: Partial<PlannerConfig>) => void;
  recordExcludedDonations: (excludedRecords: ExcludedDonationRecord[]) => void;
  resetAllData: () => void;
}

const SurplusLinkContext = createContext<SurplusLinkContextType | undefined>(undefined);

export const SurplusLinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(surplusLinkReducer, undefined, loadInitialState);
  const [users, setUsers] = useState<StoredUser[]>(loadInitialUsers);
  const [session, setSession] = useState<UserSession | null>(loadInitialSession);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [state]);

  // Persist users
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Users storage error:', e);
    }
  }, [users]);

  // Persist session
  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Session storage error:', e);
    }
  }, [session]);

  // Keep session's isApproved in sync with state.providers
  useEffect(() => {
    if (session && session.role === 'provider') {
      const p = state.providers.find((prov) => prov.id === session.entityId);
      if (p && p.isApproved !== session.isApproved) {
        setSession((prev) => prev ? { ...prev, isApproved: Boolean(p.isApproved) } : null);
      }
    }
  }, [state.providers, session]);

  // Derive active provider: locked to session if logged in as provider, else default
  const [overrideProviderId, setOverrideProviderId] = useState<string | null>(null);
  const selectedProvider = useMemo(() => {
    if (overrideProviderId) {
      const found = state.providers.find((p) => p.id === overrideProviderId);
      if (found) return found;
    }
    if (session && session.role === 'provider') {
      const found = state.providers.find((p) => p.id === session.entityId);
      if (found) return found;
    }
    return state.providers[0];
  }, [overrideProviderId, session, state.providers]);

  const setSelectedProviderId = (id: string) => {
    setOverrideProviderId(id);
  };

  // Login handler with strict role checks
  const login = (email: string, password: string, requiredRole: 'provider' | 'ngo') => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Strict role validation
    if (user.role !== requiredRole) {
      if (user.role === 'provider') {
        return {
          success: false,
          error: 'This account is registered as a Food Provider. Please use the provider login.',
        };
      } else {
        return {
          success: false,
          error: 'This account is registered as an NGO. Please use the NGO login.',
        };
      }
    }

    // Find entity approval status
    let isApproved = user.isApproved;
    if (user.role === 'provider') {
      const prov = state.providers.find((p) => p.id === user.entityId);
      if (prov) isApproved = Boolean(prov.isApproved);
    }

    const newSession: UserSession = {
      userId: user.id,
      email: user.email,
      role: user.role,
      entityId: user.entityId,
      entityName: user.name,
      isApproved,
    };

    setSession(newSession);
    return { success: true };
  };

  // Register new provider
  const registerProvider = (data: RegisterProviderInput) => {
    const trimmedEmail = data.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newProviderId = `prov-${Date.now()}`;
    const newProvider: Provider = {
      id: newProviderId,
      name: data.name.trim(),
      type: data.type,
      lat: Number((9.9252 + (Math.random() - 0.5) * 0.01).toFixed(4)),
      lng: Number((78.1198 + (Math.random() - 0.5) * 0.01).toFixed(4)),
      distanceKmFromCollege: 0.65,
      closingTime: data.closingTime || '21:30',
      address: data.address.trim(),
      phone: data.phone.trim(),
      contactPerson: data.name.trim() + ' Manager',
      isApproved: false, // New providers require approval!
      defaults: {
        usualFoodItem: data.type === 'bakery' ? 'Assorted Bread & Veg Puffs' : 'Dinner Meals & Rice',
        category: data.type === 'bakery' ? 'bakery_bread' : 'cooked_meal',
        storageType: data.type === 'bakery' ? 'room_temp' : 'hot_held',
        closingTime: data.closingTime || '21:30',
        usualPreparedQty: 80,
        usualSoldQty: 50,
        usualDiscardQty: 2,
      },
    };

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      email: trimmedEmail,
      password: data.password,
      role: 'provider',
      entityId: newProviderId,
      name: data.name.trim(),
      isApproved: false,
    };

    dispatch({ type: 'REGISTER_PROVIDER', payload: { provider: newProvider } });
    setUsers((prev) => [...prev, newUser]);

    // Create session
    const newSession: UserSession = {
      userId: newUser.id,
      email: newUser.email,
      role: 'provider',
      entityId: newProviderId,
      entityName: newProvider.name,
      isApproved: false,
    };
    setSession(newSession);

    return { success: true };
  };

  // Register new NGO
  const registerNgo = (data: RegisterNgoInput) => {
    const trimmedEmail = data.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const ngoId = `ngo-${Date.now()}`;
    const newNgo: NGO = {
      id: ngoId,
      name: data.name.trim(),
      lat: 9.9482,
      lng: 78.1365,
      distanceKmFromCollege: 3.0,
      address: data.address.trim(),
      nightlyPeopleFed: data.nightlyPeopleFed || 80,
      vanCapacityPortions: data.vanCapacity || 60,
      contactPerson: data.contactPerson.trim(),
      phone: data.phone.trim(),
      vehicle: {
        model: 'Electric Cargo Van TN 58',
        registrationNumber: 'TN 58 AY 9911',
        capacityPortions: data.vanCapacity || 60,
        driverName: 'Ravi Kumar',
        driverPhone: data.phone.trim(),
      },
    };

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      email: trimmedEmail,
      password: data.password,
      role: 'ngo',
      entityId: ngoId,
      name: data.name.trim(),
      isApproved: true,
    };

    dispatch({ type: 'REGISTER_NGO', payload: { ngo: newNgo } });
    setUsers((prev) => [...prev, newUser]);

    const newSession: UserSession = {
      userId: newUser.id,
      email: newUser.email,
      role: 'ngo',
      entityId: ngoId,
      entityName: newNgo.name,
      isApproved: true,
    };
    setSession(newSession);

    return { success: true };
  };

  const logout = () => {
    setSession(null);
  };

  const approveProvider = (providerId: string) => {
    dispatch({ type: 'APPROVE_PROVIDER', payload: { providerId } });
    setUsers((prev) =>
      prev.map((u) => (u.entityId === providerId ? { ...u, isApproved: true } : u))
    );
    if (session && session.entityId === providerId) {
      setSession((prev) => (prev ? { ...prev, isApproved: true } : null));
    }
  };

  const switchDemoAccount = (email: string) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      let isApproved = user.isApproved;
      if (user.role === 'provider') {
        const prov = state.providers.find((p) => p.id === user.entityId);
        if (prov) isApproved = Boolean(prov.isApproved);
      }
      setSession({
        userId: user.id,
        email: user.email,
        role: user.role,
        entityId: user.entityId,
        entityName: user.name,
        isApproved,
      });
    }
  };

  const addDonation = (
    donation: Omit<FoodDonation, 'id' | 'createdAt' | 'status' | 'verificationOtp'>
  ) => {
    dispatch({ type: 'ADD_DONATION', payload: donation });
  };

  const updateDonationStatus = (donationId: string, status: DonationStatus) => {
    dispatch({ type: 'UPDATE_DONATION_STATUS', payload: { donationId, status } });
  };

  const acceptTripCollection = (trip: TripPlan, driverName: string) => {
    dispatch({ type: 'CREATE_COLLECTION', payload: { trip, driverName } });
  };

  const updateStopProgress = (
    collectionId: string,
    donationId: string,
    newStatus: StopProgressStatus,
    actualQty?: number,
    failReason?: string
  ) => {
    dispatch({
      type: 'UPDATE_STOP_PROGRESS',
      payload: { collectionId, donationId, newStatus, actualQty, failReason },
    });
  };

  const recordCollectionReceived = (collectionId: string, quantityReceived: number) => {
    dispatch({
      type: 'RECORD_COLLECTION_RECEIVED',
      payload: { collectionId, quantityReceived },
    });
  };

  const recordCollectionDistributed = (
    collectionId: string,
    quantityDistributed: number,
    notes?: string
  ) => {
    dispatch({
      type: 'RECORD_COLLECTION_DISTRIBUTED',
      payload: { collectionId, quantityDistributed, notes },
    });
  };

  const loadDemoDonationsBatch = () => {
    dispatch({ type: 'LOAD_DEMO_DONATIONS' });
  };

  const dismissNotification = (notificationId: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: { notificationId } });
  };

  const updateProviderDefaults = (
    providerId: string,
    defaults: Partial<ProviderDefaults>
  ) => {
    dispatch({ type: 'UPDATE_PROVIDER_DEFAULTS', payload: { providerId, defaults } });
  };

  const skipTonightDonation = (providerId: string) => {
    dispatch({ type: 'SKIP_TONIGHT_DONATION', payload: { providerId } });
  };

  const unskipTonightDonation = (providerId: string) => {
    dispatch({ type: 'UNSKIP_TONIGHT_DONATION', payload: { providerId } });
  };

  const [plannerConfig, setPlannerConfig] = useState<PlannerConfig>(getSavedPlannerConfig);

  const updatePlannerConfig = (cfg: Partial<PlannerConfig>) => {
    const updated = savePlannerConfig(cfg);
    setPlannerConfig(updated);
  };

  const loadScenario = (scenarioNumber: 1 | 2 | 3) => {
    dispatch({ type: 'LOAD_SCENARIO', payload: { scenarioNumber } });
  };

  const recordExcludedDonations = (excludedRecords: ExcludedDonationRecord[]) => {
    dispatch({ type: 'RECORD_EXCLUSIONS', payload: { excludedRecords } });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    dispatch({ type: 'RESET_DEMO_DATA' });
    setUsers(INITIAL_USERS);
    // Switch to bakery demo by default
    const defaultUser = INITIAL_USERS[0];
    setSession({
      userId: defaultUser.id,
      email: defaultUser.email,
      role: defaultUser.role,
      entityId: defaultUser.entityId,
      entityName: defaultUser.name,
      isApproved: true,
    });
  };

  return (
    <SurplusLinkContext.Provider
      value={{
        state,
        session,
        users,
        login,
        registerProvider,
        registerNgo,
        logout,
        approveProvider,
        switchDemoAccount,
        selectedProvider,
        setSelectedProviderId,
        college: COLLEGE_ANCHOR,
        providers: state.providers,
        ngo: state.ngo,
        donations: state.donations,
        collections: state.collections,
        notifications: state.notifications,
        addDonation,
        updateDonationStatus,
        acceptTripCollection,
        updateStopProgress,
        recordCollectionReceived,
        recordCollectionDistributed,
        loadDemoDonationsBatch,
        dismissNotification,
        updateProviderDefaults,
        skipTonightDonation,
        unskipTonightDonation,
        loadScenario,
        plannerConfig,
        updatePlannerConfig,
        recordExcludedDonations,
        resetAllData,
      }}
    >
      {children}
    </SurplusLinkContext.Provider>
  );
};

export const useSurplusLink = () => {
  const context = useContext(SurplusLinkContext);
  if (!context) {
    throw new Error('useSurplusLink must be used within a SurplusLinkProvider');
  }
  return context;
};
