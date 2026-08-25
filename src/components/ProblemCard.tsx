import { useNavigate } from 'react-router-dom'
import type { Anomaly } from '@/types'
import { cn } from '@/lib/format'
import { Card } from './Card'
import { DifficultyBadge } from './DifficultyBadge'
import { PointsBadge } from './PointsBadge'

export function ProblemCard({
  anomaly,
  packId,
  status = 'pending',
}: {
  anomaly: Anomaly
  packId: string
  status?: 'pending' | 'cleared' | 'failed'
}) {
  const navigate = useNavigate()

  return (
    <Card
      onClick={() => navigate(`/vault/${packId}/problem/${anomaly.id}`)}
      className={cn(
        'cursor-pointer p-4 hover:border-signal hover:shadow-[0_0_20px_rgba(53,224,184,0.1)]',
        status === 'cleared' && 'border-signal-dim',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded border text-xs font-bold',
              status === 'cleared'
                ? 'border-signal bg-signal/10 text-signal'
                : status === 'failed'
                  ? 'border-alert bg-alert/10 text-alert'
                  : 'border-edge-bright text-ink-dim',
            )}
          >
            {status === 'cleared' ? '✓' : String(anomaly.index).padStart(2, '0')}
          </span>
          <div>
            <h3 className="text-xs font-bold tracking-widest">{anomaly.codename}</h3>
            <p className="mt-0.5 text-[10px] tracking-widest text-ink-dim uppercase">
              {status === 'cleared' ? 'CLEARED' : status === 'failed' ? 'SIGNAL DECAYED' : 'AWAITING ENTRY'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <DifficultyBadge level={anomaly.threatLevel} />
          <PointsBadge value={anomaly.apValue} />
        </div>
      </div>
    </Card>
  )
}
