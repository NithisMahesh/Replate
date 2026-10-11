import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../shared/BottomSheet';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { MealSlot } from '../../types/surplusLink';
import { MEAL_SLOT_LABELS } from '../../utils/posAndPredictionUtils';

interface DeadlineEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeadline: string; // e.g. "21:30"
  onSaveDeadline: (newTime24: string) => void;
  mealSlot?: MealSlot;
  window?: { start: string; end: string };
}

export const DeadlineEditSheet: React.FC<DeadlineEditSheetProps> = ({
  isOpen,
  onClose,
  currentDeadline,
  onSaveDeadline,
  mealSlot = 'night',
  window,
}) => {
  const mealLabel = MEAL_SLOT_LABELS[mealSlot] || 'Dinner';
  const defaultDeadline = mealSlot === 'morning' ? '10:00' : mealSlot === 'afternoon' ? '15:00' : '21:30';
  const [time, setTime] = useState(currentDeadline || defaultDeadline);
  const toast = useToast();

  useEffect(() => {
    if (currentDeadline) {
      setTime(currentDeadline);
    } else {
      setTime(defaultDeadline);
    }
  }, [currentDeadline, isOpen, defaultDeadline]);

  const presets =
    mealSlot === 'morning'
      ? ['08:30', '09:00', '09:30', '10:00', '10:30']
      : mealSlot === 'afternoon'
      ? ['13:30', '14:00', '14:30', '15:00', '15:30']
      : ['21:00', '21:30', '22:00', '22:30', '23:00'];

  const formatDisplay = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const period = (h || 21) >= 12 ? 'PM' : 'AM';
    const hour = (h || 21) % 12 === 0 ? 12 : (h || 21) % 12;
    return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  const handleSave = () => {
    onSaveDeadline(time);
    toast.success(`Pickup deadline for ${mealLabel} set to ${formatDisplay(time)}`);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Set ${mealLabel} Pickup Deadline`}
      subtitle={`Drivers must arrive and collect ${mealLabel.toLowerCase()} food before this time`}
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
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono text-slate-900 bg-white"
          />
        </div>
      </div>
    </BottomSheet>
  );
};
