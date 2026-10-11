import React, { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, Check, Edit2, Clock, Lock } from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { formatTime12 } from '../../utils/deadlineUtils';
import { MealSlot, MealSlotWindows, BillingConnection } from '../../types/surplusLink';
import { getCurrentMealSlot, getMealSlotLabel, DEFAULT_MEAL_SLOT_WINDOWS } from '../../utils/posAndPredictionUtils';
import { BillingStatusCard } from './BillingStatusCard';

export interface MealProductionData {
  preparedQty: number;
  preparationTime: string;
  closingTime: string;
}

interface MealProductionSectionProps {
  activeMealSlot: MealSlot;
  onSelectMealSlot: (slot: MealSlot) => void;
  mealSlotWindows?: MealSlotWindows;
  onUpdateWindows?: (windows: MealSlotWindows) => void;
  lastSavedQuantity: number;
  lastSavedPrepTime: string;
  lastSavedClosingTime: string;
  isSaved: boolean;
  isLocked?: boolean;
  onSave: (data: MealProductionData) => void;
  onEdit: () => void;
  disabled?: boolean;
  billingConnection?: BillingConnection;
  onConnectBilling?: () => void;
  onSyncBilling?: () => void;
}

const MEAL_SLOTS: { id: MealSlot; label: string; defaultWindow: string }[] = [
  { id: 'morning', label: 'Breakfast', defaultWindow: '06:00 – 10:00' },
  { id: 'afternoon', label: 'Lunch', defaultWindow: '12:00 – 15:00' },
  { id: 'night', label: 'Dinner', defaultWindow: '19:00 – 23:00' },
];

