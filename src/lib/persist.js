const DB_NAME = "lift-app";
const DB_VERSION = 1;
const STORE = "kv";

let dbPromise = null;

function openDB() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onclose = () => {
          dbPromise = null;
        };
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("IndexedDB abort"));
  });
}

/** Envelope so we can pick the newest copy across localStorage + IndexedDB. */
function wrap(value) {
  return { t: Date.now(), d: value };
}

function unwrap(stored) {
  if (
    stored &&
    typeof stored === "object" &&
    !Array.isArray(stored) &&
    "t" in stored &&
    "d" in stored &&
    typeof stored.t === "number"
  ) {
    return stored;
  }
  return { t: 0, d: stored };
}

function pickNewest(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.t >= b.t ? a : b;
}

function readLocalEnvelope(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === "") return null;
    return unwrap(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalEnvelope(key, envelope) {
  try {
    localStorage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch (err) {
    console.warn("localStorage save failed", key, err);
    return false;
  }
}

/** Ask iOS/Safari to keep storage (helps home-screen web apps). */
export function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

/** Sync read from localStorage (fast hydrate). */
export function loadJSON(key, fallback) {
  const env = readLocalEnvelope(key);
  return env ? env.d : fallback;
}

/** Write to localStorage + IndexedDB. Fire-and-forget. */
export function saveJSON(key, value) {
  void saveJSONAsync(key, value);
}

/** Awaitable write — use for plan saves on mobile before navigating away. */
export async function saveJSONAsync(key, value) {
  const envelope = wrap(value);
  writeLocalEnvelope(key, envelope);
  try {
    await idbSet(key, envelope);
  } catch (err) {
    console.warn("IndexedDB save failed", key, err);
    dbPromise = null;
  }
  return envelope.t;
}

/**
 * Prefer the newest copy between IndexedDB and localStorage.
 * (Blindly preferring IDB was wiping newer plan saves on iPhone.)
 */
export async function hydrateJSON(key, fallback) {
  let idbEnv = null;
  try {
    const fromIdb = await idbGet(key);
    if (fromIdb != null) idbEnv = unwrap(fromIdb);
  } catch {
    dbPromise = null;
  }

  const lsEnv = readLocalEnvelope(key);
  const best = pickNewest(lsEnv, idbEnv);
  if (!best) return fallback;

  // Sync both stores to the winner so they stay aligned.
  writeLocalEnvelope(key, best);
  try {
    await idbSet(key, best);
  } catch {
    /* ignore */
  }
  return best.d;
}

export function loadString(key, fallback = "") {
  const env = readLocalEnvelope(key);
  if (env != null) {
    if (typeof env.d === "string") return env.d;
    if (typeof env.d === "number" || typeof env.d === "boolean") {
      return String(env.d);
    }
  }
  // Legacy bare string (pre-envelope), when JSON.parse didn't apply.
  try {
    const v = localStorage.getItem(key);
    if (v == null) return fallback;
    // If it looks like an envelope JSON object, already handled above.
    if (v.startsWith("{") && v.includes('"d"')) return fallback;
    return v;
  } catch {
    return fallback;
  }
}

export function saveString(key, value) {
  void saveJSONAsync(key, value);
}

export async function hydrateString(key, fallback = "") {
  const value = await hydrateJSON(key, fallback);
  return typeof value === "string" ? value : fallback;
}

/** Runtime storage health check — used by the Profile diagnostics panel. */
export async function storageDiagnostics() {
  const out = {
    standalone: false,
    localStorage: "unknown",
    indexedDB: "unknown",
    persisted: "unknown",
    origin: "",
  };

  try {
    out.standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
  } catch {
    /* ignore */
  }

  try {
    out.origin = window.location.origin;
  } catch {
    /* ignore */
  }

  // localStorage round-trip.
  try {
    const k = "__lift_ls_probe__";
    localStorage.setItem(k, "1");
    out.localStorage = localStorage.getItem(k) === "1" ? "ok" : "read-failed";
    localStorage.removeItem(k);
  } catch {
    out.localStorage = "blocked";
  }

  // IndexedDB round-trip.
  try {
    await idbSet("__lift_idb_probe__", { t: Date.now(), d: 1 });
    const v = await idbGet("__lift_idb_probe__");
    out.indexedDB = v && v.d === 1 ? "ok" : "read-failed";
  } catch {
    out.indexedDB = "blocked";
  }

  try {
    if (navigator.storage?.persisted) {
      out.persisted = (await navigator.storage.persisted()) ? "yes" : "no";
    }
  } catch {
    /* ignore */
  }

  return out;
}
