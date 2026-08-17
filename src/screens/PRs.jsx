import { useState, useMemo, useEffect } from "react";
import { Plus, Trophy, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import TopNav from "../components/TopNav";
import { exerciseLibrary, PR_EXERCISE_IDS } from "../data/mockData";
import { useWeightUnit } from "../hooks/useWeightUnit";
import { useChartColors } from "../hooks/useTheme";
import { hydrateJSON, loadJSON, saveJSON } from "../lib/persist";

const STORAGE_KEY = "userPRs_v6";

const prExercises = exerciseLibrary.filter((ex) =>
  PR_EXERCISE_IDS.includes(ex.id),
);

function normalizePRs(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((pr) => PR_EXERCISE_IDS.includes(pr.exerciseId));
}

function loadPRsSync() {
  return normalizePRs(loadJSON(STORAGE_KEY, []));
}

export default function PRs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prs, setPrs] = useState(loadPRsSync);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState(() => loadPRsSync()[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(() => searchParams.get("add") === "1");
  const { label, fromLbs, toLbs, format } = useWeightUnit();
  const chart = useChartColors();

  useEffect(() => {
    let cancelled = false;
    hydrateJSON(STORAGE_KEY, []).then((stored) => {
      if (cancelled) return;
      const next = normalizePRs(stored);
      setPrs(next);
      setSelectedId((id) => next.find((p) => p.id === id)?.id ?? next[0]?.id ?? null);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setShowAdd(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!ready) return;
    saveJSON(STORAGE_KEY, prs);
  }, [prs, ready]);

  const selected = useMemo(
    () => prs.find((p) => p.id === selectedId) ?? prs[0] ?? null,
    [prs, selectedId],
  );

  const addPR = ({ exerciseId, weightDisplay, dateLabel }) => {
    if (!PR_EXERCISE_IDS.includes(exerciseId)) return;
    const exercise = exerciseLibrary.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const weight = toLbs(weightDisplay);
    const existing = prs.find((p) => p.exerciseId === exerciseId);
    const point = { date: dateLabel, weight };

    if (existing) {
      const next = {
        ...existing,
        weight: Math.max(existing.weight, weight),
        date: weight >= existing.weight ? dateLabel : existing.date,
        history: [...existing.history, point].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      };
      setPrs((list) => list.map((p) => (p.id === existing.id ? next : p)));
      setSelectedId(existing.id);
    } else {
      const created = {
        id: `pr-${Date.now()}`,
        exerciseId,
        name: exercise.name,
        muscle: exercise.muscle,
        weight,
        date: dateLabel,
        history: [point],
      };
      setPrs((list) => [created, ...list]);
      setSelectedId(created.id);
    }
    setShowAdd(false);
  };

  const chartData = useMemo(() => {
    if (!selected) return [];
    return selected.history.map((p) => ({
      ...p,
      weight: fromLbs(p.weight),
    }));
  }, [selected, fromLbs]);

  return (
    <div className="flex flex-col h-full">
      <TopNav
        title="PRs"
        actionLabel="Add PR"
        actionIcon={Plus}
        onAction={() => setShowAdd(true)}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {selected && selected.history.length > 0 && (
          <div className="bg-bg-2 border border-line rounded-card p-4 mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-medium text-ink-2 uppercase tracking-wide">
                1RM progress · {selected.name}
              </div>
              <span className="text-xs text-accent">
                {selected.weight != null ? `${format(selected.weight)} ${label}` : "—"}
              </span>
            </div>
            <div className="h-52 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    stroke={chart.line}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: chart.ink2, fontSize: 11 }}
                    axisLine={{ stroke: chart.line }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chart.ink2, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    domain={["dataMin - 10", "dataMax + 10"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: chart.bg2,
                      border: `1px solid ${chart.line}`,
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: chart.ink2 }}
                    itemStyle={{ color: chart.accent }}
                    formatter={(value) => [`${value} ${label}`, "1RM"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={chart.accent}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: chart.accent, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: chart.accent }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="text-[13px] font-medium text-ink-2 uppercase tracking-wide mb-2.5">
          One-rep maxes
        </div>

        {prs.length === 0 && (
          <div className="text-center text-ink-2 text-sm py-10">
            No PRs yet. Add your first 1RM.
          </div>
        )}

        {prs.map((pr) => {
          const active = selected?.id === pr.id;
          const prev =
            pr.history.length > 1
              ? pr.history[pr.history.length - 2].weight
              : null;
          const delta =
            prev != null ? fromLbs(pr.weight) - fromLbs(prev) : null;

          return (
            <button
              key={pr.id}
              type="button"
              onClick={() => setSelectedId(pr.id)}
              className={`w-full text-left bg-bg-2 rounded-card p-3.5 px-4 mb-2 border flex items-center justify-between ${
                active ? "border-accent" : "border-line"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                    active
                      ? "bg-accent text-bg"
                      : "bg-bg-3 text-ink-2"
                  }`}
                >
                  <Trophy size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">
                    {pr.name}
                  </div>
                  <div className="text-xs text-ink-2 mt-0.5">
                    {pr.muscle}
                    {pr.date ? ` · ${pr.date}` : " · No PR yet"}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-lg font-medium text-accent tracking-tight">
                  {pr.weight != null ? format(pr.weight) : "—"}
                  {pr.weight != null && (
                    <span className="text-xs text-ink-2 ml-1">{label}</span>
                  )}
                </div>
                {delta != null && delta !== 0 && (
                  <div className="text-[11px] text-accent-dim mt-0.5">
                    {delta > 0 ? "+" : ""}
                    {Math.round(delta * 10) / 10} {label}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showAdd && (
        <AddPRModal
          existingIds={prs.map((p) => p.exerciseId)}
          onClose={() => setShowAdd(false)}
          onSave={addPR}
        />
      )}
    </div>
  );
}

function AddPRModal({ onClose, onSave }) {
  const { labelLong } = useWeightUnit();
  const [exerciseId, setExerciseId] = useState(prExercises[0]?.id ?? "");
  const [weight, setWeight] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const w = Number(weight);
    if (!exerciseId || !w || w <= 0) return;
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    onSave({ exerciseId, weightDisplay: w, dateLabel });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm px-4 pb-safe-sheet">
      <form
        onSubmit={submit}
        className="bg-bg-2 border border-line rounded-2xl w-full max-w-sm p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-ink">Add 1RM PR</div>
          <button type="button" onClick={onClose} className="text-ink-2">
            <X size={18} />
          </button>
        </div>

        <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-wide mb-1.5">
          Exercise
        </label>
        <select
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          className="w-full mb-3 bg-bg-3 border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
        >
          {prExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>

        <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-wide mb-1.5">
          Weight ({labelLong})
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={labelLong === "kg" ? "100" : "225"}
          className="w-full mb-4 bg-bg-3 border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={!weight || Number(weight) <= 0}
          className="w-full bg-accent text-bg rounded-2xl py-3 text-sm font-medium disabled:opacity-50"
        >
          Save PR
        </button>
      </form>
    </div>
  );
}
