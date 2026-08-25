import { Link, useNavigate } from 'react-router-dom'
import type { Vault } from '@/types'
import { Card } from './Card'
import { DifficultyBadge } from './DifficultyBadge'
import { PointsBadge } from './PointsBadge'
import { ProgressBar } from './ProgressBar'

export function VaultCard({ vault, completedCount }: { vault: Vault; completedCount: number }) {
  const navigate = useNavigate()
  const locked = false

  return (
    <Card
      onClick={() => navigate(`/vault/${vault.id}`)}
      className="relative cursor-pointer p-5 hover:border-signal hover:shadow-[0_0_24px_rgba(53,224,184,0.12)]"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/vault/${vault.id}`)}
    >
      <Link
        to={`/vault/${vault.id}`}
        className="pointer-events-none absolute inset-0"
        aria-label={`Enter ${vault.codename}`}
        tabIndex={-1}
      />
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-widest text-signal">{vault.codename}</h3>
          <p className="mt-1 text-[10px] tracking-widest text-ink-dim uppercase">{vault.sector}</p>
        </div>
        <DifficultyBadge level={vault.threatLevel} />
      </div>

      <p className="mb-4 text-xs leading-relaxed text-ink-dim">{vault.description}</p>

      <ProgressBar value={completedCount} max={6} label="Sync" />

      <div className="mt-4 flex items-center justify-between">
        <PointsBadge value={vault.apTotal} />
        <span className="text-[10px] tracking-widest text-ink-dim uppercase">
          {locked ? '◈ SEALED' : '▶ BREACH'}
        </span>
      </div>
    </Card>
  )
}

