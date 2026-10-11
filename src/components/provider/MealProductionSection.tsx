import React, { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, Check, Edit2, Clock, Lock, Sunrise, Sun, Moon, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';
import { formatTime12 } from '../../utils/deadlineUtils';
import { MealSlot, MealSlotWindows, BillingConnection } from '../../types/surplusLink';
import {
  getCurrentMealSlot,
  getMealSlotLabel,
  MEAL_SLOT_LABELS,
  DEFAULT_MEAL_SLOT_WINDOWS,
} from '../../utils/posAndPredictionUtils';
import { BillingStatusCard } from './BillingStatusCard';

export type MealSlotStatus = 'Not started' | 'Saved' | 'Confirmed' | 'Scheduled' | 'Locked';

export interface MealProductionData {
  preparedQty: number;
  preparationTime: string;
  closingTime: string;
}

export interface MealSlotDraft {
  quantityStr: string;
  prepTime: string;
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
  slotStatuses?: Record<MealSlot, MealSlotStatus>;
}

const MEAL_SLOTS: { id: MealSlot; defaultWindow: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'morning',   defaultWindow: '06:00 – 10:00', Icon: Sunrise },
  { id: 'afternoon', defaultWindow: '12:00 – 15:00', Icon: Sun },
  { id: 'night',     defaultWindow: '19:00 – 23:00', Icon: Moon },
];

// Status chip appearance — icon + colour so colour is never the only signal
const SLOT_STATUS_META: Record<MealSlotStatus, { label: string; dot: string; text: string; bg: string; border: string; icon: string }> = {
  'Not started': { label: 'Not started', icon: '○',  bg: 'bg-slate-100',     text: 'text-slate-500',   border: 'border-slate-200',   dot: '' },
  'Saved':       { label: 'Saved',       icon: '✓',  bg: 'bg-sky-100',       text: 'text-sky-800',     border: 'border-sky-300',     dot: '' },
  'Confirmed':   { label: 'Confirmed',   icon: '✓',  bg: 'bg-emerald-100',   text: 'text-emerald-800', border: 'border-emerald-300', dot: '' },
  'Scheduled':   { label: 'Scheduled',   icon: '↻',  bg: 'bg-blue-100',      text: 'text-blue-800',    border: 'border-blue-300',    dot: '' },
  'Locked':      { label: 'Locked',      icon: '🔒', bg: 'bg-slate-200',     text: 'text-slate-700',   border: 'border-slate-300',   dot: '' },
};

