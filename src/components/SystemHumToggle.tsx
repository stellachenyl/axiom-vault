import { useEffect, useState } from 'react'
import { humEngine } from '@/lib/hum'
import { cn } from '@/lib/format'

/** TopBar toggle for the Web-Audio "system hum" ambience layer. */
export function SystemHumToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(humEngine.preferred)

  // Restore a saved preference at the first user gesture (autoplay policy).
  useEffect(() => {
    humEngine.initFromPreference()
  }, [])

  const toggle = async () => {
    const next = !enabled
    setEnabled(next)
    await humEngine.setEnabled(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="System hum ambient audio"
      title="System hum — generated ambience (Web Audio)"
      onClick={() => void toggle()}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] tracking-widest uppercase transition-colors',
        enabled
          ? 'border-signal text-signal shadow-[0_0_10px_rgba(53,224,184,0.25)]'
          : 'border-edge-bright text-ink-dim hover:text-ink',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('inline-block h-1.5 w-1.5 rounded-full', enabled ? 'animate-pulse bg-signal' : 'bg-edge-bright')}
      />
      HUM {enabled ? 'ON' : 'OFF'}
    </button>
  )
}
