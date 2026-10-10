import React, { useState } from 'react';
import { DerivedStop } from '../../selectors';
import { AlertCircle, XCircle } from 'lucide-react';
import { BottomSheet } from '../shared/BottomSheet';
import { Button } from '../shared/Button';

interface PickupFailedModalProps {
  stop: DerivedStop;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const FAILURE_REASONS = [
  'Kitchen closed early before van arrival',
  'Food spoiled or temperature safety violated',
  'Quantity zero / consumed unexpectedly on premise',
  'Premises inaccessible / locked gate',
  'Verification OTP mismatch',
  'Other custom reason',
];

export const PickupFailedModal: React.FC<PickupFailedModalProps> = ({
  stop,
  onConfirm,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState(FAILURE_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other custom reason'
      ? (customReason.trim() || 'Unspecified failure')
      : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title="Report Failed Pickup"
      subtitle={`Stop #${stop.stopOrder}: ${stop.provider.name}`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            icon={<XCircle className="h-4 w-4" />}
            onClick={handleConfirm}
          >
            Confirm Failure
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <p className="text-xs text-slate-600 leading-relaxed">
          Please select why the van was unable to collect this surplus. Marking failed releases van capacity and notifies the kitchen.
        </p>

        {/* Reason Chips */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">Reason *</label>
          <div className="flex flex-wrap gap-2">
            {FAILURE_REASONS.map((r) => {
              const isSelected = selectedReason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedReason(r)}
                  className={`px-3 py-2 text-xs rounded-xl border text-left font-medium transition-colors duration-150 cursor-pointer min-h-[38px] ${
                    isSelected
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {selectedReason === 'Other custom reason' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Detailed Notes</label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Explain the specific obstacle..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>
        )}

        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Capacity Release Notice</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            {stop.confirmedPortions} portions will be unassigned. The remaining route stops continue as planned.
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};
