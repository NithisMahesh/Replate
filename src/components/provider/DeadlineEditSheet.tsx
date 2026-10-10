import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../shared/BottomSheet';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';

interface DeadlineEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeadline: string; // e.g. "21:30"
  onSaveDeadline: (newTime24: string) => void;
}

export const DeadlineEditSheet: React.FC<DeadlineEditSheetProps> = ({
  isOpen,
  onClose,
  currentDeadline,
  onSaveDeadline,
}) => {
  const [time, setTime] = useState(currentDeadline || '21:30');
  const toast = useToast();

  useEffect(() => {
    if (currentDeadline) setTime(currentDeadline);
  }, [currentDeadline, isOpen]);

  const presets = ['21:00', '21:30', '22:00', '22:30', '23:00'];

  const formatDisplay = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const period = (h || 21) >= 12 ? 'PM' : 'AM';
    const hour = (h || 21) % 12 === 0 ? 12 : (h || 21) % 12;
    return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  const handleSave = () => {
    onSaveDeadline(time);
    toast.success(`Pickup deadline set to ${formatDisplay(time)}`);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Set Pickup Deadline"
      subtitle="Drivers must arrive and collect food before this time"
      footer={
        <Button
          variant="primary"
          size="md"
          fullWidth
          icon={<Check className="h-4 w-4" />}
          onClick={handleSave}
        >
          Update Deadline to {formatDisplay(time)}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Quick Presets</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTime(p)}
                className={`px-3 py-2 text-xs rounded-xl border font-semibold transition-colors duration-150 cursor-pointer min-h-[38px] ${
                  time === p
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {formatDisplay(p)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Custom Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
          />
        </div>
      </div>
    </BottomSheet>
  );
};
