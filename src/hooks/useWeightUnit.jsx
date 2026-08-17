import { createContext, useContext, useEffect, useState } from "react";
import { hydrateString, loadString, saveString } from "../lib/persist";

const STORAGE_KEY = "weightUnit";
const KG_PER_LB = 0.45359237;
const LB_PER_KG = 1 / KG_PER_LB;

const WeightUnitContext = createContext({
  unit: "lbs",
  setUnit: () => {},
  toggleUnit: () => {},
  label: "lb",
  labelLong: "lbs",
  fromLbs: (v) => v,
  toLbs: (v) => v,
  format: (v) => String(v ?? 0),
  formatVolume: (v) => String(v ?? 0),
});

function loadUnit() {
  return loadString(STORAGE_KEY, "lbs") === "kg" ? "kg" : "lbs";
}

function roundWeight(value) {
  if (value == null || Number.isNaN(Number(value))) return 0;
  const n = Number(value);
  return Math.round(n * 10) / 10;
}

export function WeightUnitProvider({ children }) {
  const [unit, setUnitState] = useState(loadUnit);

  useEffect(() => {
    hydrateString(STORAGE_KEY, "lbs").then((stored) => {
      if (stored === "kg" || stored === "lbs") setUnitState(stored);
    });
  }, []);

  useEffect(() => {
    saveString(STORAGE_KEY, unit);
  }, [unit]);

  const setUnit = (next) => {
    if (next === "kg" || next === "lbs") setUnitState(next);
  };

  const toggleUnit = () => setUnitState((u) => (u === "lbs" ? "kg" : "lbs"));

  const fromLbs = (lbs) => {
    if (lbs == null || lbs === "") return unit === "kg" ? 0 : 0;
    const n = Number(lbs);
    if (Number.isNaN(n)) return 0;
    return unit === "kg" ? roundWeight(n * KG_PER_LB) : n;
  };

  const toLbs = (display) => {
    if (display == null || display === "") return 0;
    const n = Number(display);
    if (Number.isNaN(n)) return 0;
    return unit === "kg" ? roundWeight(n * LB_PER_KG) : n;
  };

  const format = (lbs) => {
    const v = fromLbs(lbs);
    return Number.isInteger(v) ? String(v) : String(v);
  };

  /** Compact volume like 24.2k for dashboard stats (from lbs storage). */
  const formatVolume = (lbs) => {
    const v = fromLbs(lbs);
    if (v >= 1000) {
      const k = v / 1000;
      const rounded = Math.round(k * 10) / 10;
      return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}k`;
    }
    return Math.round(v).toLocaleString();
  };

  const value = {
    unit,
    setUnit,
    toggleUnit,
    label: unit === "kg" ? "kg" : "lb",
    labelLong: unit === "kg" ? "kg" : "lbs",
    fromLbs,
    toLbs,
    format,
    formatVolume,
  };

  return (
    <WeightUnitContext.Provider value={value}>
      {children}
    </WeightUnitContext.Provider>
  );
}

export function useWeightUnit() {
  return useContext(WeightUnitContext);
}
