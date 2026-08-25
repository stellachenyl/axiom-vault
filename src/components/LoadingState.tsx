import { Card } from './Card'

export function LoadingState({ label = 'ESTABLISHING UPLINK' }: { label?: string }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-12">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-signal"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <p className="text-xs tracking-widest text-ink-dim uppercase">{label}…</p>
    </Card>
  )
}
