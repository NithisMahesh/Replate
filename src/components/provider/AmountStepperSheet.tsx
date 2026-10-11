import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { MealSlot } from '../../types/surplusLink';
import { getMealSlotLabel } from '../../utils/posAndPredictionUtils';
import { BottomSheet } from '../shared/BottomSheet';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';

interface AmountStepperSheetProps {
  initialAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  mealSlot?: MealSlot;
}

export const AmountStepperSheet: React.FC<AmountStepperSheetProps> = ({
  initialAmount,
  isOpen,
  onClose,
  onSave,
  mealSlot,
}) => {
  const [amount, setAmount] = useState(initialAmount);
  const toast = useToast();

  useEffect(() => {
    setAmount(initialAmount);
  }, [initialAmount, isOpen]);

  const handleAdjust = (delta: number) => {
    setAmount((prev) => Math.max(1, prev + delta));
  };

  const handleSave = () => {
    onSave(amount);
    toast.success(
      mealSlot
        ? `Updated ${getMealSlotLabel(mealSlot).toLowerCase()} surplus to ${amount} portions`
        : `Updated surplus to ${amount} portions`
    );
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Surplus Amount"
      subtitle={
        mealSlot
          ? `Update portions available for ${getMealSlotLabel(mealSlot).toLowerCase()} pickup`
          : 'Update portions available for pickup'
      }
      footer={
        <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
          Save {amount} portions
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Big Number Stepper */}
        <div className="flex items-center justify-center gap-6 py-4">
          <button
            type="button"
            onClick={() => handleAdjust(-1)}
            disabled={amount <= 1}
            className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 flex items-center justify-center text-slate-800 transition-colors duration-150 shadow-2xs cursor-pointer"
            aria-label="Decrease portions"
          >
            <Minus className="h-6 w-6 stroke-[2.5]" />
          </button>
          <div className="text-center min-w-[120px]">
            <span className="text-5xl font-semibold text-slate-900 font-mono tracking-tight">
              {amount}
            </span>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              portions
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAdjust(1)}
            className="w-14 h-14 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 flex items-center justify-center transition-colors duration-150 shadow-2xs cursor-pointer border border-emerald-200/60"
            aria-label="Increase portions"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[-5, +5, +10, +20].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => handleAdjust(delta)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-150 cursor-pointer min-h-[36px]"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};
