import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { exerciseLibrary, getExerciseDetail } from '../data/mockData';
import { useWeightUnit } from '../hooks/useWeightUnit';
import { useChartColors } from '../hooks/useTheme';

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('chart');
  const { label, labelLong, format } = useWeightUnit();

  const exercise = exerciseLibrary.find((e) => e.id === id);
  if (!exercise) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-ink-2 text-sm gap-3">
        Exercise not found.
        <button onClick={() => navigate('/')} className="text-accent text-sm">
          Back home
        </button>
      </div>
    );
  }

  const detail = getExerciseDetail(exercise);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-safe pb-3">
        <button onClick={() => navigate(-1)} className="text-ink-2">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-medium text-ink tracking-tight">{exercise.name}</span>
          <span className="text-[11px] text-accent bg-accent-soft border border-accent-border px-2 py-0.5 rounded-pill">
            {exercise.muscle}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-bg-2 border border-line rounded-card p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-2 font-medium uppercase tracking-wide mb-2">
              <Trophy size={13} /> Personal best
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-medium text-ink tracking-tight">
                {format(detail.personalBest.weight)}
              </span>
              <span className="text-xs text-ink-2">{labelLong}</span>
              <span className="text-lg text-ink-2">×{detail.personalBest.reps}</span>
            </div>
            <div className="text-[11px] text-ink-3 mt-1">
              ~{format(detail.personalBest.e1rm)}{label} est. 1RM · {detail.personalBest.date}
            </div>
          </div>

          <div className="bg-bg-2 border border-line rounded-card p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-2 font-medium uppercase tracking-wide mb-2">
              <TrendingUp size={13} /> Next target
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-medium text-accent tracking-tight">
                {format(detail.nextTarget.weight)}
              </span>
              <span className="text-xs text-ink-2">{labelLong}</span>
              <span className="text-lg text-ink-2">×{detail.nextTarget.reps}</span>
            </div>
            <div className="text-[11px] text-ink-3 mt-1">{detail.nextTarget.note}</div>
          </div>
        </div>

        <div className="flex gap-5 border-b border-line mb-4">
          <TabButton label="Progress chart" active={tab === 'chart'} onClick={() => setTab('chart')} />
          <TabButton label="History log" active={tab === 'history'} onClick={() => setTab('history')} />
        </div>

        {tab === 'chart' ? (
          <ProgressChart data={detail.progress} />
        ) : (
          <HistoryLog history={detail.history} />
        )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2.5 text-sm font-medium border-b-2 -mb-px ${
        active ? 'text-accent border-accent' : 'text-ink-2 border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

function ProgressChart({ data }) {
  const { label, labelLong, fromLbs } = useWeightUnit();
  const chart = useChartColors();
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, weight: fromLbs(d.weight) })),
    [data, fromLbs],
  );

  return (
    <div className="bg-bg-2 border border-line rounded-card p-4">
      <div className="text-[11px] font-medium text-ink-2 uppercase tracking-wide mb-3">
        Max weight per session ({labelLong})
      </div>
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={chart.line} strokeDasharray="3 3" vertical={false} />
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
              domain={['dataMin - 5', 'dataMax + 5']}
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
              formatter={(value) => [`${value} ${label}`, 'Weight']}
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
  );
}

function HistoryLog({ history }) {
  const { format } = useWeightUnit();
  return (
    <div className="space-y-2.5">
      {history.map((session) => (
        <div key={session.date} className="bg-bg-2 border border-line rounded-card p-3.5">
          <div className="text-sm font-medium text-ink mb-2">{session.date}</div>
          <div className="flex flex-wrap gap-1.5">
            {session.sets.map((set, i) => (
              <span
                key={i}
                className="text-xs bg-bg-3 border border-line text-ink-2 px-2.5 py-1 rounded-pill"
              >
                {format(set.weight)} × {set.reps}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