export const MealProductionSection: React.FC<MealProductionSectionProps> = ({
  activeMealSlot,
  onSelectMealSlot,
  mealSlotWindows = DEFAULT_MEAL_SLOT_WINDOWS,
  onUpdateWindows,
  lastSavedQuantity,
  lastSavedPrepTime,
  lastSavedClosingTime,
  isSaved,
  isLocked = false,
  onSave,
  onEdit,
  disabled = false,
  billingConnection,
  onConnectBilling,
  onSyncBilling,
}) => {
  const [quantityStr, setQuantityStr] = useState<string>(String(lastSavedQuantity || 80));
  const [prepTime, setPrepTime] = useState<string>(lastSavedPrepTime || '18:30');
  const [closingTime, setClosingTime] = useState<string>(lastSavedClosingTime || '21:30');
  const [errors, setErrors] = useState<{
    quantity?: string;
    prepTime?: string;
    closingTime?: string;
  }>({});

  const currentWindow = mealSlotWindows[activeMealSlot] || DEFAULT_MEAL_SLOT_WINDOWS[activeMealSlot];

  const currentMealSlot = getCurrentMealSlot(mealSlotWindows);
  const toast = useToast();

  // Sync state whenever meal slot or saved values change
  useEffect(() => {
    setQuantityStr(String(lastSavedQuantity || 80));
    setPrepTime(lastSavedPrepTime || (activeMealSlot === 'morning' ? '07:00' : activeMealSlot === 'afternoon' ? '12:30' : '18:30'));
    setClosingTime(lastSavedClosingTime || (activeMealSlot === 'morning' ? '10:00' : activeMealSlot === 'afternoon' ? '15:00' : '21:30'));
    setErrors({});
  }, [activeMealSlot, lastSavedQuantity, lastSavedPrepTime, lastSavedClosingTime]);

  const validate = (): boolean => {
    const newErrors: { quantity?: string; prepTime?: string; closingTime?: string } = {};

    // 1. Quantity validation
    if (!quantityStr.trim()) {
      newErrors.quantity = 'Portions prepared is required';
    } else {
      const q = Number(quantityStr);
      if (isNaN(q) || q <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }
    }

    // 2. Preparation time validation
    if (!prepTime.trim()) {
      newErrors.prepTime = 'Preparation time is required';
    }

    // 3. Closing time validation
    if (!closingTime.trim()) {
      newErrors.closingTime = 'Closing time is required';
    } else if (prepTime.trim()) {
      const [pH, pM] = prepTime.split(':').map(Number);
      const [cH, cM] = closingTime.split(':').map(Number);
      const prepMinutes = pH * 60 + (pM || 0);
      const closeMinutes = cH * 60 + (cM || 0);

      if (closeMinutes <= prepMinutes) {
        newErrors.closingTime = 'Closing time must be after preparation time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const qty = Number(quantityStr);
    onSave({
      preparedQty: qty,
      preparationTime: prepTime,
      closingTime,
    });
    toast.success(`${getMealSlotLabel(activeMealSlot)} production logged: ${qty} portions`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-150">
      {/* Compact Billing status card near top of Meal Production */}
      {onConnectBilling && onSyncBilling && (
        <BillingStatusCard
          billingConnection={billingConnection}
          onConnectBilling={onConnectBilling}
          onSyncBilling={onSyncBilling}
        />
      )}

      {/* 1. Meal Slot Segmented Control at top */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Select Meal Slot
          </label>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            Current time: <strong className="text-slate-800">{getMealSlotLabel(currentMealSlot)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60" role="tablist">
          {MEAL_SLOTS.map((slot) => {
            const isSelected = activeMealSlot === slot.id;
            const isCurrentClock = currentMealSlot === slot.id;
            const slotWindow = mealSlotWindows[slot.id] || DEFAULT_MEAL_SLOT_WINDOWS[slot.id];

            return (
              <button
                key={slot.id}
                type="button"
                id={`meal-slot-btn-${slot.id}`}
                onClick={() => onSelectMealSlot(slot.id)}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-150 relative cursor-pointer ${
                  isSelected
                    ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{slot.label}</span>
                  {isCurrentClock && (
                    <span
                      title="Current active meal by clock"
                      className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                    >
                      Now
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                  {slotWindow.start}–{slotWindow.end}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Read-only Time Window bar */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-600">
            {getMealSlotLabel(activeMealSlot)} window:
          </span>
          <span className="font-semibold text-slate-800 font-mono">
            {currentWindow.start} – {currentWindow.end}
          </span>
        </div>
      </div>

      {/* Production Form or Saved State */}
      {isSaved ? (
        <div className="bg-emerald-50/50 rounded-xl border border-emerald-200/70 p-4 transition-all duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300/80 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-wider uppercase text-emerald-800">
                  {getMealSlotLabel(activeMealSlot)} Production Logged
                </div>
                <p
                  id="meal-production-summary"
                  className="text-sm font-semibold text-slate-800 mt-0.5 tracking-tight"
                >
                  {getMealSlotLabel(activeMealSlot)}: {quantityStr || lastSavedQuantity} portions prepared at {formatTime12(prepTime || lastSavedPrepTime)}, closing {formatTime12(closingTime || lastSavedClosingTime)}.
                </p>
              </div>
            </div>
            {isLocked ? (
              <span
                id="locked-pickup-scheduled-note"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Locked: pickup scheduled</span>
              </span>
            ) : (
              <button
                type="button"
                id="edit-meal-production-btn"
                onClick={onEdit}
                disabled={disabled}
                className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 transition-colors duration-150 cursor-pointer self-start sm:self-auto flex items-center gap-1.5 shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
                <ChefHat className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {getMealSlotLabel(activeMealSlot)} Kitchen Output
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter portions prepared and service hours for {getMealSlotLabel(activeMealSlot).toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Quantity prepared */}
            <div className="space-y-1">
              <label htmlFor="meal-production-quantity" className="block text-xs font-semibold text-slate-700">
                Food Prepared <span className="font-normal text-slate-500">(portions)</span>
              </label>
              <input
                id="meal-production-quantity"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 80"
                value={quantityStr}
                disabled={disabled}
                onChange={(e) => {
                  setQuantityStr(e.target.value);
                  if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  errors.quantity
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
              {errors.quantity && (
                <p className="text-xs text-rose-600 font-medium mt-1 animate-in fade-in" id="error-meal-production-quantity">
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* 2. Preparation time */}
            <div className="space-y-1">
              <label htmlFor="meal-production-preptime" className="block text-xs font-semibold text-slate-700">
                Preparation Time
              </label>
              <input
                id="meal-production-preptime"
                type="time"
                value={prepTime}
                disabled={disabled}
                onChange={(e) => {
                  setPrepTime(e.target.value);
                  if (errors.prepTime) setErrors((prev) => ({ ...prev, prepTime: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  errors.prepTime
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
              {errors.prepTime && (
                <p className="text-xs text-rose-600 font-medium mt-1 animate-in fade-in" id="error-meal-production-preptime">
                  {errors.prepTime}
                </p>
              )}
            </div>

            {/* 3. Closing time */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="meal-production-closingtime" className="block text-xs font-semibold text-slate-700">
                  Closing Time
                </label>
                <span className="text-[10px] text-slate-400">Per provider</span>
              </div>
              <input
                id="meal-production-closingtime"
                type="time"
                value={closingTime}
                disabled={disabled}
                onChange={(e) => {
                  setClosingTime(e.target.value);
                  if (errors.closingTime) setErrors((prev) => ({ ...prev, closingTime: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  errors.closingTime
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
              {errors.closingTime && (
                <p className="text-xs text-rose-600 font-medium mt-1 animate-in fade-in" id="error-meal-production-closingtime">
                  {errors.closingTime}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Values update {getMealSlotLabel(activeMealSlot).toLowerCase()}&apos;s surplus estimate and collection deadline.
            </p>
            <Button
              type="submit"
              id="save-meal-production-btn"
              variant="primary"
              size="md"
              disabled={disabled}
              icon={<Check className="h-4 w-4" />}
            >
              Save {getMealSlotLabel(activeMealSlot)}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
