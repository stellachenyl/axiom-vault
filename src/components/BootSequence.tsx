import { useCallback, useEffect, useRef, useState } from 'react'
import { markBooted } from '@/lib/bootSession'

const TOTAL_MS = 3000

interface BootLine {
  text: string
  tone: 'signal' | 'amber' | 'dim'
  atMs: number
}

const BOOT_LINES: BootLine[] = [
  { text: 'AXIOM::VAULT BIOS v0.4 — containment terminal', tone: 'amber', atMs: 100 },
  { text: 'Initializing containment grid ............ OK', tone: 'signal', atMs: 550 },
  { text: 'Verifying Zod schemas ..................... OK', tone: 'signal', atMs: 1100 },
  { text: 'Syncing GitHub manifest ................... OK', tone: 'signal', atMs: 1650 },
  { text: 'Scanning anomaly registry ......... 20 NODES', tone: 'dim', atMs: 2100 },
  { text: 'Operator integrity .................. UNKNOWN', tone: 'dim', atMs: 2450 },
  { text: 'Clearance granted.', tone: 'amber', atMs: 2750 },
]

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [fading, setFading] = useState(false)
  const completedRef = useRef(false)

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    markBooted()
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const timers: number[] = []
    for (const line of BOOT_LINES) {
      timers.push(
        window.setTimeout(
          () => setVisibleCount((n) => Math.min(n + 1, BOOT_LINES.length)),
          line.atMs,
        ),
      )
    }
    timers.push(window.setTimeout(() => setFading(true), TOTAL_MS - 500))
    timers.push(window.setTimeout(finish, TOTAL_MS))
    return () => timers.forEach(clearTimeout)
  }, [finish])

  // Any key or click skips straight to the app.
  useEffect(() => {
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [finish])

  const toneClass = (tone: BootLine['tone']) =>
    tone === 'amber' ? 'crt-amber' : tone === 'signal' ? 'crt-text' : 'text-ink-dim'

  return (
    <div
      role="status"
      aria-label="System boot sequence"
      className={`crt-screen crt-tube fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-6 transition-opacity duration-500 sm:p-12 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      data-testid="boot-sequence"
    >
      {/* scanline overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(53,224,184,0.03) 3px, rgba(53,224,184,0.03) 4px)',
        }}
      />
      <div
        aria-live="polite"
        className="crt-flicker w-full max-w-2xl font-mono text-[11px] leading-relaxed sm:text-sm"
      >
        {BOOT_LINES.slice(0, visibleCount).map((line) => (
          <p key={line.text} className={`boot-line ${toneClass(line.tone)}`}>
            {'> '}
            {line.text}
          </p>
        ))}
      </div>
    </div>
  )
}
