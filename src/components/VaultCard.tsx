import { Link, useNavigate } from 'react-router-dom'
import type { ProblemPack } from '@/types/problem'
import { Card } from './Card'
import { DifficultyBadge } from './DifficultyBadge'
import { PointsBadge } from './PointsBadge'
import { ProgressBar } from './ProgressBar'

export function VaultCard({
  pack,
  completedCount,
}: {
  pack: ProblemPack
  completedCount: number
}) {
  const navigate = useNavigate()
  const locked = false
  const apTotal = pack.problems.reduce((sum, p) => sum + p.points, 0)

  return (
    <Card
      onClick={() => navigate(`/vault/${pack.packId}`)}
      className="relative cursor-pointer p-5 hover:border-signal hover:shadow-[0_0_24px_rgba(53,224,184,0.12)]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/vault/${pack.packId}`)}
    >
      <Link
        to={`/vault/${pack.packId}`}
        className="pointer-events-none absolute inset-0"
        aria-label={`Enter ${pack.codename}`}
        tabIndex={-1}
      />
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-widest text-signal">{pack.codename}</h3>
          <p className="mt-1 font-mono text-[10px] tracking-widest text-ink-dim uppercase">
            {pack.packId}
          </p>
        </div>
        <DifficultyBadge difficulty={pack.difficulty} />
      </div>

      <p className="mb-4 text-xs leading-relaxed text-ink-dim">{pack.description}</p>

      <ProgressBar value={completedCount} max={pack.problems.length} label="Sync" />

      <div className="mt-4 flex items-center justify-between">
        <PointsBadge value={apTotal} />
        <span className="text-[10px] tracking-widest text-ink-dim uppercase">
          {locked ? '◈ SEALED' : '▶ BREACH'}
        </span>
      </div>
    </Card>
  )
}
