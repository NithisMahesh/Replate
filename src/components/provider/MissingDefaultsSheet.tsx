import React, { useState, useEffect } from 'react';
import { FoodCategory, StorageType, ProviderDefaults } from '../../types/surplusLink';
import { Check } from 'lucide-react';
import { BottomSheet } from '../shared/BottomSheet';
import { Button } from '../shared/Button';
import { useToast } from '../shared/Toast';

interface MissingDefaultsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentDefaults?: ProviderDefaults;
  onSaveDefaults: (defaults: ProviderDefaults) => void;
}

export const MissingDefaultsSheet: React.FC<MissingDefaultsSheetProps> = ({
  isOpen,
  onClose,
  currentDefaults,
  onSaveDefaults,
}) => {
  const [foodItem, setFoodItem] = useState(currentDefaults?.usualFoodItem || 'Fresh Evening Meals');
  const [category, setCategory] = useState<FoodCategory>(currentDefaults?.category || 'cooked_meal');
  const [storageType, setStorageType] = useState<StorageType>(currentDefaults?.storageType || 'hot_held');
  const [closingTime, setClosingTime] = useState(currentDefaults?.closingTime || '21:30');
  const toast = useToast();

  useEffect(() => {
    if (currentDefaults) {
      if (currentDefaults.usualFoodItem) setFoodItem(currentDefaults.usualFoodItem);
      if (currentDefaults.category) setCategory(currentDefaults.category);
      if (currentDefaults.storageType) setStorageType(currentDefaults.storageType);
      if (currentDefaults.closingTime) setClosingTime(currentDefaults.closingTime);
    }
  }, [currentDefaults, isOpen]);

  const categories: { label: string; value: FoodCategory }[] = [
    { label: 'Cooked Meals', value: 'cooked_meal' },
    { label: 'Bakery Bread', value: 'bakery_bread' },
    { label: 'Snacks & Tiffin', value: 'snacks_tiffin' },
    { label: 'Rice & Curry', value: 'rice_curry' },
    { label: 'Sweets & Dairy', value: 'sweets_dairy' },
  ];

  const storageOptions: { label: string; value: StorageType }[] = [
    { label: 'Room Temp', value: 'room_temp' },
    { label: 'Hot-Held (>65°C)', value: 'hot_held' },
    { label: 'Chilled (<5°C)', value: 'refrigerated' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDefaults({
      usualFoodItem: foodItem.trim() || 'Evening Surplus Meals',
      category,
      storageType,
      closingTime,
      usualPreparedQty: currentDefaults?.usualPreparedQty || 80,
      usualSoldQty: currentDefaults?.usualSoldQty || 50,
      usualDiscardQty: currentDefaults?.usualDiscardQty || 2,
    });
    toast.success('Saved kitchen defaults for tonight and future donations');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Food Provider Defaults"
      subtitle="Saved once and remembered for all future donations"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Food Item */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Usual Surplus Food Item</label>
          <input
            type="text"
            required
            value={foodItem}
            onChange={(e) => setFoodItem(e.target.value)}
            placeholder="e.g. Buns, Sandwich Loaves & Veg Puffs"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Food Category</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors duration-150 min-h-[38px] ${
                  category === c.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Storage Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Storage / Holding Condition</label>
          <div className="flex flex-wrap gap-1.5">
            {storageOptions.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setStorageType(s.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors duration-150 min-h-[38px] ${
                  storageType === s.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Closing Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Kitchen Closing Time</label>
          <input
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            icon={<Check className="h-4 w-4" />}
          >
            Save Defaults & Continue
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
