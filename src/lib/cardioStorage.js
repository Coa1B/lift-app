import { hydrateJSON, loadJSON, saveJSONAsync } from "./persist";

export const CARDIO_KEY = "userCardio_v1";

export function repairSessions(stored) {
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((s) => s && s.id && s.typeId && s.durationMin > 0)
    .map((s) => ({
      id: s.id,
      typeId: s.typeId,
      durationMin: Number(s.durationMin) || 0,
      distance: s.distance == null || s.distance === "" ? null : Number(s.distance),
      calories: s.calories == null || s.calories === "" ? null : Number(s.calories),
      notes: typeof s.notes === "string" ? s.notes.slice(0, 120) : "",
      dateISO: s.dateISO || new Date().toISOString(),
      dateLabel: s.dateLabel || "",
    }));
}

export function loadCardioSync() {
  return repairSessions(loadJSON(CARDIO_KEY, []));
}

export async function hydrateCardio() {
  const stored = await hydrateJSON(CARDIO_KEY, []);
  return repairSessions(stored);
}

export async function saveCardio(sessions) {
  await saveJSONAsync(CARDIO_KEY, sessions);
}
