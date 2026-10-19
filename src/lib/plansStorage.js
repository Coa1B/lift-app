import { exerciseLibrary } from "../data/mockData";
import { hydrateJSON, loadJSON, saveJSONAsync } from "./persist";

export const PLANS_KEY = "userPlans_v2";

// Per-set targets for a plan exercise. Older plans only stored a set count and
// a single rep target, so expand those into one row per set.
export function planSetTargets(item) {
  if (Array.isArray(item?.setTargets) && item.setTargets.length > 0) {
    return item.setTargets.map((s) => ({
      weight: Number(s?.weight) || 0,
      reps: Number(s?.reps) || 0,
    }));
  }
  const count = Math.max(Number(item?.sets) || 0, 1);
  return Array.from({ length: count }, () => ({
    weight: 0,
    reps: Number(item?.reps) || 0,
  }));
}

export function repairPlans(stored) {
  if (!Array.isArray(stored)) return [];
  return stored
    .map((plan) => ({
      ...plan,
      id: plan.id || `p-${Date.now()}`,
      name: plan.name || "Untitled",
      exercises: (plan.exercises || []).filter((ex) =>
        exerciseLibrary.some((lib) => lib.id === ex.exerciseId),
      ),
    }))
    .filter((plan) => Array.isArray(plan.exercises));
}

export function loadPlansSync() {
  return repairPlans(loadJSON(PLANS_KEY, []));
}

export async function hydratePlans() {
  const stored = await hydrateJSON(PLANS_KEY, []);
  return repairPlans(stored);
}

export async function savePlans(plans) {
  await saveJSONAsync(PLANS_KEY, plans);
}
