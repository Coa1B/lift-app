import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Dumbbell } from "lucide-react";
import { useWorkouts } from "../hooks/useStoredData";
import { toWorkoutCard } from "../lib/workoutsStorage";
import { useOpenLog } from "../hooks/useOpenLog";
import { useWeightUnit } from "../hooks/useWeightUnit";

export default function History() {
  const navigate = useNavigate();
  const openLog = useOpenLog();
  const { fromLbs, label } = useWeightUnit();
  const recentWorkouts = useWorkouts().map(toWorkoutCard);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 pt-safe pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-ink-2 active:bg-bg-2"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-lg font-medium text-ink tracking-tight">History</div>
          <div className="text-xs text-ink-2">{recentWorkouts.length} workouts</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 pb-6">
        {recentWorkouts.length === 0 ? (
          <div className="text-center text-sm text-ink-2 py-16 px-4">
            No workouts yet.
          </div>
        ) : (
          recentWorkouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onClick={openLog}
              volumeLabel={`${fromLbs(w.volumeLbs).toLocaleString()} ${label}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WorkoutCard({ workout, onClick, volumeLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl px-3 py-4 border-t border-line/60 first:border-t-0 active:bg-bg-2 transition-colors"
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-[15px] font-medium text-ink">{workout.title}</span>
        <span className="text-xs text-ink-2">{workout.date}</span>
      </div>
      <div className="flex gap-3 text-xs text-ink-2 mb-2">
        <span className="flex items-center gap-1">
          <Clock size={13} /> {workout.durationMin} min
        </span>
        <span className="flex items-center gap-1">
          <Dumbbell size={13} /> {volumeLabel}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {workout.exercises.map((ex) => (
          <span
            key={ex.name}
            className={`text-[11px] px-2.5 py-1 rounded-full ${
              ex.isPR ? "bg-accent-soft text-accent-text" : "bg-bg-2 text-ink-2"
            }`}
          >
            {ex.isPR ? `${ex.name.split(" ")[0]} PR` : ex.name}
          </span>
        ))}
      </div>
    </button>
  );
}
