import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Search,
  Play,
  Dumbbell,
  ArrowLeft,
  X,
  Timer,
  Pencil,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TopNav from "../components/TopNav";
import { exerciseLibrary, muscleGroups } from "../data/mockData";
import { workoutFromPlan } from "../components/LogSheet";
import {
  hydratePlans,
  loadPlansSync,
  savePlans,
} from "../lib/plansStorage";
import { loadDefaultRestSecs, formatRestLabel } from "../data/restPresets";

function resolveExercises(plan) {
  return (plan.exercises || []).map((item) => {
    const ex = exerciseLibrary.find((e) => e.id === item.exerciseId);
    return {
      ...item,
      name: ex?.name ?? "Unknown",
      muscle: ex?.muscle ?? "",
    };
  });
}

function planToDraft(plan) {
  const fallbackRest = loadDefaultRestSecs();
  return resolveExercises(plan).map((ex) => ({
    id: ex.exerciseId,
    name: ex.name,
    muscle: ex.muscle,
    sets: ex.sets,
    reps: ex.reps,
    restSecs: ex.restSecs > 0 ? ex.restSecs : fallbackRest,
  }));
}

export default function Plans() {
  const navigate = useNavigate();
  const [savedPlans, setSavedPlans] = useState(loadPlansSync);
  const [ready, setReady] = useState(false);
  const [editorPlan, setEditorPlan] = useState(null); // null | plan object | "new"
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    hydratePlans().then((plans) => {
      if (cancelled) return;
      // Don't clobber a plan the user just saved while hydrate was in flight.
      if (!dirtyRef.current) {
        setSavedPlans(plans);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePlans(savedPlans);
  }, [savedPlans, ready]);

  // Flush to storage if the app is backgrounded (common on iPhone).
  useEffect(() => {
    const flush = () => {
      if (!ready) return;
      savePlans(savedPlans);
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [savedPlans, ready]);

  const startPlan = (plan) => {
    navigate("/log/session", { state: { workout: workoutFromPlan(plan) } });
  };

  const deletePlan = (id) => {
    dirtyRef.current = true;
    setSavedPlans((plans) => {
      const next = plans.filter((p) => p.id !== id);
      savePlans(next);
      return next;
    });
  };

  const savePlan = (plan) => {
    dirtyRef.current = true;
    setSavedPlans((plans) => {
      const exists = plans.some((p) => p.id === plan.id);
      const next = exists
        ? plans.map((p) => (p.id === plan.id ? { ...p, ...plan } : p))
        : [plan, ...plans];
      savePlans(next);
      return next;
    });
    setEditorPlan(null);
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav
        title="Plans"
        actionLabel="New"
        actionIcon={Plus}
        onAction={() => setEditorPlan("new")}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {savedPlans.length === 0 ? (
          <EmptyState onCreate={() => setEditorPlan("new")} />
        ) : (
          <div className="space-y-3">
            {savedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onStart={() => startPlan(plan)}
                onEdit={() => setEditorPlan(plan)}
                onDelete={() => deletePlan(plan.id)}
              />
            ))}
          </div>
        )}
      </div>

      {editorPlan && (
        <PlanEditor
          plan={editorPlan === "new" ? null : editorPlan}
          onClose={() => setEditorPlan(null)}
          onSave={savePlan}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-bg-2 border border-line flex items-center justify-center text-accent mb-4">
        <Dumbbell size={24} />
      </div>
      <div className="text-lg font-medium text-ink tracking-tight mb-1">
        No plans yet
      </div>
      <div className="text-sm text-ink-2 mb-5 leading-relaxed">
        Build a template once, then start it whenever you train.
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="bg-accent text-bg rounded-pill px-5 py-2.5 text-sm font-medium flex items-center gap-1.5"
      >
        <Plus size={16} /> Create plan
      </button>
    </div>
  );
}

function PlanCard({ plan, onStart, onEdit, onDelete }) {
  const exercises = resolveExercises(plan);
  const preview = exercises.slice(0, 4);
  const extra = exercises.length - preview.length;

  return (
    <div className="bg-bg-2 border border-line rounded-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-ink tracking-tight truncate">
              {plan.name}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-ink-2">
              <span className="flex items-center gap-1">
                <Dumbbell size={12} /> {exercises.length} exercises
              </span>
              {plan.tag && (
                <span className="text-accent bg-accent-soft border border-accent-border px-2 py-0.5 rounded-pill">
                  {plan.tag}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-accent"
              aria-label="Edit plan"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-red-400"
              aria-label="Delete plan"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {preview.map((ex, i) => (
            <span
              key={`${ex.exerciseId}-${i}`}
              className="text-[11px] px-2.5 py-1 rounded-pill border border-line bg-bg-3 text-ink-2"
            >
              {ex.name}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-pill border border-line bg-bg-3 text-ink-3">
              +{extra} more
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onStart}
          className="w-full bg-accent text-bg rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Play size={14} fill="currentColor" /> Start workout
        </button>
      </div>
    </div>
  );
}

function PlanEditor({ plan, onClose, onSave }) {
  const isEditing = Boolean(plan?.id);
  const [name, setName] = useState(plan?.name ?? "");
  const [draft, setDraft] = useState(() => (plan ? planToDraft(plan) : []));
  const [picking, setPicking] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const addExercise = (ex) => {
    if (draft.find((d) => d.id === ex.id)) return;
    setDraft((d) => [
      ...d,
      {
        id: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        sets: 3,
        reps: 8,
        restSecs: loadDefaultRestSecs(),
      },
    ]);
    setPicking(false);
  };

  const updateItem = (item) =>
    setDraft((d) => d.map((i) => (i.id === item.id ? item : i)));
  const removeItem = (id) => setDraft((d) => d.filter((i) => i.id !== id));

  const reorderDraft = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const canSave = name.trim().length > 0 && draft.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const fallbackRest = loadDefaultRestSecs();
    onSave({
      id: plan?.id ?? `p-${Date.now()}`,
      name: name.trim(),
      tag: plan?.tag,
      restTimerSecs: plan?.restTimerSecs > 0 ? plan.restTimerSecs : fallbackRest,
      exercises: draft.map((d) => ({
        exerciseId: d.id,
        sets: d.sets,
        reps: d.reps,
        restSecs: d.restSecs > 0 ? d.restSecs : fallbackRest,
      })),
    });
  };

  return (
    <div className="absolute inset-0 z-40 bg-bg flex flex-col">
      <div className="flex items-center justify-between px-4 pt-safe pb-3 border-b border-line">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-[15px] font-medium text-ink">
          {isEditing ? "Edit plan" : "New plan"}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="text-[13px] font-medium text-accent disabled:text-ink-3 px-1"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <label className="block text-[11px] font-medium text-ink-3 uppercase tracking-wide mb-1.5">
          Plan name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Push Day A"
          autoFocus={!isEditing}
          className="w-full mb-5 bg-bg-2 border border-line rounded-xl px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />

        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[13px] font-medium text-ink-2 uppercase tracking-wide">
            Exercises
          </div>
          <span className="text-xs text-ink-3">{draft.length}</span>
        </div>

        {draft.length === 0 ? (
          <div className="bg-bg-2 border border-dashed border-line rounded-card px-4 py-8 text-center mb-3">
            <div className="text-sm text-ink-2 mb-3">No exercises yet</div>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="inline-flex items-center gap-1.5 text-sm text-accent font-medium"
            >
              <Plus size={16} /> Add exercise
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={reorderDraft}
          >
            <SortableContext
              items={draft.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2.5 mb-3">
                {draft.map((item, index) => (
                  <SortableDraftCard
                    key={item.id}
                    item={item}
                    index={index}
                    onChange={updateItem}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {draft.length > 0 && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="w-full bg-bg-2 border border-dashed border-line rounded-card py-3.5 flex items-center justify-center gap-2 text-sm text-ink-2"
          >
            <Plus size={16} /> Add exercise
          </button>
        )}
      </div>

      <div className="px-4 pb-safe pt-3 border-t border-line">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full bg-accent text-bg rounded-2xl py-3.5 text-[15px] font-medium disabled:opacity-40"
        >
          {isEditing ? "Save changes" : "Save plan"}
        </button>
      </div>

      {picking && (
        <ExercisePicker
          selectedIds={draft.map((d) => d.id)}
          onClose={() => setPicking(false)}
          onAdd={addExercise}
        />
      )}
    </div>
  );
}

function SortableDraftCard({ item, index, onChange, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DraftCard
        item={item}
        index={index}
        onChange={onChange}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

function DraftCard({
  item,
  index,
  onChange,
  onRemove,
  dragHandleProps,
  isDragging,
}) {
  return (
    <div
      className={`bg-bg-2 border rounded-card p-3.5 ${
        isDragging ? "border-accent shadow-lg" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-1 min-w-0 flex-1">
          <button
            type="button"
            className="touch-none w-8 h-8 -ml-1 rounded-lg flex items-center justify-center text-ink-3 active:text-ink shrink-0 cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...dragHandleProps}
          >
            <GripVertical size={16} />
          </button>
          <div className="min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink-3 font-medium w-4">
                {index + 1}
              </span>
              <div className="text-sm font-medium text-ink truncate">
                {item.name}
              </div>
            </div>
            {item.muscle && (
              <div className="text-xs text-ink-2 mt-0.5 ml-6">{item.muscle}</div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-red-400 shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field
          label="Sets"
          value={item.sets}
          onChange={(v) => onChange({ ...item, sets: v })}
        />
        <Field
          label="Reps"
          value={item.reps}
          onChange={(v) => onChange({ ...item, reps: v })}
        />
        <Field
          label="Rest (s)"
          value={item.restSecs}
          onChange={(v) =>
            onChange({
              ...item,
              restSecs: v > 0 ? v : loadDefaultRestSecs(),
            })
          }
          icon={Timer}
          hint={`between sets · ${formatRestLabel(item.restSecs || loadDefaultRestSecs())}`}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, icon: Icon, hint }) {
  const [draft, setDraft] = useState(() => (value === 0 || value == null ? "" : String(value)));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value === 0 || value == null ? "" : String(value));
  }, [value, focused]);

  const commit = (raw) => {
    if (raw === "") {
      onChange(0);
      return;
    }
    const n = parseInt(raw, 10);
    onChange(Number.isFinite(n) ? n : 0);
  };

  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] font-medium text-ink-3 uppercase tracking-wide mb-1">
        {Icon && <Icon size={10} />}
        {label}
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0"
        value={focused ? draft : value === 0 || value == null ? "" : String(value)}
        onFocus={() => {
          setFocused(true);
          setDraft(value === 0 || value == null ? "" : String(value));
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "");
          setDraft(raw);
          if (raw !== "") commit(raw);
        }}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        className="w-full bg-bg-3 border border-line rounded-lg text-ink text-sm font-medium px-2 py-2 text-center focus:outline-none focus:border-accent placeholder:text-ink-3"
      />
      {hint && (
        <div className="text-[10px] text-ink-3 mt-1 text-center">{hint}</div>
      )}
    </div>
  );
}

function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(gap > 0 ? gap : 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return inset;
}

function ExercisePicker({ selectedIds, onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const kbInset = useKeyboardInset();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exerciseLibrary.filter((ex) => {
      const matchesFilter = filter === "All" || ex.muscle === filter;
      const matchesQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscle.toLowerCase().includes(q) ||
        (ex.region && ex.region.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const grouped = useMemo(() => {
    const order = muscleGroups.filter((m) => m !== "All");
    const groups = {};
    filtered.forEach((ex) => {
      if (!groups[ex.muscle]) groups[ex.muscle] = [];
      groups[ex.muscle].push(ex);
    });
    return order
      .filter((muscle) => groups[muscle]?.length)
      .map((muscle) => ({ muscle, exercises: groups[muscle] }));
  }, [filtered]);

  return (
    <div className="absolute inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-end">
      <div className="bg-bg-2 border-t border-line rounded-t-3xl w-full h-[92%] flex flex-col">
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-bg-4" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
          <div className="text-[15px] font-medium text-ink">Add exercise</div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center text-ink-2"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pb-3 relative shrink-0">
          <Search
            size={16}
            className="absolute left-7 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-bg-3 border border-line rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto shrink-0">
          {muscleGroups.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilter(m)}
              className={`shrink-0 h-8 px-3.5 rounded-pill border text-xs leading-none flex items-center ${
                filter === m
                  ? "bg-accent text-bg border-accent"
                  : "border-line text-ink-2"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div
          className="flex-1 overflow-y-auto px-2 pb-safe-sheet"
          style={kbInset ? { paddingBottom: kbInset + 16 } : undefined}
        >
          {grouped.map(({ muscle, exercises }) => (
            <div key={muscle}>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-medium text-ink-3 uppercase tracking-wide">
                {muscle}
              </div>
              {exercises.map((ex) => {
                const added = selectedIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    disabled={added}
                    onClick={() => onAdd(ex)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left disabled:opacity-40"
                  >
                    <div className="w-10 h-10 rounded-[10px] bg-bg-3 flex items-center justify-center text-ink-2 shrink-0">
                      <Dumbbell size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {ex.name}
                      </div>
                      <div className="text-xs text-ink-2 mt-0.5">
                        {ex.region ? `${ex.region} · ` : ""}
                        {ex.equipment}
                      </div>
                    </div>
                    {added ? (
                      <span className="text-[11px] text-ink-3">Added</span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-accent-soft border border-accent-border text-accent flex items-center justify-center">
                        <Plus size={16} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-sm text-ink-2 py-10">
              No exercises found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
