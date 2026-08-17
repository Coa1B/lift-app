export const CARDIO_TYPES = [
  {
    id: "run",
    name: "Run",
    tracksDistance: true,
    distanceUnit: "mi",
  },
  {
    id: "walk",
    name: "Walk",
    tracksDistance: true,
    distanceUnit: "mi",
  },
  {
    id: "cycle",
    name: "Cycle",
    tracksDistance: true,
    distanceUnit: "mi",
  },
  {
    id: "row",
    name: "Row",
    tracksDistance: true,
    distanceUnit: "m",
  },
  {
    id: "swim",
    name: "Swim",
    tracksDistance: true,
    distanceUnit: "m",
  },
  {
    id: "elliptical",
    name: "Elliptical",
    tracksDistance: false,
  },
  {
    id: "stairs",
    name: "Stair climber",
    tracksDistance: false,
  },
  {
    id: "jump-rope",
    name: "Jump rope",
    tracksDistance: false,
  },
  {
    id: "hiit",
    name: "HIIT",
    tracksDistance: false,
  },
  {
    id: "other",
    name: "Other",
    tracksDistance: false,
  },
];

export function getCardioType(id) {
  return CARDIO_TYPES.find((t) => t.id === id) ?? null;
}

export function formatDuration(mins) {
  const n = Number(mins) || 0;
  if (n < 60) return `${Math.round(n)}m`;
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatDistance(value, unit) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  const rounded = Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  return `${rounded} ${unit}`;
}
