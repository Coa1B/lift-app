export default function StatCard({ label, value, unit, accent = false }) {
  return (
    <div
      className={`rounded-3xl p-4 ${accent ? 'bg-accent' : 'bg-bg-2'}`}
    >
      <div className={`text-[11px] font-medium mb-1.5 ${accent ? 'text-bg/60' : 'text-ink-2'}`}>
        {label}
      </div>
      <div className={`text-[26px] font-medium tracking-tight ${accent ? 'text-bg' : 'text-ink'}`}>
        {value}
      </div>
      <div className={`text-xs mt-0.5 ${accent ? 'text-bg/60' : 'text-ink-2'}`}>{unit}</div>
    </div>
  );
}
