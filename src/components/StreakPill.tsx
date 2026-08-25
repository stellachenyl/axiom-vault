import { cn } from '@/lib/format'

export function StreakPill({ streak, best, className }: { streak: number; best: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-edge-bright px-2 py-0.5 text-[11px] tracking-widest uppercase',
        streak >= 3 ? 'text-warn' : 'text-ink-dim',
        className,
      )}
    >
      ⚡ STREAK {streak}
      <span className="text-ink-dim/60">/ BEST {best}</span>
    </span>
  )
}
