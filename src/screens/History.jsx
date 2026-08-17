import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Dumbbell } from "lucide-react";
import { recentWorkouts } from "../data/mockData";
import { useOpenLog } from "../hooks/useOpenLog";
import { useWeightUnit } from "../hooks/useWeightUnit";

export default function History() {
  const navigate = useNavigate();
  const openLog = useOpenLog();
  const { fromLbs, label } = useWeightUnit();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-safe pb-3 border-b border-line">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-lg font-medium text-ink tracking-tight">History</div>
          <div className="text-xs text-ink-2">{recentWorkouts.length} workouts</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-4">
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
      className="w-full text-left bg-bg-2 rounded-card p-4 mb-2.5 border border-line"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[15px] font-medium text-ink">{workout.title}</span>
        <span className="text-xs text-ink-2">{workout.date}</span>
      </div>
      <div className="flex gap-3 text-xs text-ink-2 mb-2.5">
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
            className={`text-[11px] px-2.5 py-1 rounded-pill border ${
              ex.isPR
                ? "bg-accent-soft text-accent-text border-accent-border"
                : "bg-bg-3 text-ink-2 border-line"
            }`}
          >
            {ex.isPR ? `${ex.name.split(" ")[0]} PR` : ex.name}
          </span>
        ))}
      </div>
    </button>
  );
}
