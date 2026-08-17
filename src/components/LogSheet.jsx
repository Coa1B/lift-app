import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardPlus,
  FolderOpen,
  Trophy,
  ChevronRight,
  X,
} from "lucide-react";
import { exerciseLibrary } from "../data/mockData";
import { resolveRestSecs } from "../data/restPresets";
import { loadPlansSync } from "../lib/plansStorage";

export function workoutFromPlan(plan) {
  return {
    title: plan.name,
    exercises: plan.exercises.map((item, i) => {
      const ex = exerciseLibrary.find((e) => e.id === item.exerciseId);
      return {
        id: `ex-${item.exerciseId}-${i}-${Date.now()}`,
        name: ex?.name ?? "Unknown exercise",
        muscle: ex?.muscle ?? "",
        equipment: ex?.equipment ?? "",
        prPace: false,
        defaultRestSecs: resolveRestSecs(item.restSecs || plan.restTimerSecs),
        sets: Array.from({ length: Math.max(item.sets || 0, 1) }, (_, si) => ({
          id: `s-${i}-${si}-${Date.now()}`,
          prevWeight: null,
          prevReps: null,
          weight: 0,
          reps: 0,
          done: false,
        })),
        overloadSuggestion: null,
      };
    }),
  };
}

export default function LogSheet({ onClose }) {
  const navigate = useNavigate();
  const [pickingPlan, setPickingPlan] = useState(false);
  const plans = useMemo(() => loadPlansSync(), [pickingPlan]);

  const go = (path, options) => {
    onClose();
    navigate(path, options);
  };

  const options = [
    {
      key: "new",
      title: "Create a new plan",
      subtitle: "Build a workout template from the exercise library",
      icon: ClipboardPlus,
      onClick: () => go("/plans"),
    },
    {
      key: "existing",
      title: "Use an existing plan",
      subtitle: "Start a session from one of your saved plans",
      icon: FolderOpen,
      onClick: () => setPickingPlan(true),
    },
    {
      key: "pr",
      title: "Log a PR",
      subtitle: "Record a new one-rep max",
      icon: Trophy,
      onClick: () => go("/prs?add=1"),
    },
  ];

  const startPlan = (plan) => {
    go("/log/session", { state: { workout: workoutFromPlan(plan) } });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-line rounded-t-3xl w-full max-w-[480px] px-4 pt-3 pb-safe-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-bg-4" />
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <div className="text-lg font-medium text-ink tracking-tight">Log</div>
            <div className="text-sm text-ink-2 mt-0.5">What do you want to log?</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center text-ink-2"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          {options.map(({ key, title, subtitle, icon: Icon, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="w-full text-left bg-bg-3 border border-line rounded-card px-4 py-4 flex items-center gap-3.5 active:border-accent"
            >
              <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center text-accent shrink-0">
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-ink">{title}</div>
                <div className="text-xs text-ink-2 mt-0.5 leading-snug">{subtitle}</div>
              </div>
              <ChevronRight size={18} className="text-ink-3 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {pickingPlan && (
        <PlanPicker
          plans={plans}
          onClose={() => setPickingPlan(false)}
          onSelect={startPlan}
        />
      )}
    </div>
  );
}

function PlanPicker({ plans, onClose, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/80 backdrop-blur-sm px-4 pb-safe-sheet"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-line rounded-2xl w-full max-w-sm p-5 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-ink">Choose a plan</div>
          <button type="button" onClick={onClose} className="text-ink-2">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-2">
          {plans.length === 0 && (
            <div className="text-sm text-ink-2 py-6 text-center">
              No saved plans yet. Create one first.
            </div>
          )}
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan)}
              className="w-full text-left bg-bg-3 border border-line rounded-xl px-3.5 py-3"
            >
              <div className="text-sm font-medium text-ink">{plan.name}</div>
              <div className="text-xs text-ink-2 mt-0.5">
                {plan.exercises?.length ?? 0} exercises
                {plan.tag ? ` · ${plan.tag}` : ""}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
