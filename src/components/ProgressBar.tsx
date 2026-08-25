import { cn } from '@/lib/format'

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number
  max?: number
  label?: string
  className?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1 flex justify-between text-[10px] tracking-widest text-ink-dim uppercase">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-panel-raised"
      >
        <div
          className="h-full rounded-full bg-signal shadow-[0_0_8px_rgba(53,224,184,0.6)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
