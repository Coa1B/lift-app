import { Clock, Dumbbell, Flame, Trophy, ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOpenLog } from '../hooks/useOpenLog';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { useLocalUser } from '../hooks/useLocalUser';
import { usePlans, usePRs, useWorkouts } from '../hooks/useStoredData';
import { formatDuration, toWorkoutCard, weekSummary } from '../lib/workoutsStorage';
import { planSetTargets } from '../lib/plansStorage';
import { recentPREntries } from '../lib/prsStorage';
import { workoutFromPlan } from '../components/LogSheet';

const RECENT_WORKOUTS = 2;
const RECENT_PRS = 3;

function greetingForHour(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const navigate = useNavigate();
  const openLog = useOpenLog();
  const { firstName, name } = useLocalUser();
  const workouts = useWorkouts();
  const plans = usePlans();
  const prs = usePRs();

  const week = weekSummary(workouts);
  const recentPRs = recentPREntries(prs).slice(0, RECENT_PRS);
  const recent = workouts.slice(0, RECENT_WORKOUTS).map(toWorkoutCard);

  const greeting = greetingForHour(new Date().getHours());
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const startPlan = (plan) =>
    navigate('/log/session', { state: { workout: workoutFromPlan(plan) } });

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-safe-lg pb-2 flex items-center justify-between">
        <div className="text-2xl font-medium text-ink tracking-tight">lift.</div>
        <div className="text-xs text-ink-2">{today}</div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <section className="pt-3 pb-6">
          <p className="text-sm text-ink-2 mb-1">{greeting},</p>
          <h1 className="text-[34px] leading-none font-medium text-ink tracking-tight mb-5">
            {firstName || (name ? name : 'Athlete')}
          </h1>

          <StartWorkoutCard onStart={openLog} />
        </section>

        <QuickStart plans={plans} onStart={startPlan} onSeeAll={() => navigate('/plans')} />

        <WeeklyProgress week={week} />

        <section className="mb-7">
          <SectionHeader title="Recent PRs" onSeeAll={() => navigate('/prs')} />
          {recentPRs.length === 0 ? (
            <EmptyLine>
              No PRs yet.{' '}
              <button
                type="button"
                onClick={() => navigate('/prs?add=1')}
                className="text-accent font-medium"
              >
                Log your first 1RM
              </button>
            </EmptyLine>
          ) : (
            <div className="-mx-2">
              {recentPRs.map((pr) => (
                <PRRow key={pr.key} pr={pr} onClick={() => navigate('/prs')} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Recent workouts" onSeeAll={() => navigate('/history')} />
          {recent.length === 0 ? (
            <EmptyLine>No workouts yet. Finish one to see it here.</EmptyLine>
          ) : (
            <div className="-mx-2">
              {recent.map((w, i) => (
                <WorkoutRow
                  key={w.id}
                  workout={w}
                  index={i}
                  onClick={() => navigate('/history')}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StartWorkoutCard({ onStart }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="group w-full rounded-3xl bg-bg-2 pl-5 pr-3 py-3 flex items-center gap-4 text-left active:bg-bg-3 transition-colors"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-[17px] font-medium text-ink tracking-tight">
          Start a workout
        </span>
        <span className="block text-[13px] text-ink-2 mt-0.5 truncate">
          Choose a plan or log a PR
        </span>
      </span>
      <span className="w-14 h-14 rounded-full bg-accent text-bg flex items-center justify-center shrink-0 shadow-[0_6px_20px_-6px_rgb(var(--color-accent)/0.6)] group-active:scale-95 transition-transform">
        <Play size={20} fill="currentColor" className="ml-0.5" />
      </span>
    </button>
  );
}

function SectionHeader({ title, onSeeAll }) {
  return (
    <div className="flex justify-between items-center mb-1 px-1">
      <h2 className="text-[15px] font-semibold text-ink tracking-tight">{title}</h2>
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs text-accent font-medium flex items-center gap-0.5 h-8"
        >
          See all
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function EmptyLine({ children }) {
  return <div className="px-1 py-4 text-sm text-ink-3">{children}</div>;
}

function QuickStart({ plans, onStart, onSeeAll }) {
  return (
    <section className="mb-7">
      <SectionHeader title="Your plans" onSeeAll={plans.length ? onSeeAll : null} />
      {plans.length === 0 ? (
        <EmptyLine>
          No plans yet.{' '}
          <button type="button" onClick={onSeeAll} className="text-accent font-medium">
            Create one
          </button>
        </EmptyLine>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 scroll-px-4 pb-1 pt-1 snap-x">
          {plans.map((plan) => {
            const exercises = plan.exercises?.length ?? 0;
            const sets = (plan.exercises || []).reduce(
              (sum, item) => sum + planSetTargets(item).length,
              0,
            );
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onStart(plan)}
                className="snap-start shrink-0 w-[150px] bg-bg-2 rounded-3xl p-4 text-left flex flex-col active:bg-bg-3 transition-colors"
                aria-label={`Start ${plan.name}`}
              >
                <span className="w-9 h-9 rounded-full bg-accent text-bg flex items-center justify-center mb-6">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </span>
                <span className="text-[15px] font-medium text-ink tracking-tight truncate">
                  {plan.name}
                </span>
                <span className="text-xs text-ink-2 mt-0.5">
                  {exercises} {exercises === 1 ? 'exercise' : 'exercises'} · {sets}{' '}
                  {sets === 1 ? 'set' : 'sets'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WeeklyProgress({ week }) {
  const { fromLbs, formatVolume, labelLong } = useWeightUnit();
  const max = Math.max(...week.days.map((d) => d.volumeLbs), 1);

  return (
    <section className="mb-7">
      <SectionHeader title="This week" />
      <div className="rounded-3xl bg-bg-2 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[34px] leading-none font-medium text-ink tracking-tight">
                {week.sessions}
              </span>
              <span className="text-sm text-ink-2">
                {week.sessions === 1 ? 'session' : 'sessions'}
              </span>
            </div>
            <div className="text-xs text-ink-2 mt-2">
              {formatVolume(week.volumeLbs)} {labelLong} · {formatDuration(week.durationSec)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-accent-soft text-accent-text rounded-full pl-2 pr-3 py-1.5 text-xs font-medium">
            <Flame size={14} />
            {week.streakWeeks} wk streak
          </div>
        </div>

        <div
          className="mt-5 grid grid-cols-7 gap-2 items-end h-24"
          role="img"
          aria-label={`Volume by day this week: ${week.days
            .map((d) => `${d.label} ${Math.round(fromLbs(d.volumeLbs))}`)
            .join(', ')}`}
        >
          {week.days.map((d, i) => {
            const pct = d.volumeLbs > 0 ? Math.max(8, (d.volumeLbs / max) * 100) : 0;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[16px] rounded-full transition-[height] duration-500 ${
                      d.volumeLbs > 0 ? 'bg-accent' : 'bg-bg-3'
                    }`}
                    style={{ height: d.volumeLbs > 0 ? `${pct}%` : '6px' }}
                  />
                </div>
                <span
                  className={`text-[11px] ${d.isToday ? 'text-ink font-semibold' : 'text-ink-3'}`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PRRow({ pr, onClick }) {
  const { format, label } = useWeightUnit();
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl px-2 py-3 flex items-center gap-3 border-t border-line/60 first:border-t-0 active:bg-bg-2 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
        <Trophy size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-ink truncate">{pr.name}</div>
        <div className="text-xs text-ink-3 mt-0.5">{pr.date}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[15px] font-semibold text-ink tracking-tight">
          {format(pr.weight)}
          <span className="text-xs text-ink-2 font-normal"> {label}</span>
        </div>
        {pr.gain > 0 && (
          <div className="text-[11px] text-accent-text">+{format(pr.gain)}</div>
        )}
      </div>
    </button>
  );
}

function WorkoutRow({ workout, index, onClick }) {
  const { fromLbs, label } = useWeightUnit();
  const hasPR = workout.exercises.some((ex) => ex.isPR);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl px-2 py-3.5 flex gap-3 border-t border-line/60 first:border-t-0 active:bg-bg-2 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-bg-2 flex items-center justify-center text-ink-3 shrink-0 text-[13px] font-medium">
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
            <Dumbbell size={12} /> {Math.round(fromLbs(workout.volumeLbs)).toLocaleString()} {label}
          </span>
          {hasPR && (
            <span className="flex items-center gap-1 text-accent">
              <Trophy size={12} /> PR
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-ink-3 truncate">
          {workout.exercises.map((ex) => ex.name).join(' · ')}
        </div>
      </div>
    </button>
  );
}
