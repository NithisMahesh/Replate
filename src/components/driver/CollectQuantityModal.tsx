import React, { useState } from 'react';
import { DerivedStop } from '../../selectors';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { BottomSheet } from '../shared/BottomSheet';
import { Button } from '../shared/Button';

interface CollectQuantityModalProps {
  stop: DerivedStop;
  onConfirm: (actualQty: number) => void;
  onClose: () => void;
}

export const CollectQuantityModal: React.FC<CollectQuantityModalProps> = ({
  stop,
  onConfirm,
  onClose,
}) => {
  const [actualQty, setActualQty] = useState<number>(stop.confirmedPortions);
  const discrepancy = actualQty - stop.confirmedPortions;

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title="Confirm Collection"
      subtitle={`Stop #${stop.stopOrder}: ${stop.provider.name}`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={() => onConfirm(actualQty)}
          >
            Record Collection
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
          <div className="text-slate-600">
            Food Item: <strong className="text-slate-900">{stop.donation.foodItem}</strong>
          </div>
          <div className="text-slate-600">
            Confirmed Portions: <strong className="text-emerald-700">{stop.confirmedPortions} portions</strong>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            Actual Portions Picked Up *
          </label>
          <input
            type="number"
            min="0"
            max="200"
            value={actualQty}
            onChange={(e) => setActualQty(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2.5 text-base font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
          />
          <p className="text-xs text-slate-500">
            Enter the count loaded into the cargo van. If it differs from confirmed, a discrepancy will be logged.
          </p>
        </div>

        {/* Discrepancy Warning */}
        {discrepancy !== 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Discrepancy: {discrepancy > 0 ? `+${discrepancy}` : discrepancy} portions</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              The driver count differs from the kitchen's confirmed quantity. This will be recorded on the manifest and flagged in the audit logs.
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
