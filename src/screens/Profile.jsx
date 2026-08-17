import { useEffect, useState } from 'react';
import { Flame, Scale, Moon, Sun, Timer, RefreshCw, Pencil } from 'lucide-react';
import TopNav from '../components/TopNav';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { useTheme } from '../hooks/useTheme';
import { useLocalUser } from '../hooks/useLocalUser';
import {
  REST_PRESETS,
  formatRestLabel,
  hydrateDefaultRestSecs,
  loadDefaultRestSecs,
  saveDefaultRestSecs,
} from '../data/restPresets';
import { requestPersistentStorage } from '../lib/persist';

async function forceUpdate() {
  try {
    requestPersistentStorage();
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }
    if (window.caches?.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
    }
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export default function Profile() {
  const { unit, toggleUnit, labelLong, formatVolume } = useWeightUnit();
  const { theme, setTheme } = useTheme();
  const { name, setName, initials, sinceLabel } = useLocalUser();
  const [restSecs, setRestSecs] = useState(loadDefaultRestSecs);
  const [pickingRest, setPickingRest] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);

  useEffect(() => {
    hydrateDefaultRestSecs().then(setRestSecs);
    requestPersistentStorage();
  }, []);

  useEffect(() => {
    setNameDraft(name);
  }, [name]);

  const chooseRest = (secs) => {
    setRestSecs(secs);
    saveDefaultRestSecs(secs);
    setPickingRest(false);
  };

  const saveName = () => {
    const next = nameDraft.trim();
    if (!next) return;
    setName(next);
    setEditingName(false);
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Profile" />

      <div className="flex-1 overflow-y-auto">
        <div className="text-center px-4 pt-5 pb-4">
          <div className="w-[72px] h-[72px] rounded-full bg-accent text-bg text-2xl font-medium flex items-center justify-center mx-auto mb-3">
            {initials}
          </div>
          <div className="text-xl font-medium text-ink tracking-tight">{name}</div>
          {sinceLabel && (
            <div className="text-sm text-ink-2 mt-1">Lifting since {sinceLabel}</div>
          )}
          <button
            type="button"
            onClick={() => {
              setNameDraft(name);
              setEditingName(true);
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-accent font-medium"
          >
            <Pencil size={13} />
            Edit name
          </button>
        </div>

        <div className="mx-4 mb-4 bg-accent-soft border border-accent-border rounded-card p-4 flex items-center justify-between">
          <div>
            <div className="text-4xl font-medium text-accent tracking-tight">0</div>
            <div className="text-xs text-accent-text">week streak</div>
          </div>
          <Flame size={40} className="text-accent-border" />
        </div>

        <div className="grid grid-cols-3 gap-2 mx-4 mb-4">
          <MiniStat value={0} label="sessions" />
          <MiniStat value={formatVolume(0)} label={`${labelLong} total`} />
          <MiniStat value={0} label="PRs set" />
        </div>

        <div className="mx-4 mb-2 text-[10px] font-medium text-ink-3 uppercase tracking-wide">
          Settings
        </div>
        <div className="mx-4 bg-bg-2 rounded-card overflow-hidden border border-line">
          <button
            type="button"
            onClick={toggleUnit}
            className="w-full flex items-center justify-between px-4 py-3.5 border-b border-line text-left"
          >
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <Scale size={18} className="text-ink-2" />
              Weight unit
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[13px] px-2.5 py-1 rounded-pill border ${unit === 'lbs' ? 'bg-accent text-bg border-accent' : 'border-line text-ink-2'}`}>
                lbs
              </span>
              <span className={`text-[13px] px-2.5 py-1 rounded-pill border ${unit === 'kg' ? 'bg-accent text-bg border-accent' : 'border-line text-ink-2'}`}>
                kg
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPickingRest(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 border-b border-line text-left"
          >
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <Timer size={18} className="text-ink-2" />
              Rest timer
            </div>
            <span className="text-[13px] text-accent">{formatRestLabel(restSecs)} default</span>
          </button>
          <div className="w-full flex items-center justify-between px-4 py-3.5 text-left">
            <div className="flex items-center gap-2.5 text-sm text-ink">
              {theme === 'dark' ? (
                <Moon size={18} className="text-ink-2" />
              ) : (
                <Sun size={18} className="text-ink-2" />
              )}
              Theme
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`text-[13px] px-2.5 py-1 rounded-pill border ${theme === 'dark' ? 'bg-accent text-bg border-accent' : 'border-line text-ink-2'}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`text-[13px] px-2.5 py-1 rounded-pill border ${theme === 'light' ? 'bg-accent text-bg border-accent' : 'border-line text-ink-2'}`}
              >
                Light
              </button>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-2 mb-4 text-[11px] text-ink-3">
          Tap a setting to change it.
        </div>

        <div className="mx-4 mb-6 bg-bg-2 rounded-card overflow-hidden border border-line">
          <button
            type="button"
            onClick={forceUpdate}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <RefreshCw size={18} className="text-ink-2" />
              Update to latest version
            </div>
            <span className="text-[13px] text-accent">Reload</span>
          </button>
        </div>
      </div>

      {editingName && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm px-4 pb-safe-sheet"
          onClick={() => setEditingName(false)}
        >
          <div
            className="bg-bg-2 border border-line rounded-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-ink mb-1">Your name</div>
            <div className="text-xs text-ink-2 mb-4">
              Shown on your home screen greeting.
            </div>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={40}
              className="w-full mb-4 bg-bg-3 border border-line rounded-xl px-3.5 py-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={saveName}
              disabled={!nameDraft.trim()}
              className="w-full bg-accent text-bg rounded-xl py-3 text-sm font-medium disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {pickingRest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm px-4 pb-safe-sheet"
          onClick={() => setPickingRest(false)}
        >
          <div
            className="bg-bg-2 border border-line rounded-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-ink mb-1">Default rest timer</div>
            <div className="text-xs text-ink-2 mb-4">
              Starts after you complete a set. Exercises with their own rest time still override this.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {REST_PRESETS.map((p) => (
                <button
                  key={p.secs}
                  type="button"
                  onClick={() => chooseRest(p.secs)}
                  className={`h-9 px-3.5 rounded-pill border text-sm ${
                    restSecs === p.secs
                      ? 'bg-accent text-bg border-accent'
                      : 'border-line text-ink-2'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Custom seconds"
                defaultValue={REST_PRESETS.some((p) => p.secs === restSecs) ? '' : String(restSecs)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  e.target.value = raw;
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  const raw = e.currentTarget.value.replace(/\D/g, '');
                  if (!raw) return;
                  chooseRest(Math.max(1, Math.min(3600, parseInt(raw, 10))));
                }}
                className="flex-1 bg-bg-3 border border-line rounded-xl text-ink text-sm px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-ink-3"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  const raw = String(input?.value || '').replace(/\D/g, '');
                  if (!raw) return;
                  chooseRest(Math.max(1, Math.min(3600, parseInt(raw, 10))));
                }}
                className="h-10 px-4 rounded-xl bg-accent text-bg text-sm font-medium shrink-0"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="bg-bg-2 rounded-xl p-3 text-center border border-line">
      <div className="text-xl font-medium text-ink tracking-tight">{value}</div>
      <div className="text-[11px] text-ink-2 mt-0.5">{label}</div>
    </div>
  );
}
