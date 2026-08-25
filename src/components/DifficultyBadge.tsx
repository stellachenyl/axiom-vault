import { threatLabel } from '@/lib/format'
import { cn } from '@/lib/format'

const MAX_DIFFICULTY = 10
/** Difficulty (1-10) is displayed as five clearance pips. */
const PIP_LEVELS = 5

function pipLevel(difficulty: number): number {
  return Math.min(PIP_LEVELS, Math.max(1, Math.ceil((difficulty / MAX_DIFFICULTY) * PIP_LEVELS)))
}

const levelColors: Record<number, string> = {
  1: 'border-signal-dim text-signal-dim',
  2: 'border-signal-dim text-signal',
  3: 'border-warn text-warn',
  4: 'border-warn text-alert',
  5: 'border-alert text-alert',
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: number
  className?: string
}) {
  const pips = pipLevel(difficulty)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] tracking-widest uppercase',
        levelColors[pips],
        className,
      )}
    >
      <span aria-hidden>
        {'▮'.repeat(pips)}
        {'▯'.repeat(PIP_LEVELS - pips)}
      </span>
      CLR-{difficulty} · {threatLabel(pips)}
    </span>
  )
}
