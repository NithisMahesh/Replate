import React from 'react';
import { DerivedStop } from '../../selectors';
import { StopProgressStatus } from '../../types/surplusLink';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
} from 'lucide-react';

interface DriverStopCardProps {
  stop: DerivedStop;
  onUpdateStatus: (donationId: string, status: StopProgressStatus) => void;
  onOpenCollectModal: (stop: DerivedStop) => void;
  onOpenFailModal: (stop: DerivedStop) => void;
}

export const DriverStopCard: React.FC<DriverStopCardProps> = ({
  stop,
  onUpdateStatus,
  onOpenCollectModal,
  onOpenFailModal,
}) => {
  const isPending = stop.status === 'Pending';
  const isEnRoute = stop.status === 'En route';
  const isArrived = stop.status === 'Arrived';
  const isCollected = stop.status === 'Collected';
  const isFailed = stop.status === 'Failed';

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all space-y-4 ${
        isCollected
          ? 'bg-emerald-50/50 border-emerald-200'
          : isFailed
          ? 'bg-red-50/40 border-red-200'
          : isArrived
          ? 'bg-sky-50/40 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
          : isEnRoute
          ? 'bg-amber-50/40 border-amber-300'
          : 'bg-white border-slate-200 shadow-2xs'
      }`}
    >
      {/* Top Bar: Stop Index, Provider & Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              isCollected
                ? 'bg-emerald-600 text-white'
                : isFailed
                ? 'bg-red-600 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            #{stop.stopOrder}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{stop.provider.name}</h4>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {stop.provider.type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-slate-400" />
              {stop.provider.address}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              isCollected
                ? 'bg-emerald-100 text-emerald-800'
                : isFailed
                ? 'bg-red-100 text-red-800'
                : isArrived
                ? 'bg-sky-100 text-sky-800'
                : isEnRoute
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isCollected && <CheckCircle2 className="h-3.5 w-3.5" />}
            {isFailed && <XCircle className="h-3.5 w-3.5" />}
            {isArrived && <MapPin className="h-3.5 w-3.5" />}
            {isEnRoute && <Truck className="h-3.5 w-3.5" />}
            {stop.status}
          </span>
        </div>
      </div>

      {/* Food Surplus Manifest */}
      <div className="bg-white/80 border border-slate-200/80 rounded-lg p-3 text-xs space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-800">{stop.donation.foodItem}</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            {stop.confirmedPortions} portions
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            Pickup Deadline: <strong className="text-slate-700">{stop.donation.collectionDeadline}</strong>
          </span>
          <span className="flex items-center gap-1 font-mono text-slate-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verification OTP: <strong className="text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">{stop.donation.verificationOtp}</strong>
          </span>
        </div>
      </div>

      {/* Discrepancy or Failure Notes */}
      {isCollected && (
        <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
          <span className="text-emerald-900">
            Actual Picked Up: <strong>{stop.actualPortionsPickedUp} portions</strong>
          </span>
          {stop.portionsDiscrepancy !== 0 && (
            <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
              Discrepancy: {stop.portionsDiscrepancy > 0 ? `+${stop.portionsDiscrepancy}` : stop.portionsDiscrepancy}
            </span>
          )}
        </div>
      )}

      {isFailed && (
        <div className="text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1 font-bold">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            Collection Failed: {stop.failedReason}
          </div>
          <p className="text-[11px] text-red-600">
            Provider and NGO notified. Remaining stops remain on schedule.
          </p>
        </div>
      )}

      {/* Action Buttons for Active States */}
      {!isCollected && !isFailed && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {isPending && (
              <button
                type="button"
                onClick={() => onUpdateStatus(stop.donationId, 'En route')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Truck className="h-3.5 w-3.5" />
                Start En Route
              </button>
            )}
            {isEnRoute && (
              <button
                type="button"
                onClick={() => onUpdateStatus(stop.donationId, 'Arrived')}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="h-3.5 w-3.5" />
                Mark Arrived
              </button>
            )}
            {isArrived && (
              <button
                type="button"
                onClick={() => onOpenCollectModal(stop)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Collected
              </button>
            )}
          </div>

          {/* Mark Failed Option */}
          <button
            type="button"
            onClick={() => onOpenFailModal(stop)}
            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <XCircle className="h-3 w-3" />
            Mark Pickup Failed
          </button>
        </div>
      )}
    </div>
  );
};
