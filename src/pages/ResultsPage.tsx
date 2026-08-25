import { useParams, Link } from 'react-router-dom'
import { ContentGate } from '@/components/ContentGate'
import { useContentStore } from '@/stores/useContentStore'
import { useGameStore } from '@/stores/useGameStore'
import { deriveRunRank } from '@/engine/progression'
import { Card } from '@/components/Card'
import { ProgressBar } from '@/components/ProgressBar'
import { EmptyState } from '@/components/EmptyState'
import { PointsBadge } from '@/components/PointsBadge'
import { formatAp } from '@/lib/format'

export function ResultsPage() {
  return (
    <ContentGate>
      <ResultsView />
    </ContentGate>
  )
}

function ResultsView() {
  const { packId } = useParams<{ packId: string }>()
  const packs = useContentStore((s) => s.packs)
  const loaded = packId ? packs.find((p) => p.entry.id === packId) : undefined
  const attemptLog = useGameStore((s) => s.attemptLog)
  const bestStreak = useGameStore((s) => s.bestStreak)
  const hintsUsed = useGameStore((s) => s.hintsUsed)

  if (!loaded) {
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

  const { pack } = loaded
  const attempts = attemptLog.filter((a) => a.packId === pack.packId)

  const completedIds = new Set(
    attempts.filter((a) => a.correct).map((a) => a.problemId),
  )
  const completion = pack.problems.length > 0 ? completedIds.size / pack.problems.length : 0

  const earnedPoints = attempts.reduce((sum, a) => sum + a.pointsAwarded, 0)
  const accuracy = attempts.length > 0 ? attempts.filter((a) => a.correct).length / attempts.length : 0
  const rank = deriveRunRank({ completion, accuracy })

  return (
    <div className="space-y-8">
      <nav className="text-[11px] tracking-widest text-ink-dim uppercase">
        <Link to="/" className="hover:text-signal">
          Mission select
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Debrief · {pack.codename}</span>
      </nav>

      <header className="py-6 text-center">
        <p className="text-[10px] tracking-[0.4em] text-ink-dim uppercase">run debrief</p>
        <h1 className="mt-2 text-2xl font-bold tracking-widest text-signal sm:text-3xl">
          {pack.codename}
        </h1>
        <p className="mt-4 inline-block rounded border border-warn px-4 py-1.5 font-mono text-sm tracking-[0.25em] text-warn">
          ▸ {rank} ◂
        </p>
      </header>

      <ProgressBar value={completedIds.size} max={pack.problems.length} label="Vault sync" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 text-center">
          <p className="text-[10px] tracking-widest text-ink-dim uppercase">Sync</p>
          <p className="mt-2 text-3xl font-bold">
            {completedIds.size} / {pack.problems.length}
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-dim">{Math.round(completion * 100)}% contained</p>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-2 p-5">
          <p className="text-[10px] tracking-widest text-ink-dim uppercase">Axiom points earned</p>
          <PointsBadge value={earnedPoints} className="scale-125" />
        </Card>
        <Card className="p-5 text-center">
          <p className="text-[10px] tracking-widest text-ink-dim uppercase">Transmission accuracy</p>
          <p className="mt-2 text-3xl font-bold">{Math.round(accuracy * 100)}%</p>
          <p className="mt-1 font-mono text-[10px] text-ink-dim">{attempts.length} transmissions</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-[10px] tracking-widest text-ink-dim uppercase">Best sync streak</p>
          <p className="mt-2 text-3xl font-bold">{bestStreak}</p>
          <p className="mt-1 font-mono text-[10px] text-ink-dim">{hintsUsed} hint channels pulled</p>
        </Card>
      </div>

      <Card className="overflow-x-auto p-6">
        <h2 className="mb-4 flex items-center gap-3 text-xs tracking-widest text-ink-dim uppercase">
          Node telemetry <span className="h-px flex-1 bg-edge" />
        </h2>
        {attempts.length === 0 ? (
          <p className="font-mono text-xs text-ink-dim">No transmissions recorded for this vault.</p>
        ) : (
          <table className="w-full min-w-[420px] text-left font-mono text-[11px]">
            <thead>
              <tr className="border-b border-edge text-ink-dim uppercase">
                <th className="py-2 pr-4 font-normal">Node</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 font-normal">Hints</th>
                <th className="py-2 text-right font-normal">AP</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, i) => {
                const problem = pack.problems.find((p) => p.id === attempt.problemId)
                return (
                  <tr key={`${attempt.problemId}-${i}`} className="border-b border-edge/50">
                    <td className="py-2 pr-4 text-ink">{problem?.title ?? attempt.problemId}</td>
                    <td className={`py-2 pr-4 ${attempt.correct ? 'text-signal' : 'text-alert'}`}>
                      {attempt.correct ? 'CONTAINED' : 'REJECTED'}
                    </td>
                    <td className="py-2 pr-4 text-ink-dim">{attempt.hintsUsed}</td>
                    <td className="py-2 text-right text-ink-dim">+{formatAp(attempt.pointsAwarded)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={`/vault/${pack.packId}`}
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
