import { exerciseLibrary } from "../data/mockData";
import { hydrateJSON, loadJSON, saveJSONAsync } from "./persist";

export const PLANS_KEY = "userPlans_v2";

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