function getDefaultDraftForSlot(
  slot: MealSlot,
  windows: MealSlotWindows,
  savedValues?: { quantity?: number; prepTime?: string; closingTime?: string }
): MealSlotDraft {
  const win = windows[slot] || DEFAULT_MEAL_SLOT_WINDOWS[slot];
  const defaultQuantity = slot === 'morning' ? '60' : slot === 'afternoon' ? '90' : '80';
  const defaultPrep = slot === 'morning' ? '07:00' : slot === 'afternoon' ? '12:30' : '19:30';
  const defaultClose = win.end;

  return {
    quantityStr: savedValues?.quantity ? String(savedValues.quantity) : defaultQuantity,
    prepTime: savedValues?.prepTime || defaultPrep,
    closingTime: savedValues?.closingTime || defaultClose,
  };
}

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
  slotStatuses,
}) => {
  const [drafts, setDrafts] = useState<Record<MealSlot, MealSlotDraft>>(() => ({
    morning: getDefaultDraftForSlot('morning', mealSlotWindows, {
      quantity: activeMealSlot === 'morning' && isSaved ? lastSavedQuantity : undefined,
      prepTime: activeMealSlot === 'morning' && isSaved ? lastSavedPrepTime : undefined,
      closingTime: activeMealSlot === 'morning' && isSaved ? lastSavedClosingTime : undefined,
    }),
    afternoon: getDefaultDraftForSlot('afternoon', mealSlotWindows, {
      quantity: activeMealSlot === 'afternoon' && isSaved ? lastSavedQuantity : undefined,
      prepTime: activeMealSlot === 'afternoon' && isSaved ? lastSavedPrepTime : undefined,
      closingTime: activeMealSlot === 'afternoon' && isSaved ? lastSavedClosingTime : undefined,
    }),
    night: getDefaultDraftForSlot('night', mealSlotWindows, {
      quantity: activeMealSlot === 'night' && isSaved ? lastSavedQuantity : undefined,
      prepTime: activeMealSlot === 'night' && isSaved ? lastSavedPrepTime : undefined,
      closingTime: activeMealSlot === 'night' && isSaved ? lastSavedClosingTime : undefined,
    }),
  }));

  const [errors, setErrors] = useState<{ quantity?: string; prepTime?: string; closingTime?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentWindow = mealSlotWindows[activeMealSlot] || DEFAULT_MEAL_SLOT_WINDOWS[activeMealSlot];
  const currentMealSlot = getCurrentMealSlot(mealSlotWindows);
  const toast = useToast();
  const mealLabel = MEAL_SLOT_LABELS[activeMealSlot];

  useEffect(() => {
    if (isSaved) {
      setDrafts((prev) => ({
        ...prev,
        [activeMealSlot]: {
          quantityStr: String(lastSavedQuantity),
          prepTime: lastSavedPrepTime,
          closingTime: lastSavedClosingTime,
        },
      }));
    }
    setErrors({});
  }, [activeMealSlot, isSaved, lastSavedQuantity, lastSavedPrepTime, lastSavedClosingTime]);

  const activeDraft = drafts[activeMealSlot] || getDefaultDraftForSlot(activeMealSlot, mealSlotWindows);
  const quantityStr = activeDraft.quantityStr;
  const prepTime = activeDraft.prepTime;
  const closingTime = activeDraft.closingTime;

  const validateField = (field: keyof MealSlotDraft, value: string, currentDraft: MealSlotDraft): string | undefined => {
    if (field === 'quantityStr') {
      if (!value.trim()) return `${mealLabel} portions is required (enter at least 1)`;
      const q = Number(value);
      if (isNaN(q) || q <= 0) return 'Portions must be greater than 0';
      if (q > 500) return 'Exceeds single batch limit of 500 portions';
      return undefined;
    }
    if (field === 'prepTime') {
      if (!value.trim()) return 'Preparation time is required';
      return undefined;
    }
    if (field === 'closingTime') {
      if (!value.trim()) return 'Closing time is required';
      if (currentDraft.prepTime.trim()) {
        const [pH, pM] = currentDraft.prepTime.split(':').map(Number);
        const [cH, cM] = value.split(':').map(Number);
        if (cH * 60 + (cM || 0) <= pH * 60 + (pM || 0)) {
          return 'Closing time must be after preparation time';
        }
      }
      return undefined;
    }
    return undefined;
  };

  const updateActiveDraft = (field: keyof MealSlotDraft, value: string) => {
    const updatedDraft = {
      ...(drafts[activeMealSlot] || getDefaultDraftForSlot(activeMealSlot, mealSlotWindows)),
      [field]: value,
    };
    setDrafts((prev) => ({
      ...prev,
      [activeMealSlot]: updatedDraft,
    }));
    const fieldError = validateField(field, value, updatedDraft);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const validate = (): boolean => {
    const newErrors: { quantity?: string; prepTime?: string; closingTime?: string } = {};

    const qtyErr = validateField('quantityStr', quantityStr, activeDraft);
    if (qtyErr) newErrors.quantity = qtyErr;

    const prepErr = validateField('prepTime', prepTime, activeDraft);
    if (prepErr) newErrors.prepTime = prepErr;

    const closeErr = validateField('closingTime', closingTime, activeDraft);
    if (closeErr) newErrors.closingTime = closeErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    try {
      const qty = Number(quantityStr);
      await onSave({
        preparedQty: qty,
        preparationTime: prepTime,
        closingTime,
      });
      toast.success(`${mealLabel} production logged: ${qty} portions`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-150">
      {/* Compact Billing status card */}
      {onConnectBilling && onSyncBilling && (
        <BillingStatusCard
          billingConnection={billingConnection}
          onConnectBilling={onConnectBilling}
          onSyncBilling={onSyncBilling}
        />
      )}

      {/* ── Meal Slot Tabs (large: icon + name + status chip) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Select Meal Slot
          </label>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            Current: <strong className="text-slate-800">{getMealSlotLabel(currentMealSlot)}</strong>
          </span>
        </div>

        {/* Three large tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/60" role="tablist">
          {MEAL_SLOTS.map((slot) => {
            const isSelected = activeMealSlot === slot.id;
            const isCurrentClock = currentMealSlot === slot.id;
            const slotWindow = mealSlotWindows[slot.id] || DEFAULT_MEAL_SLOT_WINDOWS[slot.id];
            const slotLabel = MEAL_SLOT_LABELS[slot.id];
            const slotStatus: MealSlotStatus =
              slotStatuses?.[slot.id] || (isSelected && isSaved ? 'Saved' : 'Not started');
            const meta = SLOT_STATUS_META[slotStatus];
            const SlotIcon = slot.Icon;

            return (
              <button
                key={slot.id}
                type="button"
                id={`meal-slot-btn-${slot.id}`}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectMealSlot(slot.id)}
                className={[
                  'flex flex-col items-center justify-center py-3 px-2 rounded-xl',
                  'min-h-[80px] text-xs font-semibold transition-all duration-150 relative cursor-pointer',
                  isSelected
                    ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
                ].join(' ')}
              >
                {/* Icon */}
                <SlotIcon className={`w-5 h-5 mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />

                {/* Name + "Now" badge */}
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{slotLabel}</span>
                  {isCurrentClock && (
                    <span
                      title="Current active meal by clock"
                      className="inline-flex items-center px-1.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                    >
                      Now
                    </span>
                  )}
                </div>

                {/* Time window */}
                <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                  {slotWindow.start}–{slotWindow.end}
                </span>

                {/* Status chip — icon + label */}
                <span
                  id={`slot-status-chip-${slot.id}`}
                  className={[
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full',
                    'text-[9px] font-semibold border mt-1.5',
                    meta.bg, meta.text, meta.border,
                  ].join(' ')}
                >
                  <span aria-hidden="true">{meta.icon}</span>
                  <span>{meta.label}</span>
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
          <span className="text-slate-600">{mealLabel} window:</span>
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
                  {mealLabel} Production Logged
                </div>
                <p
                  id="meal-production-summary"
                  className="text-sm font-semibold text-slate-800 mt-0.5 tracking-tight"
                >
                  {mealLabel}: {quantityStr || lastSavedQuantity} portions prepared at{' '}
                  {formatTime12(prepTime || lastSavedPrepTime)}, closing{' '}
                  {formatTime12(closingTime || lastSavedClosingTime)}.
                </p>
              </div>
            </div>
            {isLocked ? (
              <span
                id="locked-pickup-scheduled-note"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Locked — pickup scheduled</span>
              </span>
            ) : (
              <button
                type="button"
                id="edit-meal-production-btn"
                onClick={onEdit}
                disabled={disabled}
                className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 transition-colors duration-150 cursor-pointer self-start sm:self-auto flex items-center gap-1.5 shrink-0"
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
                <h3 className="text-sm font-semibold text-slate-900">{mealLabel} Kitchen Output</h3>
                <p className="text-[11px] text-slate-500">
                  Enter portions prepared and service hours for {mealLabel.toLowerCase()}
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
                onChange={(e) => updateActiveDraft('quantityStr', e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  errors.quantity
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
              {errors.quantity && (
                <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1.5 animate-in fade-in" id="error-meal-production-quantity">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.quantity}</span>
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
                onChange={(e) => updateActiveDraft('prepTime', e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  errors.prepTime
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
              {errors.prepTime && (
                <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1.5 animate-in fade-in" id="error-meal-production-preptime">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.prepTime}</span>
                </p>
              )}
            </div>

            {/* 3. Closing time */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="meal-production-closingtime" className="block text-xs font-semibold text-slate-700">
                  Closing Time
                </label>
                <span className="text-[10px] text-slate-400">{mealLabel} closing</span>
              </div>
              <input
                id="meal-production-closingtime"
                type="time"
                value={closingTime}
                disabled={disabled}
                onChange={(e) => updateActiveDraft('closingTime', e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  errors.closingTime
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
              {errors.closingTime && (
                <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1.5 animate-in fade-in" id="error-meal-production-closingtime">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errors.closingTime}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Values update {mealLabel.toLowerCase()}&apos;s surplus estimate and collection deadline.
            </p>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              {disabled && (
                <span className="text-xs text-slate-500 font-medium">Locked during active collection</span>
              )}
              {!disabled && (!quantityStr.trim() || Boolean(errors.quantity || errors.prepTime || errors.closingTime)) && (
                <span className="text-xs text-rose-600 font-medium">Enter valid portions & times above</span>
              )}
              <Button
                type="submit"
                id="save-meal-production-btn"
                variant="primary"
                size="md"
                loading={isSaving}
                disabled={disabled || isSaving || !quantityStr.trim() || Boolean(errors.quantity || errors.prepTime || errors.closingTime)}
                icon={<Check className="h-4 w-4" />}
              >
                Save {mealLabel}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
