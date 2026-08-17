import { hydrateString, loadString, saveString } from "../lib/persist";

const STORAGE_KEY = "defaultRestSecs";

export const REST_PRESETS = [
  { secs: 30, label: "30s" },
  { secs: 60, label: "1 min" },
  { secs: 90, label: "90s" },
  { secs: 120, label: "2 min" },
  { secs: 180, label: "3 min" },
  { secs: 300, label: "5 min" },
];

export function formatRestLabel(secs) {
  const match = REST_PRESETS.find((p) => p.secs === secs);
  if (match) return match.label;
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, "0")}`;
}

function clampRestSecs(n) {
  if (!Number.isFinite(n) || n < 0) return 90;
  return Math.min(Math.round(n), 3600);
}

export function loadDefaultRestSecs() {
  const stored = Number(loadString(STORAGE_KEY, "90"));
  return clampRestSecs(stored);
}

export async function hydrateDefaultRestSecs() {
  const stored = Number(await hydrateString(STORAGE_KEY, "90"));
  return clampRestSecs(stored);
}

export function saveDefaultRestSecs(secs) {
  saveString(STORAGE_KEY, String(clampRestSecs(secs)));
}

/** Exercise/plan rest of 0 means “use the Profile default”. */
export function resolveRestSecs(exerciseRestSecs) {
  const n = Number(exerciseRestSecs);
  if (Number.isFinite(n) && n > 0) return n;
  return loadDefaultRestSecs();
}
