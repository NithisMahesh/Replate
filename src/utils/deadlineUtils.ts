import { FoodCategory, StorageType } from '../types/surplusLink';

/**
 * Computes pickup deadline automatically based on food category, storage type, and closing time.
 * E.g., for bakery/room_temp with 21:30 closing -> "Pickup by 9:30 PM".
 * For cooked hot meals -> safety window before/at closing.
 */
export function computePickupDeadline(
  category: FoodCategory,
  storageType: StorageType,
  closingTime?: string
): { formatted: string; time24: string; timestamp: number } {
  const baseClosing = closingTime || '21:30';
  const parts = baseClosing.split(':');
  let h = parseInt(parts[0], 10) || 21;
  let m = parseInt(parts[1], 10) || 30;

  // Food safety rules:
  // Hot held cooked meals or rice curry have strict temperature safety windows.
  // Must be picked up either by closing or within safe evening dispatch window.
  if (storageType === 'hot_held' && (category === 'cooked_meal' || category === 'rice_curry')) {
    if (h > 22 || (h === 22 && m > 30)) {
      h = 22;
      m = 0;
    }
  }

  // Format nicely e.g. "9:30 PM"
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 === 0 ? 12 : h % 12;
  const displayMinutes = String(m).padStart(2, '0');
  const formatted = `Pickup by ${displayHours}:${displayMinutes} ${period}`;
  const time24 = `${String(h).padStart(2, '0')}:${displayMinutes}`;

  // Today's timestamp
  const now = new Date();
  const deadlineDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  const timestamp = deadlineDate.getTime();

  return { formatted, time24, timestamp };
}

/**
 * Formats a 24-hr time string "21:30" to "9:30 PM".
 */
export function formatTime12(time24: string): string {
  if (!time24) return '';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 === 0 ? 12 : h % 12;
  return `${displayHours}:${String(m).padStart(2, '0')} ${period}`;
}
