import { useEffect, useState } from "react";
import { hydrateWorkouts, loadWorkoutsSync } from "../lib/workoutsStorage";
import { hydratePRs, loadPRsSync } from "../lib/prsStorage";
import { hydratePlans, loadPlansSync } from "../lib/plansStorage";

// Read the fast localStorage copy right away, then swap in the newest copy
// once IndexedDB has been checked.
function useHydrated(loadSync, hydrate) {
  const [value, setValue] = useState(loadSync);
  useEffect(() => {
    let cancelled = false;
    hydrate().then((next) => {
      if (!cancelled) setValue(next);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);
  return value;
}

export function useWorkouts() {
  return useHydrated(loadWorkoutsSync, hydrateWorkouts);
}

export function usePRs() {
  return useHydrated(loadPRsSync, hydratePRs);
}

export function usePlans() {
  return useHydrated(loadPlansSync, hydratePlans);
}
