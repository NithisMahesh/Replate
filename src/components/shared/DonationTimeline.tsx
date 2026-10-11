import React from 'react';
import { FoodDonation, EventLogEntry, DonationStatus } from '../../types/surplusLink';
import {
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  HeartHandshake,
  AlertTriangle,
  XCircle,
  FileCheck2,
} from 'lucide-react';

interface DonationTimelineProps {
  donation: FoodDonation;
  events?: EventLogEntry[];
  compact?: boolean;
}

interface TimelineStep {
  key: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'alert';
  timestamp?: string;
  actor?: string;
  detail?: string;
  icon: React.ReactNode;
}

export const DonationTimeline: React.FC<DonationTimelineProps> = ({
  donation,
  events = [],
  compact = false,
}) => {
  // Filter events relevant to this donation
  const donEvents = events.filter(
    (e) => e.donationId === donation.id || (donation.scheduledCollectionId && e.collectionId === donation.scheduledCollectionId)
  );

  const getEventTime = (type: string): string | undefined => {
    const found = donEvents.find((e) => e.type === type);
    if (found) {
      try {
        return new Date(found.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return found.time;
      }
    }
    return undefined;
  };

  const getEventActor = (type: string): string | undefined => {
    const found = donEvents.find((e) => e.type === type);
    return found?.actor;
  };

  const status = donation.status;
  const isFailed = status === 'Failed';
  const isExpired = status === 'Expired';
  const isCancelled = status === 'Cancelled';
  const isExcluded = Boolean(donation.exclusionRecord);

  // Determine stage progress
  // 1: Confirmed / Submitted
  // 2: Scheduled
  // 3: Collected
  // 4: Received
  // 5: Distributed
  const stepRank: Record<DonationStatus, number> = {
    Draft: 0,
    Submitted: 1,
    Confirmed: 1,
    Scheduled: 2,
    'En route': 2,
    Arrived: 2,
    Collected: 3,
    Received: 4,
    Distributed: 5,
    Failed: 2,
    Cancelled: 1,
    Rejected: 1,
    Expired: 1,
  };

  const currentRank = stepRank[status] || 1;

  const confirmedTime = getEventTime('Confirmed') || getEventTime('Submitted') || (donation.createdAt ? new Date(donation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined);
  const scheduledTime = getEventTime('Scheduled') || donation.estimatedPickupTime;
  const collectedTime = getEventTime('Collected') || (donation.collectedAt ? new Date(donation.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined);
  const receivedTime = getEventTime('Received') || (donation.receivedAt ? new Date(donation.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined);
  const distributedTime = getEventTime('Distributed') || (donation.distributedAt ? new Date(donation.distributedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined);

  const steps: TimelineStep[] = [
    {
      key: 'confirmed',
      label: donation.source === 'qr_form' ? 'Submitted' : 'Confirmed',
      status: currentRank >= 1 ? 'completed' : 'upcoming',
      timestamp: confirmedTime,
      actor: getEventActor('Confirmed') || donation.providerName,
      detail: `${donation.confirmedPortions} portions`,
      icon: <FileCheck2 className="w-3.5 h-3.5" />,
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      status:
        currentRank > 2
          ? 'completed'
          : currentRank === 2 && !isFailed
          ? 'current'
          : isFailed
          ? 'alert'
          : 'upcoming',
      timestamp: scheduledTime,
      actor: getEventActor('Scheduled') || donation.driverName || 'NGO Dispatch',
      detail: donation.scheduledTripNumber ? `Trip #${donation.scheduledTripNumber}` : undefined,
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    {
      key: 'collected',
      label: 'Collected',
      status:
        currentRank > 3
          ? 'completed'
          : currentRank === 3
          ? 'current'
          : 'upcoming',
      timestamp: collectedTime,
      actor: donation.driverName || 'Driver',
      detail:
        donation.collectedPortions !== undefined
          ? `${donation.collectedPortions} portions${
              donation.collectedPortions < donation.confirmedPortions
                ? ` (${donation.confirmedPortions - donation.collectedPortions} short)`
                : ''
            }`
          : undefined,
      icon: <Truck className="w-3.5 h-3.5" />,
    },
    {
      key: 'received',
      label: 'Received',
      status:
        currentRank > 4
          ? 'completed'
          : currentRank === 4
          ? 'current'
          : 'upcoming',
      timestamp: receivedTime,
      actor: 'Annam Seva Depot',
      detail:
        donation.receivedPortions !== undefined
          ? `${donation.receivedPortions} portions at hub`
          : undefined,
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      key: 'distributed',
      label: 'Distributed',
      status: currentRank === 5 ? 'completed' : 'upcoming',
      timestamp: distributedTime,
      actor: 'Community Feeding',
      detail:
        donation.distributedPortions !== undefined
          ? `${donation.distributedPortions} meals served`
          : undefined,
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
    },
  ];

  // Compact badge mode (for tables or dense lists)
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {steps.map((st, idx) => {
          const isDone = st.status === 'completed';
          const isCurr = st.status === 'current';
          const isAlert = st.status === 'alert';
          return (
            <React.Fragment key={st.key}>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                  isDone
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : isCurr
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : isAlert
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-100 text-slate-400 border border-slate-200/60'
                }`}
                title={`${st.label}${st.timestamp ? ` (${st.timestamp})` : ''}`}
              >
                {st.icon}
                <span>{st.label}</span>
              </span>
              {idx < steps.length - 1 && (
                <span
                  className={`text-[9px] ${
                    isDone ? 'text-emerald-500 font-bold' : 'text-slate-300'
                  }`}
                >
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Donation Status Timeline</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
            {donation.status}
          </span>
        </div>
        {donation.verificationOtp && (
          <span className="text-[11px] text-slate-500 font-mono">
            OTP: <strong className="text-slate-900">{donation.verificationOtp}</strong>
          </span>
        )}
      </div>

      {/* Terminal Alert States */}
      {isFailed && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Collection Failed:</strong> {donation.failureReason || 'Driver was unable to collect surplus'}. Eligible for re-planning.
          </span>
        </div>
      )}

      {isExpired && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Freshness Window Expired:</strong> Collection deadline ({donation.collectionDeadline}) elapsed.
          </span>
        </div>
      )}

      {isCancelled && (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span>This donation was cancelled by the provider.</span>
        </div>
      )}

      {isExcluded && (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Held by Route Planner: {donation.exclusionRecord?.reasonLabel}</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            {donation.exclusionRecord?.detail}
          </p>
        </div>
      )}

      {/* Horizontal Step Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {steps.map((st, idx) => {
          const isDone = st.status === 'completed';
          const isCurr = st.status === 'current';
          const isAlert = st.status === 'alert';
          const isUp = st.status === 'upcoming';

          return (
            <div
              key={st.key}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs'
                  : isCurr
                  ? 'bg-amber-50 border-amber-300 text-amber-950 ring-1 ring-amber-400/30'
                  : isAlert
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-white/60 border-slate-200/60 text-slate-400 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white font-bold'
                        : isCurr
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : isAlert
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {st.timestamp && (
                    <span className="text-[10px] font-mono font-medium text-slate-500 truncate">
                      {st.timestamp}
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs truncate">
                  {st.label}
                </div>
              </div>

              <div className="mt-2 text-[10px] leading-tight space-y-0.5">
                {st.actor && (
                  <div className="font-medium text-slate-600 truncate">
                    {st.actor}
                  </div>
                )}
                {st.detail && (
                  <div
                    className={`font-semibold truncate ${
                      isDone ? 'text-emerald-800' : isCurr ? 'text-amber-800' : 'text-slate-500'
                    }`}
                  >
                    {st.detail}
                  </div>
                )}
                {isUp && !st.detail && (
                  <div className="text-slate-400 italic">Pending</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
