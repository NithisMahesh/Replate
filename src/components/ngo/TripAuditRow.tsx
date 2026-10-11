import React, { useState, useEffect } from 'react';
import { Collection } from '../../types/surplusLink';
import { CollectionTotals } from '../../selectors';
import { Package, HeartHandshake, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';

interface TripAuditRowProps {
  collection: Collection;
  totals: CollectionTotals;
  onRecordReceived: (collectionId: string, qty: number) => void;
  onRecordDistributed: (collectionId: string, qty: number, notes?: string) => void;
}

export const TripAuditRow: React.FC<TripAuditRowProps> = ({
  collection,
  totals,
  onRecordReceived,
  onRecordDistributed,
}) => {
  const toast = useToast();
  const [receivedVal, setReceivedVal] = useState<number>(
    totals.totalReceivedPortions || totals.totalCollectedPortions
  );
  const [distributedVal, setDistributedVal] = useState<number>(
    totals.totalDistributedPortions || totals.totalReceivedPortions || totals.totalCollectedPortions
  );
  const [isSaved, setIsSaved] = useState(false);

  // Keep local state in sync when shared totals update
  useEffect(() => {
    setReceivedVal(totals.totalReceivedPortions || totals.totalCollectedPortions);
    setDistributedVal(
      totals.totalDistributedPortions || totals.totalReceivedPortions || totals.totalCollectedPortions
    );
  }, [totals.totalReceivedPortions, totals.totalDistributedPortions, totals.totalCollectedPortions]);

  const maxReceived = totals.totalCollectedPortions;
  const maxDistributed = receivedVal;

  const isReceivedOver = receivedVal > maxReceived;
  const isDistributedOver = distributedVal > maxDistributed;
  const isValid = !isReceivedOver && !isDistributedOver;

  const receivedShortfall = Math.max(0, maxReceived - receivedVal);
  const distributedShortfall = Math.max(0, receivedVal - distributedVal);

  const hasReceived = totals.totalReceivedPortions > 0;
  const hasDistributed = totals.totalDistributedPortions > 0;

  const handleSave = () => {
    if (!isValid) return;
    onRecordReceived(collection.id, receivedVal);
    onRecordDistributed(collection.id, distributedVal);
    setIsSaved(true);
    toast.success(`Saved receipt (${receivedVal}) & distribution (${distributedVal}) for Trip #${collection.tripNumber}`);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
            T{collection.tripNumber}
          </span>
          <span className="font-semibold text-slate-900 text-sm">Trip #{collection.tripNumber}</span>
          <span className="text-slate-500">• Driver: {collection.driver.name}</span>
        </div>
        <span className="text-xs text-slate-500">
          Collected: <strong className="text-emerald-700">{totals.totalCollectedPortions} portions</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Input 1: Received */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-slate-700 font-semibold text-xs flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-amber-600" />
              <span>1. Quantity Received at Hub</span>
            </label>
            {receivedShortfall > 0 && !isReceivedOver && (
              <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                {receivedShortfall} portion{receivedShortfall === 1 ? '' : 's'} short
              </span>
            )}
          </div>
          <input
            type="number"
            min="0"
            max={maxReceived}
            value={receivedVal}
            onChange={(e) => setReceivedVal(Math.max(0, parseInt(e.target.value) || 0))}
            className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 text-slate-900 ${
              isReceivedOver ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-emerald-500'
            }`}
          />
          {isReceivedOver && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Cannot exceed collected count ({maxReceived} portions)
            </p>
          )}
        </div>

        {/* Input 2: Distributed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-slate-700 font-semibold text-xs flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
              <span>2. Quantity Distributed to Beneficiaries</span>
            </label>
            {distributedShortfall > 0 && !isDistributedOver && (
              <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                {distributedShortfall} portion{distributedShortfall === 1 ? '' : 's'} short
              </span>
            )}
          </div>
          <input
            type="number"
            min="0"
            max={maxDistributed}
            value={distributedVal}
            onChange={(e) => setDistributedVal(Math.max(0, parseInt(e.target.value) || 0))}
            className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 text-slate-900 ${
              isDistributedOver ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-emerald-500'
            }`}
          />
          {isDistributedOver && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Cannot exceed received count ({maxDistributed} portions)
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">
          {hasDistributed ? 'Audit updated' : hasReceived ? 'Awaiting meal distribution' : 'Awaiting depot intake'}
        </span>
        <Button
          variant="primary"
          size="sm"
          disabled={!isValid}
          icon={isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : undefined}
          onClick={handleSave}
        >
          {isSaved ? 'Saved!' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
};
