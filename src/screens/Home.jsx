import { Plus, Clock, Dumbbell, Flame, Trophy, ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { weekStats, recentWorkouts } from '../data/mockData';
import { useOpenLog } from '../hooks/useOpenLog';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { useLocalUser } from '../hooks/useLocalUser';

const HOME_PREVIEW = 2;

function greetingForHour(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const navigate = useNavigate();
  const openLog = useOpenLog();
  const { labelLong, formatVolume, fromLbs, label } = useWeightUnit();
  const { firstName, name } = useLocalUser();
  const preview = recentWorkouts.slice(0, HOME_PREVIEW);
  const greeting = greetingForHour(new Date().getHours());
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-safe-lg pb-2 flex items-center justify-between">
        <div className="text-2xl font-medium text-ink tracking-tight">lift.</div>
        <div className="text-xs text-ink-2">{today}</div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-5">
        <section className="pt-3 pb-5">
          <p className="text-sm text-ink-2 mb-1">{greeting},</p>
          <h1 className="text-[34px] leading-none font-medium text-ink tracking-tight mb-5">
            {firstName || (name ? name : 'Athlete')}
          </h1>

          <button
            type="button"
            onClick={openLog}
            className="w-full rounded-card bg-accent text-bg p-4 flex items-center gap-3.5 text-left active:scale-[0.99] transition-transform"
          >
            <span className="w-12 h-12 rounded-2xl bg-bg/15 flex items-center justify-center shrink-0">
              <Play size={22} fill="currentColor" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[17px] font-medium tracking-tight">Start workout</span>
              <span className="block text-sm text-bg/65 mt-0.5">
                Log a plan or add a PR
              </span>
            </span>
            <Plus size={20} className="opacity-80 shrink-0" />
          </button>
        </section>

        <section className="mb-5 rounded-card border border-line bg-bg-2 overflow-hidden">
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-line">
            <div>
              <div className="text-[11px] font-medium text-ink-3 uppercase tracking-wide">Streak</div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-medium text-accent tracking-tight">
                  {weekStats.streakWeeks}
                </span>
                <span className="text-sm text-ink-2">weeks</span>
              </div>
            </div>
            <Flame size={32} className="text-accent-border" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-line">
            <MiniStat value={weekStats.sessionsThisWeek} label="sessions" />
            <MiniStat value={formatVolume(weekStats.volumeThisWeekLbs)} label={labelLong} />
            <MiniStat value={weekStats.newPRsThisWeek} label="new PRs" accent />
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[13px] font-medium text-ink-2 uppercase tracking-wide">
              Recent
            </h2>
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="text-xs text-accent font-medium flex items-center gap-0.5"
            >
              See all
              <ChevronRight size={14} />
            </button>
          </div>

          {preview.length === 0 ? (
            <div className="rounded-card border border-line bg-bg-2 px-4 py-8 text-center text-sm text-ink-2">
              No workouts yet. Start one to build your history.
            </div>
          ) : (
            <div className="space-y-2.5">
              {preview.map((w, i) => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  index={i}
                  onClick={openLog}
                  volumeLabel={`${fromLbs(w.volumeLbs).toLocaleString()} ${label}`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MiniStat({ value, label, accent = false }) {
  return (
    <div className="px-3 py-3 text-center">
      <div className={`text-lg font-medium tracking-tight ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </div>
      <div className="text-[11px] text-ink-2 mt-0.5">{label}</div>
    </div>
  );
}

function WorkoutCard({ workout, index, onClick, volumeLabel }) {
  const hasPR = workout.exercises.some((ex) => ex.isPR);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-card border border-line bg-bg-2 p-3.5 flex gap-3 active:border-accent transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center text-ink-3 shrink-0 text-sm font-medium">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[15px] font-medium text-ink truncate">{workout.title}</div>
          <span className="text-[11px] text-ink-3 shrink-0">{workout.date}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-ink-2">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {workout.durationMin}m
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell size={12} /> {volumeLabel}
          </span>
          {hasPR && (
            <span className="flex items-center gap-1 text-accent">
              <Trophy size={12} /> PR
            </span>
          )}
        </div>
        <div className="mt-2 text-[11px] text-ink-3 truncate">
          {workout.exercises.map((ex) => ex.name).join(' · ')}
        </div>
      </div>
    </button>
  );
}
