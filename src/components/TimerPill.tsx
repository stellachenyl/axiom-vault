import { useEffect, useState } from 'react'
import { cn } from '@/lib/format'

export function TimerPill({
  seconds,
  running = true,
  className,
}: {
  seconds?: number
  running?: boolean
  className?: string
}) {
  const [elapsed, setElapsed] = useState(seconds ?? 0)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-edge-bright px-2 py-0.5 text-[11px] tracking-widest',
        elapsed > 300 ? 'text-alert' : 'text-ink-dim',
        className,
      )}
    >
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal" aria-hidden />
      T+{mm}:{ss}
    </span>
  )
}
