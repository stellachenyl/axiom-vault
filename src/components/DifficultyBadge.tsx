import { threatLabel } from '@/lib/format'
import type { ThreatLevel } from '@/types'
import { cn } from '@/lib/format'

const levelColors: Record<ThreatLevel, string> = {
  1: 'border-signal-dim text-signal-dim',
  2: 'border-signal-dim text-signal',
  3: 'border-warn text-warn',
  4: 'border-warn text-alert',
  5: 'border-alert text-alert',
}

export function DifficultyBadge({
  level,
  className,
}: {
  level: ThreatLevel
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] tracking-widest uppercase',
        levelColors[level],
        className,
      )}
    >
      <span aria-hidden>
        {'▮'.repeat(level)}
        {'▯'.repeat(5 - level)}
      </span>
      CLR-{level} · {threatLabel(level)}
    </span>
  )
}
