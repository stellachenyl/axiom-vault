import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/format'
import { timerPhase, type TimerPhase } from '@/lib/tension'

export type { TimerPhase }

function formatClock(totalSeconds: number): string {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(Math.max(0, totalSeconds % 60)).padStart(2, '0')
  return `${mm}:${ss}`
}

export function TimerPill({
  limitSeconds,
  running = true,
  onExpire,
  onPhaseChange,
  className,
}: {
  /** Declared limit; when set the pill counts down, otherwise it counts up. */
  limitSeconds?: number
  running?: boolean
  onExpire?: () => void
  /** Notifies the ambient audio layer when the tension phase changes. */
  onPhaseChange?: (phase: TimerPhase) => void
  className?: string
}) {
  const [elapsed, setElapsed] = useState(0)
  const lastPhaseRef = useRef<TimerPhase | null>(null)

  const hasLimit = limitSeconds !== undefined && limitSeconds > 0
  const remaining = hasLimit ? Math.max(0, (limitSeconds ?? 0) - elapsed) : elapsed
  const expired = hasLimit && remaining <= 0

  useEffect(() => {
    if (!running || expired) return
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [running, expired])

  useEffect(() => {
    if (expired && running) onExpire?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired])

  const fraction = hasLimit && limitSeconds ? remaining / limitSeconds : 1
  const phase = expired || !running ? ('idle' as TimerPhase) : timerPhase(hasLimit, fraction)

  useEffect(() => {
    if (lastPhaseRef.current !== phase) {
      lastPhaseRef.current = phase
      onPhaseChange?.(phase)
    }
  }, [phase, onPhaseChange])

  const urgency = expired ? 'text-alert' : hasLimit && remaining <= 30 ? 'text-warn' : 'text-ink-dim'

  return (
    <span
      role="timer"
      aria-label={hasLimit ? `Time remaining ${formatClock(remaining)}` : `Elapsed ${formatClock(elapsed)}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-edge-bright px-2 py-0.5 font-mono text-[11px] tracking-widest',
        urgency,
        className,
      )}
    >
      <span
        className={cn('inline-block h-1.5 w-1.5 rounded-full', expired ? 'bg-alert' : 'animate-pulse bg-signal')}
        aria-hidden
      />
      {hasLimit ? `T-${formatClock(remaining)}` : `T+${formatClock(elapsed)}`}
    </span>
  )
}
