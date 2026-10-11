import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type * as LeafletType from 'leaflet';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  RotateCcw,
  Languages,
  ShieldCheck,
  Send,
  Building2,
  Phone,
  Flame,
  Cookie,
  Coffee,
  Candy,
  ChevronRight,
  Navigation,
  XCircle,
  Truck,
  HeartHandshake,
} from 'lucide-react';
import { useSurplusLink } from '../context/SurplusLinkContext';
import { getCurrentMealSlot } from '../utils/posAndPredictionUtils';
import {
  FOOD_SAFETY_LIMITS,
  PublicFoodTypeId,
  validatePickupDeadline,
} from '../config/foodSafetyLimits';
import {
  PUBLIC_DONATE_TRANSLATIONS,
  PublicLanguage,
} from '../i18n/publicDonateTranslations';

const PREFILL_STORAGE_KEY = 'replate_quick_donor_shop_v1';
const SUBMISSION_RATE_LIMIT_PREFIX = 'replate_donor_submissions_';

interface SavedShopInfo {
  shopName: string;
  phone: string;
  landmark?: string;
  coords?: { lat: number; lng: number; accuracy?: number };
}

export const PublicDonationPage: React.FC = () => {
  const { ngoId } = useParams<{ ngoId: string }>();
  const { ngo, donations, addDonation } = useSurplusLink();

  // Language state
  const [lang, setLang] = useState<PublicLanguage>('en');
  const t = PUBLIC_DONATE_TRANSLATIONS[lang];

  // Recipient NGO details
  const targetNgoName = (ngo && ngo.id === ngoId) ? ngo.name : (ngo?.name || 'Local Food Relief NGO');

  // Form Fields
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [foodType, setFoodType] = useState<PublicFoodTypeId>('cooked_meal');
  const [quantity, setQuantity] = useState(15);

  // Prepared Time
  // Chip modes: 'just_now' | '1h_ago' | '2h_ago' | 'custom'
  const [prepChip, setPrepChip] = useState<'just_now' | '1h_ago' | '2h_ago' | 'custom'>('just_now');
  const [customPrepTimeStr, setCustomPrepTimeStr] = useState('');

  // Pickup Deadline
  // Chip modes: '+1h' | '+2h' | '+3h' | 'custom'
  const [deadlineChip, setDeadlineChip] = useState<'+1h' | '+2h' | '+3h' | 'custom'>('+2h');
  const [customDeadlineTimeStr, setCustomDeadlineTimeStr] = useState('');

  // Location state
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'denied'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [landmark, setLandmark] = useState('');

  // Saved shop status
  const [hasSavedShopPrefill, setHasSavedShopPrefill] = useState(false);

  // Anti-spam
  const [honeypot, setHoneypot] = useState('');
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState<{
    donationId: string;
    shopName: string;
    phone: string;
    quantity: number;
    foodTypeLabel: string;
    preparedTimeFormatted: string;
    deadlineFormatted: string;
    storageDesc: string;
  } | null>(null);

  // Validation error banners
  const [formErrors, setFormErrors] = useState<{
    shopName?: string;
    phone?: string;
    location?: string;
    deadline?: string;
  }>({});

  // Leaflet fallback map
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Load saved shop from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFILL_STORAGE_KEY);
      if (raw) {
        const parsed: SavedShopInfo = JSON.parse(raw);
        if (parsed.shopName || parsed.phone) {
          setShopName(parsed.shopName || '');
          setPhone(parsed.phone || '');
          if (parsed.landmark) setLandmark(parsed.landmark);
          if (parsed.coords) {
            setCoords(parsed.coords);
            setLocationStatus('success');
          }
          setHasSavedShopPrefill(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Compute Prepared Timestamp
  const nowMs = Date.now();
  const preparedTimestamp = useMemo(() => {
    const d = new Date();
    if (prepChip === 'just_now') return d.getTime();
    if (prepChip === '1h_ago') return d.getTime() - 60 * 60 * 1000;
    if (prepChip === '2h_ago') return d.getTime() - 2 * 60 * 60 * 1000;
    if (prepChip === 'custom' && customPrepTimeStr) {
      const [h, m] = customPrepTimeStr.split(':').map(Number);
      const customDate = new Date();
      customDate.setHours(h, m, 0, 0);
      return customDate.getTime();
    }
    return d.getTime();
  }, [prepChip, customPrepTimeStr, nowMs]);

  // Compute Deadline Timestamp
  const deadlineTimestamp = useMemo(() => {
    const base = preparedTimestamp;
    if (deadlineChip === '+1h') return base + 1 * 60 * 60 * 1000;
    if (deadlineChip === '+2h') return base + 2 * 60 * 60 * 1000;
    if (deadlineChip === '+3h') return base + 3 * 60 * 60 * 1000;
    if (deadlineChip === 'custom' && customDeadlineTimeStr) {
      const [h, m] = customDeadlineTimeStr.split(':').map(Number);
      const customDate = new Date(preparedTimestamp);
      customDate.setHours(h, m, 0, 0);
      // If time is earlier in the day than prep time, assume it's next day or later
      if (customDate.getTime() < preparedTimestamp) {
        customDate.setDate(customDate.getDate() + 1);
      }
      return customDate.getTime();
    }
    return base + 2 * 60 * 60 * 1000;
  }, [preparedTimestamp, deadlineChip, customDeadlineTimeStr]);

  // Food Safety Validation
  const safetyCheck = useMemo(() => {
    return validatePickupDeadline(foodType, preparedTimestamp, deadlineTimestamp);
  }, [foodType, preparedTimestamp, deadlineTimestamp]);

  const activeFoodConfig = FOOD_SAFETY_LIMITS[foodType];

  // Format Timestamps for display
  const formatTimeStr = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Stepper handlers
  const handleDecQty = () => setQuantity((q) => Math.max(1, q - 5));
  const handleIncQty = () => setQuantity((q) => q + 5);

  // Clear prefilled shop info
  const handleClearPrefill = () => {
    try {
      localStorage.removeItem(PREFILL_STORAGE_KEY);
    } catch {
      // ignore
    }
    setShopName('');
    setPhone('');
    setLandmark('');
    setCoords(null);
    setLocationStatus('idle');
    setHasSavedShopPrefill(false);
  };

  // Cap deadline to max allowed safe limit
  const handleCapDeadline = () => {
    const cappedTs = safetyCheck.maxAllowedTimestamp;
    const cappedDate = new Date(cappedTs);
    const h = String(cappedDate.getHours()).padStart(2, '0');
    const m = String(cappedDate.getMinutes()).padStart(2, '0');
    setDeadlineChip('custom');
    setCustomDeadlineTimeStr(`${h}:${m}`);
  };

  // Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setCoords(newCoords);
        setLocationStatus('success');
        setFormErrors((prev) => ({ ...prev, location: undefined }));

        // Center map if initialized
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 15);
          if (pinMarkerRef.current) {
            pinMarkerRef.current.setLatLng([newCoords.lat, newCoords.lng]);
          } else {
            import('leaflet').then((leafletModule) => {
              const L = (leafletModule.default || leafletModule) as typeof LeafletType;
              if (mapInstanceRef.current) {
                pinMarkerRef.current = L.marker([newCoords.lat, newCoords.lng]).addTo(mapInstanceRef.current);
              }
            });
          }
        }
      },
      () => {
        setLocationStatus('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Initialize Leaflet fallback map when denied or on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let isCancelled = false;

    import('leaflet').then((leafletModule) => {
      if (isCancelled || !mapContainerRef.current) return;
      const L = (leafletModule.default || leafletModule) as typeof LeafletType;

      if (!mapInstanceRef.current) {
        const defaultCenter: [number, number] = coords
          ? [coords.lat, coords.lng]
          : [ngo?.lat || 9.9252, ngo?.lng || 78.1198];

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Tap on map to drop / move pin
        map.on('click', (e: LeafletType.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setCoords({ lat, lng, accuracy: 15 });
          setLocationStatus('success');
          setFormErrors((prev) => ({ ...prev, location: undefined }));

          if (pinMarkerRef.current) {
            pinMarkerRef.current.setLatLng([lat, lng]);
          } else {
            pinMarkerRef.current = L.marker([lat, lng]).addTo(map);
          }
        });

        mapInstanceRef.current = map;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [locationStatus]);

  // Rate Limiting Check (max 5 submissions per phone number per hour)
  const checkRateLimit = (phoneNumber: string): boolean => {
    try {
      const clean = phoneNumber.trim().replace(/\D/g, '');
      const key = `${SUBMISSION_RATE_LIMIT_PREFIX}${clean}`;
      const raw = localStorage.getItem(key);
      const now = Date.now();
      const hourMs = 60 * 60 * 1000;
      let timestamps: number[] = raw ? JSON.parse(raw) : [];
      timestamps = timestamps.filter((t) => now - t < hourMs);

      if (timestamps.length >= 5) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const recordRateLimitSubmission = (phoneNumber: string) => {
    try {
      const clean = phoneNumber.trim().replace(/\D/g, '');
      const key = `${SUBMISSION_RATE_LIMIT_PREFIX}${clean}`;
      const raw = localStorage.getItem(key);
      const now = Date.now();
      const hourMs = 60 * 60 * 1000;
      let timestamps: number[] = raw ? JSON.parse(raw) : [];
      timestamps = timestamps.filter((t) => now - t < hourMs);
      timestamps.push(now);
      localStorage.setItem(key, JSON.stringify(timestamps));
    } catch {
      // ignore
    }
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Honeypot check (anti-bot spam)
    if (honeypot.trim().length > 0) {
      setRateLimitError(t.errSpamDetected);
      return;
    }

    const errors: { shopName?: string; phone?: string; location?: string; deadline?: string } = {};

    // 2. Validate shop name
    if (!shopName.trim()) {
      errors.shopName = t.errShopNameRequired;
    }

    // 3. Validate 10-digit Indian mobile number
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      errors.phone = t.errPhoneInvalid;
    }

    // 4. Validate Location (needs GPS coords OR landmark)
    if (!coords && !landmark.trim()) {
      errors.location = t.errLocationRequired;
    }

    // 5. Validate Safety
    if (!safetyCheck.isValid) {
      errors.deadline = lang === 'ta' ? safetyCheck.warningTa : safetyCheck.warningEn;
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    // 6. Check Rate Limit
    if (!checkRateLimit(cleanPhone)) {
      setRateLimitError(t.errRateLimit);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create donation
      const prepTimeFormatted = formatTimeStr(preparedTimestamp);
      const deadlineFormatted = formatTimeStr(deadlineTimestamp);
      const storageDesc = lang === 'ta' ? activeFoodConfig.storageDescriptionTa : activeFoodConfig.storageDescriptionEn;
      const donationId = `don-qr-${Date.now()}`;

      addDonation({
        id: donationId,
        providerId: `quick-donor-${cleanPhone}`,
        providerName: shopName.trim(),
        providerType: activeFoodConfig.providerType,
        mealSlot: getCurrentMealSlot(),
        foodItem: `${lang === 'ta' ? activeFoodConfig.labelTa : activeFoodConfig.labelEn} Surplus`,
        category: activeFoodConfig.category,
        storageType: activeFoodConfig.autoStorageType,
        portions: quantity,
        confirmedPortions: quantity,
        preparedTime: prepTimeFormatted,
        collectionDeadline: deadlineFormatted,
        deadlineTimestamp: deadlineTimestamp,
        preparedTimestamp: preparedTimestamp,
        dietary: 'veg',
        status: 'Submitted',
        source: 'qr_form',
        verification: 'unverified',
        ngoId: ngoId || ngo?.id || 'ngo-madurai-central',
        contactPhone: cleanPhone,
        lat: coords?.lat,
        lng: coords?.lng,
        locationAccuracy: coords?.accuracy,
        locationLandmark: landmark.trim() || undefined,
        notes: `Public donation via /donate/${ngoId || 'ngo'}. Landmark: ${landmark.trim() || 'GPS captured'}.`,
      });

      // Save shop details to device localStorage
      try {
        const saveInfo: SavedShopInfo = {
          shopName: shopName.trim(),
          phone: cleanPhone,
          landmark: landmark.trim() || undefined,
          coords: coords || undefined,
        };
        localStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify(saveInfo));
      } catch {
        // ignore
      }

      // Record rate limit hit
      recordRateLimitSubmission(cleanPhone);

      // Set confirmation view data
      setSubmittedDonation({
        donationId,
        shopName: shopName.trim(),
        phone: cleanPhone,
        quantity,
        foodTypeLabel: lang === 'ta' ? activeFoodConfig.labelTa : activeFoodConfig.labelEn,
        preparedTimeFormatted: prepTimeFormatted,
        deadlineFormatted: deadlineFormatted,
        storageDesc,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to submit another donation
  const handlePostAnother = () => {
    setSubmittedDonation(null);
    setQuantity(15);
    setPrepChip('just_now');
    setDeadlineChip('+2h');
    setCustomPrepTimeStr('');
    setCustomDeadlineTimeStr('');
    setRateLimitError(null);
    setFormErrors({});
  };

  // -------------------------------------------------------------
  // CONFIRMATION VIEW
  // -------------------------------------------------------------
  if (submittedDonation) {
    const liveDonation = donations.find((d) => d.id === submittedDonation.donationId);
    const liveStatus = liveDonation?.status || 'Submitted';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-emerald-100">
        <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Top Status Icon */}
          {liveStatus === 'Rejected' ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 mx-auto flex items-center justify-center border border-rose-200 shadow-2xs">
              <XCircle className="w-9 h-9" />
            </div>
          ) : liveStatus === 'Expired' ? (
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center border border-slate-200 shadow-2xs">
              <Clock className="w-9 h-9" />
            </div>
          ) : liveStatus === 'Collected' ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200 shadow-2xs">
              <HeartHandshake className="w-9 h-9" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight" id="confirm-title">
              {liveStatus === 'Rejected'
                ? 'Submission Not Accepted'
                : liveStatus === 'Expired'
                ? 'Pickup Window Expired'
                : liveStatus === 'Collected'
                ? 'Surplus Food Collected!'
                : liveStatus === 'Confirmed'
                ? 'Accepted by NGO!'
                : t.confirmTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {targetNgoName}
            </p>
          </div>

          {/* Review Notice Card with Live Status */}
          {liveStatus === 'Rejected' ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-1" id="confirm-rejected-notice">
              <div className="flex items-center gap-1.5 text-rose-900 text-xs font-bold">
                <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Not Accepted by NGO</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-semibold">
                Reason: {liveDonation?.rejectionReason || 'Unable to collect surplus at this time.'}
              </p>
            </div>
          ) : liveStatus === 'Expired' ? (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-left space-y-1" id="confirm-expired-notice">
              <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
                <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Collection Safe Window Ended</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                The food-safety pickup deadline passed before a collection van could be dispatched.
              </p>
            </div>
          ) : liveStatus === 'Confirmed' ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-1" id="confirm-accepted-notice">
              <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Accepted by NGO!</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                Your surplus donation has been verified and added to the NGO&apos;s collection circuit.
              </p>
            </div>
          ) : liveStatus === 'Scheduled' || liveStatus === 'En route' ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-left space-y-1" id="confirm-scheduled-notice">
              <div className="flex items-center gap-1.5 text-blue-900 text-xs font-bold">
                <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Collection Van Dispatched</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed font-medium">
                Driver {liveDonation?.driverName || 'Van assigned'} is scheduled for doorstep collection.
              </p>
            </div>
          ) : liveStatus === 'Collected' ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-1" id="confirm-collected-notice">
              <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-bold">
                <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Surplus Picked Up</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                Thank you! Your donation was successfully collected by the rescue van and is being distributed to feed hungry people.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-left space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Pending NGO Review</span>
              </div>
              <p className="text-xs text-amber-950/90 leading-relaxed font-medium" id="confirm-review-notice">
                {t.confirmReviewNotice}
              </p>
            </div>
          )}

          {/* Details Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-left divide-y divide-slate-200/60 text-xs space-y-2.5">
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 font-medium">{t.confirmShop}</span>
              <span className="font-bold text-slate-900 text-sm" id="confirm-shop-name">
                {submittedDonation.shopName}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500 font-medium">{t.confirmQty}</span>
              <span className="font-bold text-emerald-800 text-base font-mono" id="confirm-quantity">
                {submittedDonation.quantity} {t.quantityPortions}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500 font-medium">{t.confirmFoodType}</span>
              <span className="font-semibold text-slate-800">
                {submittedDonation.foodTypeLabel} ({submittedDonation.storageDesc})
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500 font-medium">{t.confirmPrepared}</span>
              <span className="font-mono font-semibold text-slate-800" id="confirm-prep-time">
                {submittedDonation.preparedTimeFormatted}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500 font-medium">{t.confirmDeadline}</span>
              <span className="font-mono font-bold text-slate-900" id="confirm-deadline-time">
                {submittedDonation.deadlineFormatted}
              </span>
            </div>
          </div>

          {/* Post Another Button */}
          <button
            type="button"
            id="btn-post-another-donation"
            onClick={handlePostAnother}
            className="w-full min-h-[48px] px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm tracking-wide shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.postAnotherBtn}</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PUBLIC SUBMISSION FORM VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col items-center py-4 px-3 sm:py-6 selection:bg-emerald-100">
      {/* 375px mobile wrapper */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6 relative">
        {/* Header with Language Toggle */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>{t.badgeNoLogin}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1.5" id="public-donate-title">
              {t.pageTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.pageSubtitle}
            </p>
            <div className="mt-1 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span>{t.ngoLabel}:</span>
              <span className="font-bold underline decoration-emerald-300">{targetNgoName}</span>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              id="lang-btn-en"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                lang === 'en'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              id="lang-btn-ta"
              onClick={() => setLang('ta')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                lang === 'ta'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Prefilled Device Notice */}
        {hasSavedShopPrefill && (
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-1.5 truncate pr-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{t.prefilledBadge}</span>
            </div>
            <button
              type="button"
              id="btn-clear-prefilled-shop"
              onClick={handleClearPrefill}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline shrink-0 cursor-pointer"
            >
              {t.notYourShop}
            </button>
          </div>
        )}

        {/* Rate limit warning banner */}
        {rateLimitError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{rateLimitError}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot hidden input for spam bots */}
          <input
            type="text"
            name="hp_website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* 1. SHOP DETAILS */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {t.shopSectionTitle}
            </label>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {t.shopNameLabel} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-shop-name"
                value={shopName}
                onChange={(e) => {
                  setShopName(e.target.value);
                  if (formErrors.shopName) setFormErrors((p) => ({ ...p, shopName: undefined }));
                }}
                placeholder={t.shopNamePlaceholder}
                className={`w-full min-h-[48px] px-3.5 py-3 text-sm rounded-xl border bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium ${
                  formErrors.shopName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {formErrors.shopName && (
                <p className="text-[11px] font-semibold text-rose-600">{formErrors.shopName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {t.phoneLabel} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="input-phone"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                    if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  placeholder={t.phonePlaceholder}
                  className={`w-full min-h-[48px] px-3.5 py-3 text-sm font-mono tracking-wider rounded-xl border bg-slate-50/50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    formErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500">{t.phoneHint}</p>
              {formErrors.phone && (
                <p className="text-[11px] font-semibold text-rose-600">{formErrors.phone}</p>
              )}
            </div>
          </div>

          {/* 2. FOOD & QUANTITY */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {t.foodSectionTitle}
            </label>

            {/* Food Type Chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">{t.foodTypeLabel}</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Food Type">
                {(
                  [
                    { id: 'cooked_meal', icon: Flame, color: 'text-amber-700' },
                    { id: 'bakery', icon: Cookie, color: 'text-orange-700' },
                    { id: 'snacks', icon: Coffee, color: 'text-yellow-700' },
                    { id: 'sweets', icon: Candy, color: 'text-pink-700' },
                  ] as const
                ).map(({ id, icon: Icon, color }) => {
                  const cfg = FOOD_SAFETY_LIMITS[id];
                  const isSelected = foodType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      id={`chip-food-type-${id}`}
                      onClick={() => setFoodType(id)}
                      className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${color} shrink-0`} />
                      <div className="truncate">
                        <span className="text-xs block truncate leading-tight">
                          {lang === 'ta' ? cfg.labelTa : cfg.labelEn}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Max {cfg.maxSafeHours}h
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Auto-suggested Storage Type badge */}
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {t.storageAutoBadge.replace(
                      '{type}',
                      lang === 'ta'
                        ? activeFoodConfig.storageDescriptionTa
                        : activeFoodConfig.storageDescriptionEn
                    )}
                  </span>
                </span>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {t.quantityLabel}
              </label>
              <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-200">
                <button
                  type="button"
                  id="btn-qty-dec"
                  onClick={handleDecQty}
                  disabled={quantity <= 1}
                  className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center font-bold text-lg cursor-pointer shadow-2xs active:scale-95 transition-transform"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="text-center px-4">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight" id="display-quantity">
                    {quantity}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block">
                    {t.quantityPortions}
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-qty-inc"
                  onClick={handleIncQty}
                  className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer shadow-xs active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. TIME & PICKUP DEADLINE */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {t.timeSectionTitle}
            </label>

            {/* Prepared Time Chips */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">{t.preparedTimeLabel}</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]" id="prep-time-display">
                  {formatTimeStr(preparedTimestamp)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'just_now', label: t.timeJustNow },
                  { id: '1h_ago', label: t.time1hAgo },
                  { id: '2h_ago', label: t.time2hAgo },
                  { id: 'custom', label: t.timePick },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    id={`chip-prep-${item.id}`}
                    onClick={() => {
                      setPrepChip(item.id as any);
                      if (item.id === 'custom' && !customPrepTimeStr) {
                        const d = new Date();
                        const h = String(d.getHours()).padStart(2, '0');
                        const m = String(d.getMinutes()).padStart(2, '0');
                        setCustomPrepTimeStr(`${h}:${m}`);
                      }
                    }}
                    className={`min-h-[48px] px-2 py-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center ${
                      prepChip === item.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Prep Time Picker Input */}
              {prepChip === 'custom' && (
                <div className="pt-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    id="input-custom-prep-time"
                    value={customPrepTimeStr}
                    onChange={(e) => setCustomPrepTimeStr(e.target.value)}
                    className="min-h-[44px] px-3 py-1.5 text-sm border rounded-xl border-slate-300 bg-white font-mono font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Pickup Deadline Chips */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">{t.deadlineLabel}</span>
                <span className="font-mono font-bold text-emerald-800 text-[11px]" id="deadline-time-display">
                  {formatTimeStr(deadlineTimestamp)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '+1h', label: t.deadlinePlus1h },
                  { id: '+2h', label: t.deadlinePlus2h },
                  { id: '+3h', label: t.deadlinePlus3h },
                  { id: 'custom', label: t.deadlinePick },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    id={`chip-deadline-${item.id.replace('+', 'plus')}`}
                    onClick={() => {
                      setDeadlineChip(item.id as any);
                      if (item.id === 'custom' && !customDeadlineTimeStr) {
                        const d = new Date(preparedTimestamp + 2 * 60 * 60 * 1000);
                        const h = String(d.getHours()).padStart(2, '0');
                        const m = String(d.getMinutes()).padStart(2, '0');
                        setCustomDeadlineTimeStr(`${h}:${m}`);
                      }
                    }}
                    className={`min-h-[48px] px-2 py-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center ${
                      deadlineChip === item.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Deadline Picker Input */}
              {deadlineChip === 'custom' && (
                <div className="pt-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    id="input-custom-deadline-time"
                    value={customDeadlineTimeStr}
                    onChange={(e) => setCustomDeadlineTimeStr(e.target.value)}
                    className="min-h-[44px] px-3 py-1.5 text-sm border rounded-xl border-slate-300 bg-white font-mono font-semibold"
                  />
                </div>
              )}

              {/* Safe limits notice */}
              <p className="text-[11px] text-slate-500 pt-0.5">
                {t.safeLimitNotice
                  .replace('{hours}', String(activeFoodConfig.maxSafeHours))
                  .replace('{type}', lang === 'ta' ? activeFoodConfig.labelTa : activeFoodConfig.labelEn)}
              </p>

              {/* Safety validation error or cap button */}
              {!safetyCheck.isValid && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2" id="deadline-safety-warning">
                  <div className="flex items-start gap-1.5 text-rose-800 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{lang === 'ta' ? safetyCheck.warningTa : safetyCheck.warningEn}</span>
                  </div>
                  {safetyCheck.exceedsSafeLimit && (
                    <button
                      type="button"
                      id="btn-cap-deadline"
                      onClick={handleCapDeadline}
                      className="min-h-[40px] px-3 py-1 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-lg cursor-pointer shadow-2xs"
                    >
                      {t.capDeadlineBtn.replace('{time}', formatTimeStr(safetyCheck.maxAllowedTimestamp))}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. LOCATION */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              {t.locationSectionTitle}
            </label>

            {/* Explanation */}
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.locationExplanation}
            </p>

            {/* Share Location Button */}
            <button
              type="button"
              id="btn-share-location"
              onClick={handleGetLocation}
              disabled={locationStatus === 'locating'}
              className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                locationStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900 shadow-xs'
              }`}
            >
              <Navigation className={`w-4 h-4 ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>
                {locationStatus === 'locating'
                  ? t.sharingLocation
                  : locationStatus === 'success'
                  ? t.locationCaptured.replace('{acc}', String(coords?.accuracy || 20))
                  : t.shareLocationBtn}
              </span>
            </button>

            {/* Location Denied Alert */}
            {locationStatus === 'denied' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5" id="location-denied-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900">
                    {t.locationDenied}
                  </span>
                  <button
                    type="button"
                    id="btn-try-again-location"
                    onClick={handleGetLocation}
                    className="text-xs font-bold text-amber-800 underline cursor-pointer"
                  >
                    {t.tryAgainBtn}
                  </button>
                </div>
              </div>
            )}

            {/* Fallback Inputs: Landmark & Pin Drop Map */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-600 block">
                {t.fallbackOr}
              </span>
              <input
                type="text"
                id="input-landmark"
                value={landmark}
                onChange={(e) => {
                  setLandmark(e.target.value);
                  if (formErrors.location) setFormErrors((p) => ({ ...p, location: undefined }));
                }}
                placeholder={t.landmarkPlaceholder}
                className="w-full min-h-[48px] px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Compact Leaflet Pin Map */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  {t.dropPinLabel} {coords ? `• ${t.pinPlaced}` : ''}
                </span>
                <div
                  ref={mapContainerRef}
                  id="public-donor-map-container"
                  className="w-full h-36 rounded-xl border border-slate-200 overflow-hidden relative z-0 shadow-2xs"
                />
              </div>

              {formErrors.location && (
                <p className="text-[11px] font-semibold text-rose-600" id="error-location-required">
                  {formErrors.location}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              id="btn-submit-donation"
              disabled={isSubmitting || !safetyCheck.isValid}
              className={`w-full min-h-[52px] px-5 py-4 rounded-2xl font-bold text-base text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] ${
                !safetyCheck.isValid
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? t.submitting
                  : t.submitBtn.replace('{count}', String(quantity))}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
