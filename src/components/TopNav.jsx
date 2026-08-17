export default function TopNav({ title, actionLabel, actionIcon: ActionIcon, onAction }) {
  return (
    <div className="flex items-center justify-between px-5 pt-safe pb-3">
      <div className="text-xl font-medium text-ink tracking-tight">{title}</div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="bg-accent text-bg rounded-pill px-4 py-2 text-[13px] font-medium flex items-center gap-1.5"
        >
          {ActionIcon && <ActionIcon size={14} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
