import { useState, useMemo } from 'react';
import { Search, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { exerciseLibrary, muscleGroups } from '../data/mockData';

export default function Exercises() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(() => {
    return exerciseLibrary.filter((ex) => {
      const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = activeFilter === 'All' || ex.muscle === activeFilter;
      return matchesQuery && matchesFilter;
    });
  }, [query, activeFilter]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((ex) => {
      if (!groups[ex.muscle]) groups[ex.muscle] = [];
      groups[ex.muscle].push(ex);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Exercises" />

      <div className="px-4 pb-3 relative">
        <Search size={18} className="absolute left-7 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-bg-2 border border-line rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-2 px-4 pb-3.5 overflow-x-auto">
        {muscleGroups.map((m) => (
          <button
            key={m}
            onClick={() => setActiveFilter(m)}
            className={`shrink-0 px-3.5 py-1.5 rounded-pill border text-xs ${
              activeFilter === m
                ? 'bg-accent text-bg border-accent'
                : 'border-line text-ink-2'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([muscle, exercises]) => (
          <div key={muscle}>
            <div className="px-4 pt-2.5 pb-1 text-[10px] font-medium text-ink-3 uppercase tracking-wide">
              {muscle}
            </div>
            {exercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => navigate(`/exercises/${ex.id}`)}
                className="flex items-center gap-3 px-4 py-3 border-b border-line cursor-pointer active:bg-bg-2"
              >
                <div className="w-10 h-10 rounded-[10px] bg-bg-3 flex items-center justify-center text-ink-2 shrink-0">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{ex.name}</div>
                  <div className="text-xs text-ink-2 mt-0.5">
                    {ex.region ? `${ex.region} · ` : ""}{ex.equipment} · {ex.type}
                  </div>
                </div>
                <div className={`ml-auto text-xs font-medium ${ex.isPR ? 'text-accent' : 'text-accent-text'}`}>
                  {ex.isPR ? `${ex.pr} PR` : ex.pr}
                </div>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-ink-2 text-sm py-10">No exercises found.</div>
        )}
      </div>
    </div>
  );
}
