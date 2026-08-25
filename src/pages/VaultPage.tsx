import { useParams, Link, useNavigate } from 'react-router-dom'
import { findPack } from '@/game/placeholderPacks'
import { ProblemCard } from '@/components/ProblemCard'
import { DifficultyBadge } from '@/components/DifficultyBadge'
import { PointsBadge } from '@/components/PointsBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { useGameStore } from '@/stores/useGameStore'

export function VaultPage() {
  const { packId } = useParams<{ packId: string }>()
  const pack = packId ? findPack(packId) : undefined
  const completedProblems = useGameStore((s) => s.completedProblems)
  const navigate = useNavigate()

  if (!pack) {
    return (
      <EmptyState
        title="VAULT NOT FOUND"
        message={`No vault registered under id "${packId}". Return to mission select.`}
        action={
          <Link
            to="/"
            className="rounded border border-edge-bright px-3 py-1.5 text-xs tracking-widest uppercase transition-colors hover:border-signal hover:text-signal"
          >
            Back to mission select
          </Link>
        }
      />
    )
  }

  const clearedCount = pack.anomalies.filter((a) => completedProblems.includes(a.id)).length

  return (
    <div className="space-y-8">
      <nav className="text-[11px] tracking-widest text-ink-dim uppercase">
        <Link to="/" className="hover:text-signal">
          Mission select
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{pack.vault.codename}</span>
      </nav>

      <header className="flex flex-col gap-4 rounded-lg border border-edge bg-panel p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-signal sm:text-2xl">
            {pack.vault.codename}
          </h1>
          <p className="mt-1 text-[10px] tracking-widest text-ink-dim uppercase">
            {pack.vault.sector}
          </p>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-dim">
            {pack.vault.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
          <DifficultyBadge level={pack.vault.threatLevel} />
          <PointsBadge value={pack.vault.apTotal} />
        </div>
      </header>

      <ProgressBar value={clearedCount} max={pack.anomalies.length} label="Sync" />

      <section aria-label="Anomalies">
        <h2 className="mb-4 flex items-center gap-3 text-xs tracking-widest text-ink-dim uppercase">
          Anomalies ({pack.anomalies.length}) <span className="h-px flex-1 bg-edge" />
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {pack.anomalies.map((anomaly) => (
            <ProblemCard
              key={anomaly.id}
              anomaly={anomaly}
              packId={pack.vault.id}
              status={completedProblems.includes(anomaly.id) ? 'cleared' : 'pending'}
            />
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={() => navigate(`/results/${pack.vault.id}`)}>View run results →</Button>
      </div>
    </div>
  )
}
