import { useParams, Link } from 'react-router-dom'
import { findPack } from '@/game/placeholderPacks'
import { Card } from '@/components/Card'
import { ProgressBar } from '@/components/ProgressBar'
import { EmptyState } from '@/components/EmptyState'
import { PointsBadge } from '@/components/PointsBadge'

export function ResultsPage() {
  const { packId } = useParams<{ packId: string }>()
  const pack = packId ? findPack(packId) : undefined

  if (!pack) {
    return (
      <EmptyState
        title="RUN NOT FOUND"
        message={`No run data exists for vault id "${packId}".`}
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

  return (
    <div className="space-y-8">
      <nav className="text-[11px] tracking-widest text-ink-dim uppercase">
        <Link to="/" className="hover:text-signal">
          Mission select
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Results · {pack.vault.codename}</span>
      </nav>

      <header className="py-8 text-center">
        <p className="text-[10px] tracking-[0.4em] text-ink-dim uppercase">run debrief</p>
        <h1 className="mt-2 text-2xl font-bold tracking-widest text-signal sm:text-3xl">
          {pack.vault.codename}
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <p className="text-[10px] tracking-widest text-ink-dim uppercase">Sync</p>
          <p className="mt-2 text-3xl font-bold">0 / {pack.anomalies.length}</p>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-2 p-5">
          <p className="text-[10px] tracking-widest text-ink-dim uppercase">Axiom points earned</p>
          <PointsBadge value={0} className="scale-125" />
        </Card>
        <Card className="p-5 text-center">
          <p className="text-[10px] tracking-widest text-ink-dim uppercase">Accuracy</p>
          <p className="mt-2 text-3xl font-bold text-ink-dim">—</p>
        </Card>
      </div>

      <Card className="p-6">
        <ProgressBar value={0} max={pack.anomalies.length} label="Vault sync" />
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-dim">
          Run telemetry is not yet recorded in this build. Results will populate once scoring goes
          live.
        </p>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={`/vault/${pack.vault.id}`}
          className="rounded border border-edge-bright px-4 py-2 text-xs tracking-widest uppercase transition-colors hover:border-signal hover:text-signal"
        >
          Re-enter vault
        </Link>
        <Link
          to="/"
          className="rounded border border-edge-bright px-4 py-2 text-xs tracking-widest uppercase transition-colors hover:border-signal hover:text-signal"
        >
          Mission select
        </Link>
      </div>
    </div>
  )
}
