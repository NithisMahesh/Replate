import React, { useState, useEffect } from 'react';
import { Clock, Check, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { MealSlot, MealSlotWindows, Provider } from '../../types/surplusLink';

interface MealWindowsCardProps {
  provider: Provider;
  onSave: (windows: MealSlotWindows) => void;
}

function normalizeTime(t: string | undefined, fallback: string): string {
  if (!t) return fallback;
  const parts = t.trim().split(':');
  if (parts.length < 2) return fallback;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

function timeToMinutes(t: string): number {
  if (!t) return -1;
  const [h, m] = t.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
}

export const MealWindowsCard: React.FC<MealWindowsCardProps> = ({ provider, onSave }) => {
  const toast = useToast();

  const [windows, setWindows] = useState<MealSlotWindows>(() => ({
    morning: {
      start: normalizeTime(provider.mealSlotWindows?.morning?.start, '06:00'),
      end: normalizeTime(provider.mealSlotWindows?.morning?.end, '10:00'),
    },
    afternoon: {
      start: normalizeTime(provider.mealSlotWindows?.afternoon?.start, '12:00'),
      end: normalizeTime(provider.mealSlotWindows?.afternoon?.end, '15:00'),
    },
    night: {
      start: normalizeTime(provider.mealSlotWindows?.night?.start, '19:00'),
      end: normalizeTime(provider.mealSlotWindows?.night?.end, '23:00'),
    },
  }));

  const [rowErrors, setRowErrors] = useState<Record<MealSlot, string | undefined>>({
    morning: undefined,
    afternoon: undefined,
    night: undefined,
  });
  const [overlapError, setOverlapError] = useState<string | undefined>(undefined);

  // Sync state if provider changes
  useEffect(() => {
    setWindows({
      morning: {
        start: normalizeTime(provider.mealSlotWindows?.morning?.start, '06:00'),
        end: normalizeTime(provider.mealSlotWindows?.morning?.end, '10:00'),
      },
      afternoon: {
        start: normalizeTime(provider.mealSlotWindows?.afternoon?.start, '12:00'),
        end: normalizeTime(provider.mealSlotWindows?.afternoon?.end, '15:00'),
      },
      night: {
        start: normalizeTime(provider.mealSlotWindows?.night?.start, '19:00'),
        end: normalizeTime(provider.mealSlotWindows?.night?.end, '23:00'),
      },
    });
    setRowErrors({ morning: undefined, afternoon: undefined, night: undefined });
    setOverlapError(undefined);
  }, [provider.id, provider.mealSlotWindows]);

  const validate = (currentWindows: MealSlotWindows) => {
    const newRowErrors: Record<MealSlot, string | undefined> = {
      morning: undefined,
      afternoon: undefined,
      night: undefined,
    };
    let newOverlapError: string | undefined = undefined;

    const slots: { id: MealSlot; name: string }[] = [
      { id: 'morning', name: 'Breakfast' },
      { id: 'afternoon', name: 'Lunch' },
      { id: 'night', name: 'Dinner' },
    ];

    // 1. Validate start before end for each row
    for (const s of slots) {
      const w = currentWindows[s.id];
      if (!w.start || !w.end) {
        newRowErrors[s.id] = `${s.name} start and end times are required`;
      } else {
        const startMin = timeToMinutes(w.start);
        const endMin = timeToMinutes(w.end);
        if (startMin >= endMin) {
          newRowErrors[s.id] = `${s.name} start time must be before end time`;
        }
      }
    }

    // 2. Validate non-overlapping windows across all pairs
    const hasRowErr = Object.values(newRowErrors).some(Boolean);
    if (!hasRowErr) {
      const slotList = slots.map((s) => ({
        id: s.id,
        name: s.name,
        start: timeToMinutes(currentWindows[s.id].start),
        end: timeToMinutes(currentWindows[s.id].end),
      }));

      for (let i = 0; i < slotList.length; i++) {
        for (let j = i + 1; j < slotList.length; j++) {
          const a = slotList[i];
          const b = slotList[j];
          // Two intervals overlap if max(a.start, b.start) < min(a.end, b.end)
          if (a.start < b.end && b.start < a.end) {
            newOverlapError = `Windows cannot overlap: ${a.name} (${currentWindows[a.id].start}–${currentWindows[a.id].end}) and ${b.name} (${currentWindows[b.id].start}–${currentWindows[b.id].end}) overlap.`;
            break;
          }
        }
        if (newOverlapError) break;
      }
    }

    setRowErrors(newRowErrors);
    setOverlapError(newOverlapError);
    return !hasRowErr && !newOverlapError;
  };

  const handleChange = (slot: MealSlot, field: 'start' | 'end', value: string) => {
    const updated = {
      ...windows,
      [slot]: {
        ...windows[slot],
        [field]: value,
      },
    };
    setWindows(updated);
    validate(updated);
  };

  const handleSave = () => {
    if (!validate(windows)) {
      toast.error('Please fix window validation errors before saving');
      return;
    }
    onSave(windows);
    toast.success('Meal windows saved successfully');
  };

  const mealRows: { id: MealSlot; name: string; defaultRange: string }[] = [
    { id: 'morning', name: 'Breakfast', defaultRange: '6:00 – 10:00' },
    { id: 'afternoon', name: 'Lunch', defaultRange: '12:00 – 15:00' },
    { id: 'night', name: 'Dinner', defaultRange: '19:00 – 23:00' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Meal windows</h3>
            <p className="text-xs text-slate-500">
              Set standard service windows for each meal. Used for surplus timing and Today highlights.
            </p>
          </div>
        </div>
      </div>

      {overlapError && (
        <div
          id="meal-windows-overlap-error"
          className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{overlapError}</span>
        </div>
      )}

      <div className="space-y-3.5">
        {mealRows.map((row) => {
          const rowErr = rowErrors[row.id];
          return (
            <div
              key={row.id}
              className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{row.name}</span>
                <span className="text-[10px] text-slate-400">Default: {row.defaultRange}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor={`meal-window-${row.id}-start`}
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Start Time
                  </label>
                  <input
                    id={`meal-window-${row.id}-start`}
                    type="time"
                    value={windows[row.id].start}
                    onChange={(e) => handleChange(row.id, 'start', e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-lg border bg-white text-slate-900 focus:outline-hidden focus:ring-2 ${
                      rowErr || overlapError
                        ? 'border-rose-300 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`meal-window-${row.id}-end`}
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    End Time
                  </label>
                  <input
                    id={`meal-window-${row.id}-end`}
                    type="time"
                    value={windows[row.id].end}
                    onChange={(e) => handleChange(row.id, 'end', e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-lg border bg-white text-slate-900 focus:outline-hidden focus:ring-2 ${
                      rowErr || overlapError
                        ? 'border-rose-300 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {rowErr && (
                <p
                  id={`error-meal-window-${row.id}`}
                  className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{rowErr}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="button"
          id="save-meal-windows-btn"
          variant="primary"
          size="md"
          icon={<Check className="w-4 h-4" />}
          onClick={handleSave}
        >
          Save Meal Windows
        </Button>
      </div>
    </div>
  );
};
