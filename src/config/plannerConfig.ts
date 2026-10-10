export interface PlannerConfig {
  minViablePortions: number; // default 20 meals
  handlingTimePerStopMins: number; // default 5 min
  finalHandoverBufferMins: number; // default 10 min
  cityTrafficSpeedKmh: number; // default 25 km/h
  vanCapacityPortions: number; // default 60 portions
}

export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  minViablePortions: 20,
  handlingTimePerStopMins: 5,
  finalHandoverBufferMins: 10,
  cityTrafficSpeedKmh: 25,
  vanCapacityPortions: 60,
};

export const MIN_VIABLE_PORTIONS = DEFAULT_PLANNER_CONFIG.minViablePortions;

const CONFIG_STORAGE_KEY = 'surpluslink_planner_config_v1';

export function getSavedPlannerConfig(): PlannerConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PLANNER_CONFIG,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn('Failed to read planner config from storage', err);
  }
  return DEFAULT_PLANNER_CONFIG;
}

export function savePlannerConfig(config: Partial<PlannerConfig>): PlannerConfig {
  try {
    const current = getSavedPlannerConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save planner config', err);
    return DEFAULT_PLANNER_CONFIG;
  }
}
