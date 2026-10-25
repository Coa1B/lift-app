import { useEffect, useState } from 'react';
import { Scale, Moon, Sun, Timer, RefreshCw, Pencil, Trophy, User, ChevronRight } from 'lucide-react';
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
import { usePRs, useWorkouts } from '../hooks/useStoredData';
import { formatDuration, lifetimeSummary } from '../lib/workoutsStorage';

const BEST_LIFTS = 5;

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
  const { unit, toggleUnit, label, labelLong, formatVolume, format } = useWeightUnit();
  const { theme, setTheme } = useTheme();
  const { name, setName, initials, sinceLabel } = useLocalUser();
  const [restSecs, setRestSecs] = useState(loadDefaultRestSecs);
  const [pickingRest, setPickingRest] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const workouts = useWorkouts();
  const prs = usePRs();
  const lifetime = lifetimeSummary(workouts);
  const prCount = prs.reduce((sum, pr) => sum + (pr.history?.length ?? 0), 0);
  const bestLifts = computeBestLifts(prs, workouts);

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

  const openNameEditor = () => {
    setNameDraft(name);
    setEditingName(true);
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

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="mx-4 mt-1 mb-7 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-accent text-bg text-xl font-medium flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-medium text-ink tracking-tight truncate">{name}</div>
            {sinceLabel && (
              <div className="text-xs text-ink-2 mt-0.5">Lifting since {sinceLabel}</div>
            )}
          </div>
          <button
            type="button"
            onClick={openNameEditor}
            className="w-10 h-10 rounded-full bg-bg-2 flex items-center justify-center text-ink-2 active:bg-bg-3 shrink-0"
            aria-label="Edit name"
          >
            <Pencil size={15} />
          </button>
        </div>

        <SectionTitle>Lifetime</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 mx-4 mb-7">
          <StatTile value={lifetime.workouts} label={lifetime.workouts === 1 ? 'workout' : 'workouts'} />
          <StatTile value={formatVolume(lifetime.volumeLbs)} label={`${labelLong} lifted`} />
          <StatTile value={formatDuration(lifetime.durationSec)} label="time training" />
          <StatTile value={prCount} label={prCount === 1 ? 'PR logged' : 'PRs logged'} />
        </div>

        <SectionTitle>Best lifts</SectionTitle>
        <div className="mx-2 mb-7">
          {bestLifts.length === 0 ? (
            <div className="px-3 py-3 text-sm text-ink-3">
              Log a PR or finish a workout to see your heaviest lifts.
            </div>
          ) : (
            bestLifts.map((lift) => (
              <div
                key={lift.name}
                className="flex items-center gap-3 px-2 py-3 border-t border-line/60 first:border-t-0"
              >
                <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Trophy size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-ink truncate">{lift.name}</div>
                  <div className="text-xs text-ink-3 mt-0.5">{lift.isPR ? '1RM' : 'Heaviest set'}</div>
                </div>
                <div className="text-[15px] font-semibold text-ink tracking-tight shrink-0">
                  {format(lift.weight)}
                  <span className="text-xs text-ink-2 font-normal"> {label}</span>
                  {!lift.isPR && lift.reps > 0 && (
                    <span className="text-ink-2 font-normal"> × {lift.reps}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <SectionTitle>Settings</SectionTitle>
        <div className="mx-4 bg-bg-2 rounded-3xl overflow-hidden">
          <SettingRow icon={User} label="Name" onClick={openNameEditor}>
            <span className="text-[13px] text-ink-2 truncate max-w-[140px]">{name}</span>
            <ChevronRight size={16} className="text-ink-3" />
          </SettingRow>
          <SettingRow icon={Scale} label="Weight unit" onClick={toggleUnit}>
            <Segmented
              options={[['lbs', 'lbs'], ['kg', 'kg']]}
              value={unit}
            />
          </SettingRow>
          <SettingRow icon={Timer} label="Default rest" onClick={() => setPickingRest(true)}>
            <span className="text-[13px] text-ink-2">{formatRestLabel(restSecs)}</span>
            <ChevronRight size={16} className="text-ink-3" />
          </SettingRow>
          <SettingRow
            icon={theme === 'dark' ? Moon : Sun}
            label="Theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Segmented
              options={[['dark', 'Dark'], ['light', 'Light']]}
              value={theme}
            />
          </SettingRow>
          <SettingRow icon={RefreshCw} label="Update to latest version" onClick={forceUpdate} last>
            <span className="text-[13px] text-accent">Reload</span>
          </SettingRow>
        </div>
      </div>

      {editingName && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm"
          onClick={() => setEditingName(false)}
        >
          <div
            className="bg-bg-2 rounded-t-3xl w-full max-w-[480px] px-5 pt-5 pb-safe-sheet"
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
              className="w-full mb-4 bg-bg-3 border border-transparent rounded-2xl px-3.5 py-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={saveName}
              disabled={!nameDraft.trim()}
              className="w-full bg-accent text-bg rounded-full py-3.5 text-[15px] font-medium disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {pickingRest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm"
          onClick={() => setPickingRest(false)}
        >
          <div
            className="bg-bg-2 rounded-t-3xl w-full max-w-[480px] px-5 pt-5 pb-safe-sheet"
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
                  className={`h-9 px-3.5 rounded-full text-sm ${
                    restSecs === p.secs
                      ? 'bg-accent text-bg'
                      : 'bg-bg-3 text-ink-2'
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
                className="flex-1 bg-bg-3 border border-transparent rounded-2xl text-ink text-sm px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-ink-3"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  const raw = String(input?.value || '').replace(/\D/g, '');
                  if (!raw) return;
                  chooseRest(Math.max(1, Math.min(3600, parseInt(raw, 10))));
                }}
                className="h-10 px-4 rounded-full bg-accent text-bg text-sm font-medium shrink-0"
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

function SectionTitle({ children }) {
  return (
    <div className="mx-5 mb-2 text-[15px] font-semibold text-ink tracking-tight">{children}</div>
  );
}

function StatTile({ value, label }) {
  return (
    <div className="bg-bg-2 rounded-3xl px-4 py-3.5">
      <div className="text-[22px] font-medium text-ink tracking-tight truncate">{value}</div>
      <div className="text-xs text-ink-2 mt-0.5">{label}</div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, onClick, last = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-bg-3 transition-colors ${
        last ? '' : 'border-b border-line/60'
      }`}
    >
      <span className="flex items-center gap-3 text-sm text-ink min-w-0">
        <Icon size={18} className="text-ink-2 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">{children}</span>
    </button>
  );
}

function Segmented({ options, value }) {
  return (
    <span className="flex items-center gap-0.5 bg-bg-3 rounded-full p-0.5">
      {options.map(([key, text]) => (
        <span
          key={key}
          className={`text-[12px] px-2.5 py-1 rounded-full transition-colors ${
            value === key ? 'bg-accent text-bg font-medium' : 'text-ink-2'
          }`}
        >
          {text}
        </span>
      ))}
    </span>
  );
}

/** Heaviest lift per exercise, from logged 1RMs and finished workouts. */
function computeBestLifts(prs, workouts) {
  const best = new Map();
  const consider = (name, weight, reps, isPR) => {
    if (!(weight > 0)) return;
    const cur = best.get(name);
    if (!cur || weight > cur.weight || (weight === cur.weight && isPR && !cur.isPR)) {
      best.set(name, { name, weight, reps, isPR });
    }
  };
  for (const pr of prs) consider(pr.name, pr.weight, 1, true);
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const set of ex.sets) consider(ex.name, set.weight, set.reps, false);
    }
  }
  return [...best.values()].sort((a, b) => b.weight - a.weight).slice(0, BEST_LIFTS);
}
