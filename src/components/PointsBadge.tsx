import { formatAp } from '@/lib/format'
import { cn } from '@/lib/format'

export function PointsBadge({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border border-edge-bright bg-panel-raised px-2 py-0.5 text-[10px] tracking-widest text-signal uppercase',
        className,
      )}
    >
      ◆ {formatAp(value)} AP
    </span>
  )
}
