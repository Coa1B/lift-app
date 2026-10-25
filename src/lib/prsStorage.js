import { PR_EXERCISE_IDS } from "../data/mockData";
import { hydrateJSON, loadJSON } from "./persist";

export const PRS_KEY = "userPRs_v6";

export function normalizePRs(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((pr) => PR_EXERCISE_IDS.includes(pr.exerciseId));
}

export function loadPRsSync() {
  return normalizePRs(loadJSON(PRS_KEY, []));
}

export async function hydratePRs() {
  return normalizePRs(await hydrateJSON(PRS_KEY, []));
}

// PR dates are stored as "Oct 25" with no year, which Safari can't parse on
// its own. Assume the most recent year that doesn't put the date in the future.
function parseDate(label) {
  if (!label) return 0;
  const now = new Date();
  const thisYear = Date.parse(`${label}, ${now.getFullYear()}`);
  if (!Number.isNaN(thisYear)) {
    return thisYear > now.getTime() + 24 * 60 * 60 * 1000
      ? Date.parse(`${label}, ${now.getFullYear() - 1}`)
      : thisYear;
  }
  const t = Date.parse(label);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Every logged PR entry, newest first, with the gain over the entry before it
 * for the same lift.
 */
export function recentPREntries(prs) {
  const entries = [];
  for (const pr of prs) {
    const history = [...(pr.history || [])].sort(
      (a, b) => parseDate(a.date) - parseDate(b.date),
    );
    history.forEach((point, i) => {
      entries.push({
        key: `${pr.id}-${i}`,
        exerciseId: pr.exerciseId,
        name: pr.name,
        weight: point.weight,
        date: point.date,
        time: parseDate(point.date),
        gain: i > 0 ? point.weight - history[i - 1].weight : null,
      });
    });
  }
  return entries.sort((a, b) => b.time - a.time);
}
