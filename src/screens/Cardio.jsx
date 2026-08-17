import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Timer,
  Flame,
  Route,
  HeartPulse,
} from "lucide-react";
import TopNav from "../components/TopNav";
import {
  CARDIO_TYPES,
  getCardioType,
  formatDuration,
  formatDistance,
} from "../data/cardio";
import {
  hydrateCardio,
  loadCardioSync,
  saveCardio,
} from "../lib/cardioStorage";

export default function Cardio() {
  const [sessions, setSessions] = useState(loadCardioSync);
  const [ready, setReady] = useState(false);
  const [logging, setLogging] = useState(null); // type object | null
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    hydrateCardio().then((list) => {
      if (cancelled) return;
      if (!dirtyRef.current) setSessions(list);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveCardio(sessions);
  }, [sessions, ready]);

  useEffect(() => {
    const flush = () => {
      if (!ready) return;
      saveCardio(sessions);
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [sessions, ready]);

  const totals = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = sessions.filter(
      (s) => new Date(s.dateISO).getTime() >= weekAgo,
    );
    const mins = thisWeek.reduce((sum, s) => sum + (s.durationMin || 0), 0);
    return { count: thisWeek.length, mins };
  }, [sessions]);

  const addSession = (session) => {
    dirtyRef.current = true;
    setSessions((list) => {
      const next = [session, ...list];
      saveCardio(next);
      return next;
    });
    setLogging(null);
  };

  const deleteSession = (id) => {
    dirtyRef.current = true;
    setSessions((list) => {
      const next = list.filter((s) => s.id !== id);
      saveCardio(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav
        title="Cardio"
        actionLabel="Log"
        actionIcon={Plus}
        onAction={() => setLogging(CARDIO_TYPES[0])}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-bg-2 border border-line rounded-card px-4 py-3">
            <div className="text-[11px] font-medium text-ink-3 uppercase tracking-wide">
              This week
            </div>
            <div className="text-2xl font-medium text-accent tracking-tight mt-0.5">
              {totals.count}
            </div>
            <div className="text-xs text-ink-2">sessions</div>
          </div>
          <div className="bg-bg-2 border border-line rounded-card px-4 py-3">
            <div className="text-[11px] font-medium text-ink-3 uppercase tracking-wide">
              Duration
            </div>
            <div className="text-2xl font-medium text-ink tracking-tight mt-0.5">
              {formatDuration(totals.mins)}
            </div>
            <div className="text-xs text-ink-2">this week</div>
          </div>
        </div>

        <div className="text-[13px] font-medium text-ink-2 uppercase tracking-wide mb-2.5">
          Activities
        </div>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {CARDIO_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setLogging(type)}
              className="bg-bg-2 border border-line rounded-card p-3.5 text-left active:border-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-[10px] bg-bg-3 flex items-center justify-center text-accent mb-2.5">
                <HeartPulse size={18} />
              </div>
              <div className="text-sm font-medium text-ink">{type.name}</div>
              <div className="text-[11px] text-ink-2 mt-0.5">
                {type.tracksDistance ? "Time · distance" : "Time"}
              </div>
            </button>
          ))}
        </div>

        <div className="text-[13px] font-medium text-ink-2 uppercase tracking-wide mb-2.5">
          Recent
        </div>
        {sessions.length === 0 ? (
          <div className="rounded-card border border-line bg-bg-2 px-4 py-8 text-center text-sm text-ink-2">
            No cardio logged yet. Pick an activity above.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const type = getCardioType(session.typeId);
              const dist = formatDistance(
                session.distance,
                type?.distanceUnit || "mi",
              );
              return (
                <div
                  key={session.id}
                  className="bg-bg-2 border border-line rounded-card p-3.5 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center text-accent shrink-0">
                    <HeartPulse size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[15px] font-medium text-ink truncate">
                        {type?.name ?? "Cardio"}
                      </div>
                      <span className="text-[11px] text-ink-3 shrink-0">
                        {session.dateLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-ink-2">
                      <span className="flex items-center gap-1">
                        <Timer size={12} />
                        {formatDuration(session.durationMin)}
                      </span>
                      {dist && (
                        <span className="flex items-center gap-1">
                          <Route size={12} />
                          {dist}
                        </span>
                      )}
                      {session.calories != null && session.calories > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame size={12} />
                          {Math.round(session.calories)} cal
                        </span>
                      )}
                    </div>
                    {session.notes ? (
                      <div className="mt-1.5 text-[11px] text-ink-3 truncate">
                        {session.notes}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 shrink-0"
                    aria-label="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {logging && (
        <LogCardioSheet
          type={logging}
          onClose={() => setLogging(null)}
          onSave={addSession}
        />
      )}
    </div>
  );
}

function LogCardioSheet({ type: initialType, onClose, onSave }) {
  const [type, setType] = useState(initialType);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");

  const canSave = Number(duration) > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    const now = new Date();
    onSave({
      id: `c-${Date.now()}`,
      typeId: type.id,
      durationMin: Number(duration),
      distance:
        type.tracksDistance && distance !== "" ? Number(distance) : null,
      calories: calories !== "" ? Number(calories) : null,
      notes: notes.trim(),
      dateISO: now.toISOString(),
      dateLabel: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-2 border border-line rounded-t-3xl w-full max-w-[480px] px-4 pt-3 pb-safe-sheet"
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-bg-4" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-medium text-ink tracking-tight">
              Log {type.name.toLowerCase()}
            </div>
            <div className="text-sm text-ink-2 mt-0.5">Track this session</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center text-ink-2"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 -mx-1 px-1">
          {CARDIO_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setType(t);
                if (!t.tracksDistance) setDistance("");
              }}
              className={`shrink-0 h-8 px-3 rounded-pill border text-xs ${
                t.id === type.id
                  ? "bg-accent text-bg border-accent"
                  : "border-line text-ink-2"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-wide mb-1.5">
          Duration (min)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="30"
          autoFocus
          className="w-full mb-3 bg-bg-3 border border-line rounded-xl px-3.5 py-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />

        {type.tracksDistance && (
          <>
            <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-wide mb-1.5">
              Distance ({type.distanceUnit})
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder={type.distanceUnit === "mi" ? "3.1" : "2000"}
              className="w-full mb-3 bg-bg-3 border border-line rounded-xl px-3.5 py-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
          </>
        )}

        <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-wide mb-1.5">
          Calories (optional)
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="250"
          className="w-full mb-3 bg-bg-3 border border-line rounded-xl px-3.5 py-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />

        <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-wide mb-1.5">
          Notes (optional)
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Easy pace, hills, etc."
          maxLength={120}
          className="w-full mb-4 bg-bg-3 border border-line rounded-xl px-3.5 py-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={!canSave}
          className="w-full bg-accent text-bg rounded-2xl py-3.5 text-[15px] font-medium disabled:opacity-40"
        >
          Save session
        </button>
      </form>
    </div>
  );
}
