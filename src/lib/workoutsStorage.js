import { hydrateJSON, loadJSON, saveJSONAsync } from "./persist";

export const WORKOUTS_KEY = "userWorkouts_v1";

const DAY_MS = 24 * 60 * 60 * 1000;

export function repairWorkouts(stored) {
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((w) => w && w.id && w.dateISO && Array.isArray(w.exercises))
    .map((w) => ({
      id: w.id,
      title: w.title || "Workout",
      dateISO: w.dateISO,
      durationSec: Number(w.durationSec) || 0,
      volumeLbs: Number(w.volumeLbs) || 0,
      exercises: w.exercises.map((ex) => ({
        name: ex.name || "Exercise",
        isPR: Boolean(ex.isPR),
        sets: (ex.sets || []).map((s) => ({
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
        })),
      })),
    }))
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

export function loadWorkoutsSync() {
  return repairWorkouts(loadJSON(WORKOUTS_KEY, []));
}

export async function hydrateWorkouts() {
  return repairWorkouts(await hydrateJSON(WORKOUTS_KEY, []));
}

export async function saveWorkouts(workouts) {
  await saveJSONAsync(WORKOUTS_KEY, workouts);
}

/**
 * Turn a live session from the log screen into a saved workout. Only sets that
 * were checked off, or that have reps filled in, count. Returns null when
 * nothing was logged.
 */
export function workoutFromSession(session, elapsedSec) {
  const exercises = session.exercises
    .map((ex) => ({
      name: ex.name,
      isPR: false,
      sets: ex.sets
        .filter((s) => s.done || (Number(s.reps) || 0) > 0)
        .map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 })),
    }))
    .filter((ex) => ex.sets.length > 0);
  if (exercises.length === 0) return null;

  const volumeLbs = exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
  return {
    id: `w-${Date.now()}`,
    title: session.title || "Workout",
    dateISO: new Date().toISOString(),
    durationSec: elapsedSec,
    volumeLbs: Math.round(volumeLbs),
    exercises,
  };
}

export async function addWorkout(workout) {
  const next = repairWorkouts([workout, ...(await hydrateWorkouts())]);
  await saveWorkouts(next);
  return next;
}

/** Shape the Home and History cards expect. */
export function toWorkoutCard(w) {
  return {
    id: w.id,
    title: w.title,
    date: new Date(w.dateISO).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    durationMin: Math.max(1, Math.round(w.durationSec / 60)),
    volumeLbs: w.volumeLbs,
    exercises: w.exercises,
  };
}

/** Monday 00:00 of the week containing `date`, in local time. */
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - day);
  return d;
}

export function weekSummary(workouts, now = new Date()) {
  const weekStart = startOfWeek(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * DAY_MS);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
      isToday: d.toDateString() === now.toDateString(),
      volumeLbs: 0,
      sessions: 0,
    };
  });

  let sessions = 0;
  let volumeLbs = 0;
  let durationSec = 0;
  for (const w of workouts) {
    const t = new Date(w.dateISO);
    if (t < weekStart) continue;
    const idx = Math.floor((t - weekStart) / DAY_MS);
    if (idx < 0 || idx > 6) continue;
    days[idx].volumeLbs += w.volumeLbs;
    days[idx].sessions += 1;
    sessions += 1;
    volumeLbs += w.volumeLbs;
    durationSec += w.durationSec;
  }

  return {
    sessions,
    volumeLbs,
    durationSec,
    days,
    streakWeeks: streakWeeks(workouts, now),
  };
}

/**
 * Consecutive weeks (Mon–Sun) with at least one workout. An empty current week
 * doesn't break the streak until it's over.
 */
export function streakWeeks(workouts, now = new Date()) {
  const weeks = new Set(
    workouts.map((w) => startOfWeek(new Date(w.dateISO)).getTime()),
  );
  // Monday of the previous week. Going back 3 days and re-snapping keeps DST
  // changes from knocking the cursor off midnight.
  const prevWeek = (monday) => startOfWeek(new Date(monday.getTime() - 3 * DAY_MS));

  let cursor = startOfWeek(now);
  if (!weeks.has(cursor.getTime())) cursor = prevWeek(cursor);
  let count = 0;
  while (weeks.has(cursor.getTime())) {
    count += 1;
    cursor = prevWeek(cursor);
  }
  return count;
}

export function lifetimeSummary(workouts) {
  let volumeLbs = 0;
  let durationSec = 0;
  let sets = 0;
  for (const w of workouts) {
    volumeLbs += w.volumeLbs;
    durationSec += w.durationSec;
    for (const ex of w.exercises) sets += ex.sets.length;
  }
  return { workouts: workouts.length, volumeLbs, durationSec, sets };
}

export function formatDuration(sec) {
  const totalMin = Math.round(sec / 60);
  if (sec > 0 && totalMin < 1) return "<1m";
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
