import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hydrateJSON, loadJSON, saveJSONAsync } from "../lib/persist";

const STORAGE_KEY = "localUser_v1";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function initialsFrom(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function createUser(partial = {}) {
  return {
    deviceId: partial.deviceId || makeId(),
    name: typeof partial.name === "string" ? partial.name.slice(0, 40) : "",
    createdAt: partial.createdAt || new Date().toISOString(),
  };
}

function loadUserSync() {
  const stored = loadJSON(STORAGE_KEY, null);
  if (stored && typeof stored === "object" && stored.deviceId) {
    return createUser(stored);
  }
  // Migrate old display-name-only key if present on this device.
  let legacyName = "";
  try {
    const raw = localStorage.getItem("displayName");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") legacyName = parsed;
      else if (parsed && typeof parsed.d === "string") legacyName = parsed.d;
      else if (typeof raw === "string" && !raw.startsWith("{")) legacyName = raw;
    }
  } catch {
    /* ignore */
  }
  return createUser({ name: legacyName });
}

const LocalUserContext = createContext({
  deviceId: "",
  name: "",
  setName: () => {},
  firstName: "",
  initials: "?",
  createdAt: "",
  sinceLabel: "",
  ready: false,
});

export function LocalUserProvider({ children }) {
  const [user, setUser] = useState(loadUserSync);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hydrateJSON(STORAGE_KEY, null).then((stored) => {
      if (cancelled) return;
      if (stored && typeof stored === "object" && stored.deviceId) {
        setUser(createUser(stored));
      } else {
        // First launch on this device — persist a fresh local identity.
        const fresh = createUser();
        setUser(fresh);
        saveJSONAsync(STORAGE_KEY, fresh);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveJSONAsync(STORAGE_KEY, user);
  }, [user, ready]);

  const setName = (next) => {
    setUser((u) => ({ ...u, name: String(next ?? "").slice(0, 40) }));
  };

  const value = useMemo(() => {
    const trimmed = user.name.trim();
    const created = user.createdAt ? new Date(user.createdAt) : null;
    const sinceLabel =
      created && !Number.isNaN(created.getTime())
        ? created.toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "";
    return {
      deviceId: user.deviceId,
      name: trimmed,
      setName,
      firstName: trimmed.split(/\s+/)[0] || "",
      initials: initialsFrom(trimmed),
      createdAt: user.createdAt,
      sinceLabel,
      ready,
    };
  }, [user, ready]);

  return (
    <LocalUserContext.Provider value={value}>{children}</LocalUserContext.Provider>
  );
}

export function useLocalUser() {
  return useContext(LocalUserContext);
}
