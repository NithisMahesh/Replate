import React, { useState, useEffect, useMemo, useRef } from 'react';
import type * as LeafletType from 'leaflet';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { FoodDonation, NGO } from '../../types/surplusLink';
import { DonationTimeline } from '../shared/DonationTimeline';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { EmptyState } from '../shared/EmptyState';
import { useToast } from '../shared/Toast';
import {
  Inbox,
  Phone,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Navigation,
  Utensils,
  History,
  Info,
  Check,
  PhoneCall,
  X,
} from 'lucide-react';

export const IncomingInboxTab: React.FC = () => {
  const { donations, ngo, updateDonation, eventLog, highlightedDonationId } = useSurplusLink();
  const toast = useToast();

  const [now, setNow] = useState(Date.now());
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'history'>('queue');

  // Modals state
  const [unverifiedModalDonation, setUnverifiedModalDonation] = useState<FoodDonation | null>(null);
  const [rejectModalDonation, setRejectModalDonation] = useState<FoodDonation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Outside current collection service radius');
  const [customRejectionText, setCustomRejectionText] = useState('');
  const [mapModalDonation, setMapModalDonation] = useState<FoodDonation | null>(null);

  // Map ref for modal
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);

  // Live timer tick every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter QR donations
  const qrDonations = useMemo(() => {
    return donations.filter((d) => d.source === 'qr_form');
  }, [donations]);

  // Requirement: Donations whose deadline passes while Submitted become Expired automatically and leave the inbox
  useEffect(() => {
    qrDonations.forEach((d) => {
      if (d.status === 'Submitted' && d.deadlineTimestamp <= now) {
        updateDonation(d.id, { status: 'Expired' });
      }
    });
  }, [now, qrDonations, updateDonation]);

  // Active Submitted donations (sorted by remaining time: most urgent first)
  const activeQueue = useMemo(() => {
    return qrDonations
      .filter((d) => d.status === 'Submitted' && d.deadlineTimestamp > now)
      .sort((a, b) => a.deadlineTimestamp - b.deadlineTimestamp);
  }, [qrDonations, now]);

  // Processed / historical donations
  const historyQueue = useMemo(() => {
    return qrDonations
      .filter((d) => d.status !== 'Submitted' || d.deadlineTimestamp <= now)
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [qrDonations, now]);

  // Helper: Shop with >=1 earlier Collected donation is Trusted
  const isTrustedShop = (item: FoodDonation): boolean => {
    return donations.some(
      (d) =>
        d.id !== item.id &&
        (d.contactPhone === item.contactPhone ||
          d.providerId === item.providerId ||
          (d.providerName &&
            item.providerName &&
            d.providerName.trim().toLowerCase() === item.providerName.trim().toLowerCase())) &&
        ['Collected', 'Received', 'Distributed'].includes(d.status)
    );
  };

  // Helper: Format countdown with color urgency
  const getRemainingCountdown = (deadlineTimestamp: number, currentMs: number) => {
    const diffMs = deadlineTimestamp - currentMs;
    if (diffMs <= 0) {
      return {
        label: 'Expired',
        colorClass: 'bg-slate-100 text-slate-600 border-slate-300',
        urgency: 'grey',
      };
    }
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const label =
      hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m ${String(seconds).padStart(2, '0')}s left`;

    if (diffMs > 2 * 60 * 60 * 1000) {
      // green > 2 h
      return {
        label,
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        urgency: 'green',
      };
    } else if (diffMs >= 60 * 60 * 1000) {
      // amber 1-2 h
      return {
        label,
        colorClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
        urgency: 'amber',
      };
    } else {
      // red < 1 h
      return {
        label,
        colorClass: 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold animate-pulse',
        urgency: 'red',
      };
    }
  };

  // Actions
  const handleMarkCalled = (item: FoodDonation) => {
    const timeStr = new Date().toISOString();
    updateDonation(item.id, { isCalled: true, calledAt: timeStr });
    toast.success(`Marked ${item.providerName} as called`);
  };

  const handleAcceptClick = (item: FoodDonation) => {
    const trusted = isTrustedShop(item);
    if (!trusted) {
      setUnverifiedModalDonation(item);
    } else {
      executeAccept(item);
    }
  };

  const executeAccept = (item: FoodDonation) => {
    updateDonation(item.id, {
      status: 'Confirmed',
      verification: 'verified',
    });
    setUnverifiedModalDonation(null);
    toast.success(
      `Accepted donation from ${item.providerName}! Moved to Confirmed planner pool.`
    );
  };

  const handleOpenReject = (item: FoodDonation) => {
    setRejectModalDonation(item);
    setRejectionReason('Outside current collection service radius');
    setCustomRejectionText('');
  };

  const executeReject = () => {
    if (!rejectModalDonation) return;
    const finalReason =
      rejectionReason === 'Custom'
        ? customRejectionText.trim() || 'Unable to collect surplus'
        : rejectionReason;

    updateDonation(rejectModalDonation.id, {
      status: 'Rejected',
      rejectionReason: finalReason,
    });
    toast.info(`Donation from ${rejectModalDonation.providerName} marked as Rejected.`);
    setRejectModalDonation(null);
  };

  // Leaflet Modal Map Initialization
  useEffect(() => {
    if (!mapModalDonation || !mapContainerRef.current) return;
    let isCancelled = false;

    import('leaflet').then((leafletModule) => {
      if (isCancelled || !mapContainerRef.current) return;
      const L = (leafletModule.default || leafletModule) as typeof LeafletType;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const donorLat = mapModalDonation.lat ?? ngo.lat;
      const donorLng = mapModalDonation.lng ?? ngo.lng;

      const map = L.map(mapContainerRef.current, {
        center: [donorLat, donorLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // NGO Depot Marker
      L.marker([ngo.lat, ngo.lng])
        .addTo(map)
        .bindPopup(`<b>${ngo.name} Depot</b><br/>Collection Hub`)
        .openPopup();

      // Donor Marker
      if (mapModalDonation.lat && mapModalDonation.lng) {
        L.marker([mapModalDonation.lat, mapModalDonation.lng])
          .addTo(map)
          .bindPopup(
            `<b>${mapModalDonation.providerName}</b><br/>${mapModalDonation.foodItem} (${mapModalDonation.confirmedPortions}p)`
          )
          .openPopup();

        // Fit bounds
        const bounds = L.latLngBounds([
          [ngo.lat, ngo.lng],
          [mapModalDonation.lat, mapModalDonation.lng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstanceRef.current = map;
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapModalDonation, ngo.lat, ngo.lng, ngo.name]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Incoming Surplus Inbox
            </h2>
            {activeQueue.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                {activeQueue.length} pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Surplus food logged via public QR poster without login. Review, verify, and accept into collection routing.
          </p>
        </div>

        {/* View toggle tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'queue'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Queue ({activeQueue.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Processed & Expired ({historyQueue.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ACTIVE QUEUE */}
      {activeSubTab === 'queue' && (
        <>
          {activeQueue.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-8 w-8 text-slate-400" />}
              title="No Pending QR Submissions"
              description="New surplus donations submitted via the public QR link will appear here instantly with countdown timers."
            />
          ) : (
            <div className="space-y-4">
              {activeQueue.map((item) => {
                const trusted = isTrustedShop(item);
                const countdown = getRemainingCountdown(item.deadlineTimestamp, now);
                const portions = item.confirmedPortions ?? item.portions;
                const isHighlighted = item.id === highlightedDonationId;
                const isTypedLocation =
                  !item.lat ||
                  !item.lng ||
                  Boolean(item.locationLandmark && (!item.locationAccuracy || item.locationAccuracy > 100));

                return (
                  <Card
                    key={item.id}
                    id={`incoming-donation-${item.id}`}
                    className={`relative overflow-hidden transition-all ${
                      isHighlighted
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/10'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Urgency Stripe */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        countdown.urgency === 'green'
                          ? 'bg-emerald-500'
                          : countdown.urgency === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />

                    <div className="space-y-4 pt-1">
                      {/* Top Bar: Shop Name, Badges, Countdown */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            {item.providerName}
                          </h3>

                          {/* Trusted vs Unverified Badge */}
                          {trusted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Trusted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Unverified
                            </span>
                          )}

                          {/* Called Status Indicator */}
                          {item.isCalled && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Check className="w-3 h-3 text-blue-600" />
                              Called {item.calledAt ? new Date(item.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          )}
                        </div>

                        {/* Live Countdown Urgency Chip */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs border ${countdown.colorClass}`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{countdown.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60 text-xs">
                        {/* Food & Quantity */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Food & Portions
                          </span>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{item.foodItem}</span>
                          </div>
                          <div className="text-emerald-800 font-extrabold font-mono text-sm">
                            {portions} portions
                          </div>
                        </div>

                        {/* Timing */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Prep & Deadline
                          </span>
                          <div className="text-slate-700 font-medium">
                            Prepared: <strong>{item.preparedTime}</strong>
                          </div>
                          <div className="text-slate-900 font-semibold">
                            Deadline: <strong>{item.collectionDeadline}</strong>
                          </div>
                        </div>

                        {/* Phone & Contact */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Phone / Contact
                          </span>
                          <div className="font-mono font-bold text-slate-900">
                            {item.contactPhone || 'No phone'}
                          </div>
                          {item.contactPhone && (
                            <a
                              href={`tel:${item.contactPhone}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call {item.contactPhone}</span>
                            </a>
                          )}
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Location
                          </span>
                          <div className="flex items-start gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">
                              {item.locationLandmark || (item.lat && item.lng ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : 'Location pinned')}
                            </span>
                          </div>
                          {/* Note if typed instead of detected */}
                          {isTypedLocation ? (
                            <span className="text-[10px] text-amber-700 font-semibold block">
                              Note: Typed landmark (not GPS)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium block">
                              GPS detected (±{item.locationAccuracy || 15}m)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reusable Donation Timeline */}
                      <div className="pt-0.5">
                        <DonationTimeline donation={item} events={eventLog} compact={true} />
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                        {/* Left actions: Map & Call mark */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMapModalDonation(item)}
                            icon={<MapPin className="w-3.5 h-3.5 text-slate-500" />}
                            className="text-xs font-semibold cursor-pointer"
                          >
                            View on map
                          </Button>

                          {!item.isCalled && item.contactPhone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkCalled(item)}
                              icon={<PhoneCall className="w-3.5 h-3.5 text-slate-500" />}
                              className="text-xs font-semibold cursor-pointer"
                            >
                              Mark as called
                            </Button>
                          )}
                        </div>

                        {/* Right actions: Reject & Accept */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReject(item)}
                            icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            className="text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                          >
                            Reject
                          </Button>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptClick(item)}
                            icon={<CheckCircle2 className="w-4 h-4" />}
                            className="text-xs font-bold min-h-[38px] px-4 cursor-pointer"
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: PROCESSED & HISTORY */}
      {activeSubTab === 'history' && (
        <>
          {historyQueue.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8 text-slate-400" />}
              title="No Historical QR Donations"
              description="Accepted, rejected, and expired QR submissions will appear here for audit tracking."
            />
          ) : (
            <div className="space-y-3">
              {historyQueue.map((item) => {
                const portions = item.confirmedPortions ?? item.portions;
                const isRejected = item.status === 'Rejected';
                const isExpired = item.status === 'Expired';
                const isConfirmed = item.status === 'Confirmed';
                const isScheduled = item.status === 'Scheduled' || item.status === 'En route';
                const isCollected = item.status === 'Collected' || item.status === 'Received' || item.status === 'Distributed';

                const isHighlighted = item.id === highlightedDonationId;

                return (
                  <Card
                    key={item.id}
                    id={`history-donation-${item.id}`}
                    className={`p-4 bg-white transition-all space-y-3 ${
                      isHighlighted
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.providerName}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-emerald-800 font-bold">{portions} portions</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{item.foodItem}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Prepared at {item.preparedTime} • Deadline {item.collectionDeadline} • Phone: {item.contactPhone || 'N/A'}
                        </div>
                        {/* Rejection / Exclusion Reason notice */}
                        {isRejected && item.rejectionReason && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold mt-1">
                            Rejection Reason: {item.rejectionReason}
                          </div>
                        )}
                        {item.exclusionRecord && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-semibold mt-1">
                            Planner Exclusion: {item.exclusionRecord.reasonLabel} ({item.exclusionRecord.detail})
                          </div>
                        )}
                      </div>

                      {/* Status Chip */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isCollected && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ {item.status}
                          </span>
                        )}
                        {isScheduled && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {item.status} ({item.driverName || 'Van assigned'})
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            In Plan Pool
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            Rejected
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Shared Status Timeline */}
                    <div className="pt-2 border-t border-slate-100">
                      <DonationTimeline donation={item} events={eventLog} compact={true} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: Confirm Unverified Shop */}
      {unverifiedModalDonation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Have you verified this shop?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>{unverifiedModalDonation.providerName}</strong> is an <strong>unverified donor</strong> with no previous collections on Replate.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-bold">{unverifiedModalDonation.contactPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Surplus:</span>
                <span className="font-bold">{unverifiedModalDonation.confirmedPortions} portions {unverifiedModalDonation.foodItem}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Accepting will move this donation to Confirmed so it enters the collection planner pool. Please ensure you have confirmed their address and food condition.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setUnverifiedModalDonation(null)}
              >
                Cancel
              </Button>
              <Button
                id="btn-confirm-accept-unverified"
                variant="primary"
                size="md"
                onClick={() => executeAccept(unverifiedModalDonation)}
                icon={<Check className="w-4 h-4" />}
                className="font-bold"
              >
                Yes, Accept & Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject Donation */}
      {rejectModalDonation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Reject Surplus Donation
              </h3>
              <p className="text-xs text-slate-500">
                Provide a reason to notify <strong>{rejectModalDonation.providerName}</strong> on their tracking page.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Select Rejection Reason:</label>
              {[
                'Outside current collection service radius',
                'Unable to reach before safe pickup deadline',
                'Cargo van at full capacity for this meal slot',
                'Food safety storage window exceeded',
                'Custom',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    rejectionReason === reason
                      ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-semibold'
                      : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {rejectionReason === 'Custom' && (
                <textarea
                  value={customRejectionText}
                  onChange={(e) => setCustomRejectionText(e.target.value)}
                  placeholder="Explain why this surplus cannot be collected..."
                  className="w-full h-20 p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setRejectModalDonation(null)}
              >
                Cancel
              </Button>
              <Button
                id="btn-confirm-reject-donation"
                variant="danger"
                size="md"
                onClick={executeReject}
                className="font-bold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: View on Map */}
      {mapModalDonation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {mapModalDonation.providerName} Location
                </h3>
                <p className="text-xs text-slate-500">
                  {mapModalDonation.locationLandmark || 'GPS Coordinates'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapModalDonation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-80 bg-slate-100 relative"
            />

            {/* Footer with Google Maps Link & Close */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-500">
                {mapModalDonation.lat && mapModalDonation.lng ? (
                  <span>
                    Coords: {mapModalDonation.lat.toFixed(4)}, {mapModalDonation.lng.toFixed(4)}
                  </span>
                ) : (
                  <span>Landmark only (approximate location)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {mapModalDonation.lat && mapModalDonation.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapModalDonation.lat},${mapModalDonation.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Google Maps</span>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMapModalDonation(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
