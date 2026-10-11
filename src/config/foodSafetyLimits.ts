import { FoodCategory, StorageType, ProviderType } from '../types/surplusLink';

export type PublicFoodTypeId = 'cooked_meal' | 'bakery' | 'snacks' | 'sweets';

export interface FoodTypeSafetyConfig {
  id: PublicFoodTypeId;
  labelEn: string;
  labelTa: string;
  category: FoodCategory;
  providerType: ProviderType;
  maxSafeHours: number;
  autoStorageType: StorageType;
  storageDescriptionEn: string;
  storageDescriptionTa: string;
}

export const FOOD_SAFETY_LIMITS: Record<PublicFoodTypeId, FoodTypeSafetyConfig> = {
  cooked_meal: {
    id: 'cooked_meal',
    labelEn: 'Cooked meal',
    labelTa: 'சமைத்த உணவு',
    category: 'cooked_meal',
    providerType: 'restaurant',
    maxSafeHours: 4,
    autoStorageType: 'hot_held',
    storageDescriptionEn: 'Hot-held insulated',
    storageDescriptionTa: 'சூடாக வைக்கப்பட்டது',
  },
  bakery: {
    id: 'bakery',
    labelEn: 'Bakery',
    labelTa: 'பேக்கரி',
    category: 'bakery_bread',
    providerType: 'bakery',
    maxSafeHours: 12,
    autoStorageType: 'room_temp',
    storageDescriptionEn: 'Room temperature',
    storageDescriptionTa: 'அறை வெப்பநிலை',
  },
  snacks: {
    id: 'snacks',
    labelEn: 'Snacks',
    labelTa: 'சிற்றுண்டி',
    category: 'snacks_tiffin',
    providerType: 'restaurant',
    maxSafeHours: 6,
    autoStorageType: 'room_temp',
    storageDescriptionEn: 'Room temperature dry',
    storageDescriptionTa: 'அறை வெப்பநிலை',
  },
  sweets: {
    id: 'sweets',
    labelEn: 'Sweets',
    labelTa: 'இனிப்புகள்',
    category: 'sweets_dairy',
    providerType: 'bakery',
    maxSafeHours: 12,
    autoStorageType: 'refrigerated',
    storageDescriptionEn: 'Chilled / Covered',
    storageDescriptionTa: 'குளிரூட்டப்பட்டது',
  },
};

/**
 * Validates whether the pickup deadline is chronologically valid and within safety limits.
 */
export function validatePickupDeadline(
  foodTypeId: PublicFoodTypeId,
  preparedTimestamp: number,
  deadlineTimestamp: number
): {
  isValid: boolean;
  isAfterPrepared: boolean;
  exceedsSafeLimit: boolean;
  maxAllowedTimestamp: number;
  maxSafeHours: number;
  diffHours: number;
  warningEn?: string;
  warningTa?: string;
} {
  const config = FOOD_SAFETY_LIMITS[foodTypeId];
  const maxSafeMs = config.maxSafeHours * 60 * 60 * 1000;
  const maxAllowedTimestamp = preparedTimestamp + maxSafeMs;

  const isAfterPrepared = deadlineTimestamp > preparedTimestamp;
  const exceedsSafeLimit = deadlineTimestamp > maxAllowedTimestamp;
  const diffHours = Number(((deadlineTimestamp - preparedTimestamp) / (60 * 60 * 1000)).toFixed(1));

  if (!isAfterPrepared) {
    return {
      isValid: false,
      isAfterPrepared: false,
      exceedsSafeLimit: false,
      maxAllowedTimestamp,
      maxSafeHours: config.maxSafeHours,
      diffHours,
      warningEn: 'Pickup deadline must be after the time food was prepared.',
      warningTa: 'பிக்கப் நேரம் உணவு தயாரிக்கப்பட்ட நேரத்திற்குப் பிறகு இருக்க வேண்டும்.',
    };
  }

  if (exceedsSafeLimit) {
    return {
      isValid: false,
      isAfterPrepared: true,
      exceedsSafeLimit: true,
      maxAllowedTimestamp,
      maxSafeHours: config.maxSafeHours,
      diffHours,
      warningEn: `Food safety limit exceeded! ${config.labelEn} must be picked up within ${config.maxSafeHours} hours of preparation (selected: ${diffHours}h).`,
      warningTa: `பாதுகாப்பு வரம்பு மீறப்பட்டது! ${config.labelTa} சமைத்த ${config.maxSafeHours} மணி நேரத்திற்குள் பயன்படுத்தப்பட வேண்டும் (தேர்வு: ${diffHours} மணி).`,
    };
  }

  return {
    isValid: true,
    isAfterPrepared: true,
    exceedsSafeLimit: false,
    maxAllowedTimestamp,
    maxSafeHours: config.maxSafeHours,
    diffHours,
  };
}
