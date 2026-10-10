import React, { useState } from 'react';
import { Collection } from '../../types/surplusLink';
import { CollectionTotals } from '../../selectors';
import { Package, HeartHandshake, CheckCircle2 } from 'lucide-react';
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

  const hasReceived = totals.totalReceivedPortions > 0;
  const hasDistributed = totals.totalDistributedPortions > 0;

  const handleSave = () => {
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
          <label className="block text-slate-700 font-semibold text-xs flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-amber-600" />
            <span>1. Quantity Received at Hub</span>
          </label>
          <input
            type="number"
            min="0"
            value={receivedVal}
            onChange={(e) => setReceivedVal(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>

        {/* Input 2: Distributed */}
        <div className="space-y-1.5">
          <label className="block text-slate-700 font-semibold text-xs flex items-center gap-1.5">
            <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
            <span>2. Quantity Distributed to Beneficiaries</span>
          </label>
          <input
            type="number"
            min="0"
            value={distributedVal}
            onChange={(e) => setDistributedVal(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">
          {hasDistributed ? 'Audit updated' : hasReceived ? 'Awaiting meal distribution' : 'Awaiting depot intake'}
        </span>
        <Button
          variant="primary"
          size="sm"
          icon={isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : undefined}
          onClick={handleSave}
        >
          {isSaved ? 'Saved!' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
};
