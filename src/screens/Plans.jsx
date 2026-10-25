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
  planSetTargets,
  savePlans,
} from "../lib/plansStorage";
import { loadDefaultRestSecs } from "../data/restPresets";
import { useWeightUnit } from "../hooks/useWeightUnit";

const DEFAULT_SET_COUNT = 3;

let setIdCounter = 0;
function newSet(weight = 0, reps = 0) {
  setIdCounter += 1;
  return { id: `ps-${Date.now()}-${setIdCounter}`, weight, reps };
}

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
    sets: planSetTargets(ex).map((t) => newSet(t.weight, t.reps)),
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const reorderPlans = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    dirtyRef.current = true;
    setSavedPlans((plans) => {
      const from = plans.findIndex((p) => p.id === active.id);
      const to = plans.findIndex((p) => p.id === over.id);
      if (from < 0 || to < 0) return plans;
      const next = arrayMove(plans, from, to);
      savePlans(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav
        title="Plans"
        actionLabel="New"
        actionIcon={Plus}
        onAction={() => setEditorPlan("new")}
      />

      <div className="flex-1 overflow-y-auto pb-6">
        {savedPlans.length === 0 ? (
          <EmptyState onCreate={() => setEditorPlan("new")} />
        ) : (
          <>
            <div className="px-5 pb-2 text-xs text-ink-3">
              Drag <GripVertical size={11} className="inline -mt-0.5" /> to
              reorder · swipe left to delete
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={reorderPlans}
            >
              <SortableContext
                items={savedPlans.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="px-2">
                  {savedPlans.map((plan) => (
                    <SortablePlanRow
                      key={plan.id}
                      plan={plan}
                      onStart={() => startPlan(plan)}
                      onEdit={() => setEditorPlan(plan)}
                      onDelete={() => deletePlan(plan.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </>
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
      <div className="w-14 h-14 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-4">
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

const SWIPE_ACTION_WIDTH = 88;
// Fraction of the row width past which letting go deletes outright.
const SWIPE_DELETE_FRACTION = 0.6;

function SortablePlanRow(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.plan.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: "relative",
      }}
      className="border-t border-line/60 first:border-t-0"
    >
      <PlanRow
        {...props}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </li>
  );
}

function PlanRow({ plan, onStart, onEdit, onDelete, dragHandleProps, isDragging }) {
  const exercises = resolveExercises(plan);
  const totalSets = (plan.exercises || []).reduce(
    (sum, item) => sum + planSetTargets(item).length,
    0,
  );

  const rowRef = useRef(null);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const open = offset !== 0 && !dragging;

  const remove = () => {
    if (removing) return;
    setRemoving(true);
    setOffset(-(rowRef.current?.offsetWidth ?? 400));
    setTimeout(onDelete, 200);
  };

  const onPointerDown = (e) => {
    if (removing || (e.pointerType === "mouse" && e.button !== 0)) return;
    suppressClick.current = false;
    gesture.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      base: offset,
      axis: null,
    };
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axis === "y") {
        gesture.current = null;
        return;
      }
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer already released; the swipe still works without capture.
      }
      setDragging(true);
    }
    // Left only; resist a little when dragging right past the resting spot.
    const next = g.base + dx;
    setOffset(next > 0 ? next / 4 : next);
  };

  const onPointerEnd = (e) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.id !== e.pointerId || g.axis !== "x") return;
    suppressClick.current = true;
    setDragging(false);
    const width = rowRef.current?.offsetWidth ?? 400;
    if (-offset > width * SWIPE_DELETE_FRACTION) {
      remove();
    } else if (-offset > SWIPE_ACTION_WIDTH / 2) {
      setOffset(-SWIPE_ACTION_WIDTH);
    } else {
      setOffset(0);
    }
  };

  // Returns true when the tap was used up closing the swipe or ending a drag.
  const consumeTap = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return true;
    }
    if (open) {
      setOffset(0);
      return true;
    }
    return false;
  };

  return (
    <div
      ref={rowRef}
      className={`relative overflow-hidden rounded-2xl transition-opacity duration-200 ${
        removing ? "opacity-0" : ""
      }`}
    >
      <button
        type="button"
        onClick={remove}
        tabIndex={open ? 0 : -1}
        className="absolute inset-y-1.5 right-1 bg-red-500 text-white flex flex-col items-center justify-center gap-1 text-xs font-medium rounded-2xl"
        style={{ width: Math.max(SWIPE_ACTION_WIDTH, -offset) - 4 }}
        aria-label={`Delete ${plan.name}`}
      >
        <Trash2 size={18} />
        Delete
      </button>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Edit ${plan.name}`}
        onClick={() => {
          if (!consumeTap()) onEdit();
        }}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onEdit();
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={`relative flex items-center gap-1 pl-1 pr-3 py-3.5 rounded-2xl cursor-pointer select-none touch-pan-y transition-[background-color,box-shadow] ${
          isDragging ? "bg-bg-2 shadow-2xl shadow-black/40" : "bg-bg active:bg-bg-2"
        }`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 200ms ease",
        }}
      >
        <button
          type="button"
          {...dragHandleProps}
          onPointerDown={(e) => {
            dragHandleProps?.onPointerDown?.(e);
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          className="touch-none self-stretch w-9 flex items-center justify-center text-ink-3 active:text-ink cursor-grab active:cursor-grabbing shrink-0"
          aria-label={`Reorder ${plan.name}`}
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[16px] font-medium text-ink tracking-tight truncate">
              {plan.name}
            </div>
            {plan.tag && (
              <span className="text-[10px] text-accent-text bg-accent-soft px-2 py-0.5 rounded-pill shrink-0">
                {plan.tag}
              </span>
            )}
          </div>
          <div className="text-xs text-ink-2 mt-0.5">
            {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
            {" · "}
            {totalSets} {totalSets === 1 ? "set" : "sets"}
          </div>
          {exercises.length > 0 && (
            <div className="text-xs text-ink-3 mt-1 truncate">
              {exercises.map((ex) => ex.name).join(" · ")}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!consumeTap()) onStart();
          }}
          className="w-11 h-11 rounded-full bg-accent text-bg flex items-center justify-center shrink-0 ml-2 active:scale-95 transition-transform"
          aria-label={`Start ${plan.name}`}
        >
          <Play size={16} fill="currentColor" className="ml-0.5" />
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
        sets: Array.from({ length: DEFAULT_SET_COUNT }, () => newSet()),
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
        // sets/reps kept alongside setTargets for older readers of the plan.
        sets: d.sets.length,
        reps: d.sets[0]?.reps ?? 0,
        setTargets: d.sets.map(({ weight, reps }) => ({ weight, reps })),
        restSecs: d.restSecs > 0 ? d.restSecs : fallbackRest,
      })),
    });
  };

  const totalSets = draft.reduce((sum, d) => sum + d.sets.length, 0);

  return (
    <div className="absolute inset-0 z-40 bg-bg flex flex-col">
      <div className="flex items-center justify-between px-3 pt-safe pb-1">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-ink-2 active:bg-bg-2"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-[13px] text-ink-2">
          {isEditing ? "Edit plan" : "New plan"}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="h-10 px-3 rounded-full text-[14px] font-medium text-accent disabled:text-ink-3"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Plan name"
          aria-label="Plan name"
          autoFocus={!isEditing}
          className="w-full bg-transparent text-[28px] font-semibold tracking-tight text-ink placeholder:text-ink-3 focus:outline-none pt-2"
        />
        <div className="text-xs text-ink-3 mt-1 mb-7">
          {draft.length} {draft.length === 1 ? "exercise" : "exercises"} ·{" "}
          {totalSets} {totalSets === 1 ? "set" : "sets"}
        </div>

        {draft.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10">
            <div className="w-12 h-12 rounded-full bg-bg-2 flex items-center justify-center text-ink-3 mb-3">
              <Dumbbell size={20} />
            </div>
            <div className="text-sm text-ink-2 mb-4">
              Add the exercises for this plan.
            </div>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="inline-flex items-center gap-1.5 bg-accent text-bg rounded-full px-5 py-2.5 text-sm font-medium"
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
              <div className="space-y-8">
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
            className="mt-8 w-full bg-bg-2 rounded-full py-3.5 flex items-center justify-center gap-2 text-sm font-medium text-ink active:bg-bg-3"
          >
            <Plus size={16} /> Add exercise
          </button>
        )}
      </div>

      <div className="px-5 pb-safe pt-2 bg-gradient-to-t from-bg via-bg to-transparent">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full bg-accent text-bg rounded-full py-3.5 text-[15px] font-medium disabled:opacity-40"
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
  const { fromLbs, toLbs, label: unitLabel } = useWeightUnit();

  const updateSet = (setId, field, value) =>
    onChange({
      ...item,
      sets: item.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
    });
  const addSet = () => onChange({ ...item, sets: [...item.sets, newSet()] });
  const removeSet = (setId) => {
    if (item.sets.length <= 1) return;
    onChange({ ...item, sets: item.sets.filter((s) => s.id !== setId) });
  };

  return (
    <div
      className={`rounded-2xl transition-[background-color,box-shadow] ${
        isDragging ? "bg-bg-2 shadow-2xl shadow-black/40 p-3 -m-3" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-none w-7 h-9 -ml-2 flex items-center justify-center text-ink-3 active:text-ink shrink-0 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical size={16} />
        </button>
        <span className="w-6 h-6 rounded-full bg-accent-soft text-accent-text text-[11px] font-semibold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium text-ink truncate">
            {item.name}
          </div>
          {item.muscle && (
            <div className="text-xs text-ink-3">{item.muscle}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-3 hover:text-red-400 active:bg-bg-2 shrink-0"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-3 pl-1">
        <div className="grid grid-cols-[28px_1fr_14px_1fr_32px] gap-2 px-0.5 pb-1.5 text-[10px] font-medium text-ink-3 uppercase tracking-wide">
          <span className="text-center">Set</span>
          <span className="text-center">{unitLabel}</span>
          <span />
          <span className="text-center">Reps</span>
          <span />
        </div>
        <div className="space-y-1.5">
          {item.sets.map((set, i) => (
            <div
              key={set.id}
              className="grid grid-cols-[28px_1fr_14px_1fr_32px] gap-2 items-center"
            >
              <span className="text-[13px] text-ink-3 font-medium text-center">
                {i + 1}
              </span>
              <Field
                value={fromLbs(set.weight)}
                allowDecimal
                ariaLabel={`Set ${i + 1} weight`}
                onChange={(v) => updateSet(set.id, "weight", toLbs(v))}
              />
              <span className="text-ink-3 text-sm text-center">×</span>
              <Field
                value={set.reps}
                ariaLabel={`Set ${i + 1} reps`}
                onChange={(v) => updateSet(set.id, "reps", v)}
              />
              <button
                type="button"
                onClick={() => removeSet(set.id)}
                disabled={item.sets.length <= 1}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-red-400 disabled:opacity-0"
                aria-label={`Remove set ${i + 1}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={addSet}
            className="h-9 px-3 -ml-1 rounded-full flex items-center gap-1.5 text-[13px] font-medium text-accent active:bg-bg-2"
          >
            <Plus size={14} /> Add set
          </button>
          <div className="flex items-center gap-2 text-xs text-ink-2">
            <Timer size={13} className="text-ink-3" />
            Rest
            <div className="w-16">
              <Field
                value={item.restSecs}
                ariaLabel="Rest between sets, in seconds"
                onChange={(v) =>
                  onChange({
                    ...item,
                    restSecs: v > 0 ? v : loadDefaultRestSecs(),
                  })
                }
              />
            </div>
            sec
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, icon: Icon, hint, allowDecimal = false, ariaLabel }) {
  // Editing starts from an empty box when the value is 0, but an untouched
  // field always shows the number itself (0 included).
  const toDraft = (v) => (v === 0 || v == null ? "" : String(v));
  const [draft, setDraft] = useState(() => toDraft(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(toDraft(value));
  }, [value, focused]);

  const commit = (raw) => {
    if (raw === "" || raw === ".") {
      onChange(0);
      return;
    }
    const n = allowDecimal ? Number(raw) : parseInt(raw, 10);
    onChange(Number.isFinite(n) ? n : 0);
  };

  return (
    <div>
      {label && (
        <div className="flex items-center gap-1 text-[10px] font-medium text-ink-3 uppercase tracking-wide mb-1">
          {Icon && <Icon size={10} />}
          {label}
        </div>
      )}
      <input
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9.]*" : "[0-9]*"}
        placeholder="0"
        aria-label={ariaLabel ?? label}
        value={focused ? draft : String(value ?? 0)}
        onFocus={() => {
          setFocused(true);
          setDraft(toDraft(value));
        }}
        onChange={(e) => {
          const raw = allowDecimal
            ? e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
            : e.target.value.replace(/\D/g, "");
          setDraft(raw);
          if (raw !== "" && raw !== ".") commit(raw);
        }}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        className="w-full bg-bg-2 border border-transparent rounded-xl text-ink text-[15px] font-medium px-2 py-2 text-center focus:outline-none focus:border-accent placeholder:text-ink-3"
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
      <div className="bg-bg-2 rounded-t-3xl w-full h-[92%] flex flex-col">
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
            className="w-full bg-bg-3 border border-transparent rounded-full pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto shrink-0">
          {muscleGroups.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilter(m)}
              className={`shrink-0 h-8 px-3.5 rounded-pill text-xs leading-none flex items-center ${
                filter === m ? "bg-accent text-bg" : "bg-bg-3 text-ink-2"
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
