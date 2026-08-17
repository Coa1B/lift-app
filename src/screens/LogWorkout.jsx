import { useState, useEffect } from 'react';
import {
  Check, Plus, Sparkles, Dumbbell, TrendingUp, Trash2, X, Timer, GripVertical,
} from 'lucide-react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { REST_PRESETS, resolveRestSecs, loadDefaultRestSecs, formatRestLabel } from '../data/restPresets';

function fmtClock(secs) {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

/** Digits-only draft so users can clear "0" and type a full value. */
function NumericInput({ value, onCommit, className, allowDecimal = false, placeholder = '0' }) {
  const toDraft = (v) => (v === 0 || v == null ? '' : String(v));
  const [draft, setDraft] = useState(() => toDraft(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(toDraft(value));
  }, [value, focused]);

  const parse = (raw) => {
    if (raw === '' || raw === '.') return 0;
    const n = allowDecimal ? Number(raw) : parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      pattern={allowDecimal ? '[0-9.]*' : '[0-9]*'}
      placeholder={placeholder}
      value={focused ? draft : toDraft(value)}
      onFocus={() => {
        setFocused(true);
        setDraft(toDraft(value));
      }}
      onChange={(e) => {
        const raw = allowDecimal
          ? e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
          : e.target.value.replace(/\D/g, '');
        setDraft(raw);
        if (raw !== '' && raw !== '.') onCommit(parse(raw));
      }}
      onBlur={() => {
        setFocused(false);
        onCommit(parse(draft));
        setDraft(toDraft(parse(draft)));
      }}
      className={className}
    />
  );
}

export default function LogWorkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialWorkout = location.state?.workout;

  const [workout, setWorkout] = useState(initialWorkout ?? null);
  const [elapsed, setElapsed] = useState(0);
  const [sessionRestSecs, setSessionRestSecs] = useState(loadDefaultRestSecs);
  const [restDraft, setRestDraft] = useState(() => String(loadDefaultRestSecs()));
  const [restFocused, setRestFocused] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );
  const { label, fromLbs } = useWeightUnit();

  useEffect(() => {
    if (!workout) return;
    const i = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [workout]);

  useEffect(() => {
    if (restRemaining <= 0) return undefined;
    const i = setInterval(() => {
      setRestRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(i);
  }, [restRemaining > 0]);

  useEffect(() => {
    if (!restFocused) setRestDraft(String(sessionRestSecs));
  }, [sessionRestSecs, restFocused]);

  const applyRestSecs = (secs) => {
    const n = Math.max(1, Math.min(3600, Math.round(Number(secs) || 0)));
    setSessionRestSecs(n);
    setRestDraft(String(n));
    return n;
  };

  const startRest = (secs) => {
    const duration = secs > 0 ? secs : sessionRestSecs;
    setRestRemaining(duration);
  };

  if (!workout) {
    return <Navigate to="/" replace />;
  }

  const reorderExercises = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWorkout((prev) => {
      const oldIndex = prev.exercises.findIndex((ex) => ex.id === active.id);
      const newIndex = prev.exercises.findIndex((ex) => ex.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return { ...prev, exercises: arrayMove(prev.exercises, oldIndex, newIndex) };
    });
  };

  const toggleDone = (exId, setId, restSecs) => {
    const secs = resolveRestSecs(restSecs);
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId ? {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            const nowDone = !s.done;
            if (nowDone) startRest(secs);
            return { ...s, done: nowDone };
          }),
        } : ex
      ),
    }));
  };

  const updateSet = (exId, setId, field, value) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId ? {
          ...ex,
          sets: ex.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s),
        } : ex
      ),
    }));
  };

  const deleteSet = (exId, setId) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex
      ),
    }));
  };

  const addSet = (exId) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            id: `s-${Date.now()}`,
            prevWeight: last?.weight ?? null, prevReps: last?.reps ?? null,
            weight: 0, reps: 0, done: false,
          }],
        };
      }),
    }));
  };

  const totalVolume = workout.exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + (set.done ? (set.weight || 0) * (set.reps || 0) : 0), 0), 0);

  const resting = restRemaining > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 bg-bg-2 border-b border-line px-4 pt-safe-lg pb-3">
        <div className="flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-ink-2 shrink-0"
            aria-label="Close workout"
          >
            <X size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-medium text-ink tracking-tight truncate">
              {workout.title}
            </div>
          </div>
          <span className="bg-accent text-bg text-xs font-medium px-2.5 py-1 rounded-pill shrink-0 tabular-nums">
            {fmtClock(elapsed)}
          </span>
        </div>
        <div className="flex gap-3 text-xs text-ink-2 pl-8">
          <span className="flex items-center gap-1">
            <Dumbbell size={12} /> {workout.exercises.length} exercises
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={12} /> {Math.round(fromLbs(totalVolume)).toLocaleString()} {label} so far
          </span>
        </div>
      </div>

      <div className="shrink-0 mx-4 mt-3 mb-1">
        <div className={`rounded-card border p-3.5 ${resting ? 'bg-accent-soft border-accent-border' : 'bg-bg-2 border-line'}`}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <Timer size={16} className="text-accent" />
              Rest timer
            </div>
            {resting ? (
              <span className={`text-2xl font-medium tabular-nums tracking-tight ${restRemaining <= 10 ? 'text-red-400' : 'text-accent'}`}>
                {fmtClock(restRemaining)}
              </span>
            ) : (
              <span className="text-xs text-ink-2">{formatRestLabel(sessionRestSecs)}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {REST_PRESETS.map((p) => (
              <button
                key={p.secs}
                type="button"
                onClick={() => {
                  applyRestSecs(p.secs);
                  if (resting) startRest(p.secs);
                }}
                className={`text-xs h-8 px-3 rounded-pill border ${
                  sessionRestSecs === p.secs
                    ? 'bg-accent text-bg border-accent'
                    : 'border-line text-ink-2'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs text-ink-2 shrink-0" htmlFor="custom-rest">
              Custom
            </label>
            <div className="flex-1 flex items-center gap-2">
              <input
                id="custom-rest"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="secs"
                value={restFocused ? restDraft : String(sessionRestSecs)}
                onFocus={() => {
                  setRestFocused(true);
                  setRestDraft(String(sessionRestSecs));
                }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setRestDraft(raw);
                  if (raw !== '') {
                    const n = Math.max(1, Math.min(3600, parseInt(raw, 10) || 0));
                    setSessionRestSecs(n);
                    if (resting) startRest(n);
                  }
                }}
                onBlur={() => {
                  setRestFocused(false);
                  const n = applyRestSecs(restDraft === '' ? sessionRestSecs : restDraft);
                  if (resting) startRest(n);
                }}
                className="w-full bg-bg-3 border border-line rounded-lg text-ink text-sm font-medium px-3 py-2 text-center tabular-nums focus:outline-none focus:border-accent"
              />
              <span className="text-xs text-ink-3 shrink-0">sec</span>
            </div>
          </div>

          {resting ? (
            <button
              type="button"
              onClick={() => setRestRemaining(0)}
              className="w-full bg-bg-3 border border-line rounded-xl py-2.5 text-sm text-ink-2"
            >
              Skip rest
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startRest(sessionRestSecs)}
              className="w-full bg-bg-3 border border-line rounded-xl py-2.5 text-sm font-medium text-ink flex items-center justify-center gap-2"
            >
              <Timer size={14} className="text-accent" />
              Start {formatRestLabel(sessionRestSecs)} rest
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-2 min-h-0">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderExercises}>
          <SortableContext
            items={workout.exercises.map((ex) => ex.id)}
            strategy={verticalListSortingStrategy}
          >
            {workout.exercises.map((ex) => (
              <SortableExercise
                key={ex.id}
                exercise={ex}
                onToggle={toggleDone}
                onUpdate={updateSet}
                onDeleteSet={deleteSet}
                onAddSet={addSet}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button className="mx-4 mt-2.5 bg-bg-2 border border-dashed border-line rounded-card p-3.5 flex items-center justify-center gap-2 text-ink-2 text-sm w-[calc(100%-32px)]">
          <Plus size={16} /> Add exercise
        </button>
        <button onClick={() => navigate('/')} className="mx-4 mt-3 mb-4 bg-accent text-bg rounded-2xl py-3.5 text-[15px] font-medium w-[calc(100%-32px)]">
          Finish workout
        </button>
      </div>
    </div>
  );
}

function SortableExercise({ exercise, onToggle, onUpdate, onDeleteSet, onAddSet }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseBlock
        exercise={exercise}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDeleteSet={onDeleteSet}
        onAddSet={onAddSet}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
      {exercise.overloadSuggestion && <OverloadTip suggestion={exercise.overloadSuggestion} />}
    </div>
  );
}

function ExerciseBlock({ exercise, onToggle, onUpdate, onDeleteSet, onAddSet, dragHandleProps, isDragging }) {
  const { fromLbs, toLbs, format } = useWeightUnit();

  return (
    <div className={`bg-bg-2 rounded-card mx-4 mt-2.5 overflow-hidden border ${isDragging ? 'border-accent shadow-lg' : 'border-line'}`}>
      <div className="px-3 pt-3 pb-2.5 flex items-center gap-2">
        <button
          type="button"
          className="touch-none w-8 h-8 -ml-1 rounded-lg flex items-center justify-center text-ink-3 active:text-ink shrink-0 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-ink truncate">{exercise.name}</div>
          <div className="text-xs text-ink-2 mt-0.5">
            {exercise.muscle} · {exercise.equipment}
            {exercise.defaultRestSecs > 0 && (
              <span className="text-ink-3"> · {formatRestLabel(exercise.defaultRestSecs)} rest</span>
            )}
          </div>
        </div>
        {exercise.prPace && (
          <span className="text-[11px] text-accent bg-accent-soft px-2.5 py-1 rounded-pill border border-accent-border shrink-0">PR pace</span>
        )}
      </div>
      <div className="grid grid-cols-[24px_1fr_76px_68px_28px_28px] gap-1 px-4 py-1.5 bg-bg-3">
        <span className="text-[10px] font-medium text-ink-3 uppercase tracking-wide">Set</span>
        <span className="text-[10px] font-medium text-ink-3 uppercase tracking-wide">Prev</span>
        <span className="text-[10px] font-medium text-ink-3 uppercase tracking-wide text-center">Weight</span>
        <span className="text-[10px] font-medium text-ink-3 uppercase tracking-wide text-center">Reps</span>
        <span /><span />
      </div>
      {exercise.sets.map((set, i) => (
        <div key={set.id}
          className={`grid grid-cols-[24px_1fr_76px_68px_28px_28px] gap-1 px-4 py-2.5 border-t border-line items-center ${set.done ? 'bg-accent-soft' : ''}`}>
          <span className="text-[13px] text-ink-3 font-medium">{i + 1}</span>
          <span className="text-xs text-ink-3">{set.prevWeight != null ? `${format(set.prevWeight)}×${set.prevReps}` : '—'}</span>
          <NumericInput
            value={fromLbs(set.weight)}
            allowDecimal
            onCommit={(v) => onUpdate(exercise.id, set.id, 'weight', toLbs(v))}
            className="bg-bg-3 border border-line rounded-lg text-ink text-sm font-medium px-1.5 py-1.5 w-full text-center focus:outline-none focus:border-accent placeholder:text-ink-3"
          />
          <NumericInput
            value={set.reps ?? 0}
            onCommit={(v) => onUpdate(exercise.id, set.id, 'reps', v)}
            className="bg-bg-3 border border-line rounded-lg text-ink text-sm font-medium px-1.5 py-1.5 w-full text-center focus:outline-none focus:border-accent placeholder:text-ink-3"
          />
          <button onClick={() => onToggle(exercise.id, set.id, exercise.defaultRestSecs)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center ${set.done ? 'bg-accent border-accent text-bg' : 'border-line text-ink-3'}`}>
            <Check size={13} />
          </button>
          <button onClick={() => onDeleteSet(exercise.id, set.id)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-ink-3 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <div className="px-4 py-3">
        <button onClick={() => onAddSet(exercise.id)}
          className="w-full bg-bg-3 border border-line text-ink-2 rounded-lg py-2 text-xs flex items-center justify-center gap-1.5">
          <Plus size={13} /> Add set
        </button>
      </div>
    </div>
  );
}

function OverloadTip({ suggestion }) {
  const { format } = useWeightUnit();
  return (
    <div className="mx-4 mt-2 bg-accent-soft border border-accent-border rounded-xl px-3.5 py-2.5 flex gap-2.5 items-start">
      <Sparkles size={16} className="text-accent mt-0.5 shrink-0" />
      <div className="text-xs text-accent-text leading-relaxed">
        <strong>Suggestion:</strong> You hit {format(suggestion.lastWeight)}×{suggestion.lastReps} last session.
        Try {format(suggestion.suggestedWeight)}×{suggestion.suggestedReps} — a {suggestion.percentIncrease}% increase,
        within the 2–5% progressive overload range.
      </div>
    </div>
  );
}
