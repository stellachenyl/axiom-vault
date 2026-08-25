import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { findAnomaly, findPack } from '@/game/placeholderPacks'
import { DifficultyBadge } from '@/components/DifficultyBadge'
import { PointsBadge } from '@/components/PointsBadge'
import { TimerPill } from '@/components/TimerPill'
import { StreakPill } from '@/components/StreakPill'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { HintDrawer } from '@/components/HintDrawer'
import { EmptyState } from '@/components/EmptyState'
import { useGameStore } from '@/stores/useGameStore'

export function ProblemPage() {
  const { packId, problemId } = useParams<{ packId: string; problemId: string }>()
  const pack = packId ? findPack(packId) : undefined
  const anomaly = packId && problemId ? findAnomaly(packId, problemId) : undefined

  const [answer, setAnswer] = useState('')
  const [hintOpen, setHintOpen] = useState(false)
  const [revealedHints, setRevealedHints] = useState(0)
  const [submitModal, setSubmitModal] = useState(false)

  const totalPoints = useGameStore((s) => s.totalPoints)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const bestStreak = useGameStore((s) => s.bestStreak)

  if (!pack || !anomaly) {
    return (
      <EmptyState
        title="NODE NOT FOUND"
        message="This anomaly is not registered on the grid."
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
    <div className="relative space-y-6">
      <nav className="text-[11px] tracking-widest text-ink-dim uppercase">
        <Link to="/" className="hover:text-signal">
          Mission select
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/vault/${pack.vault.id}`} className="hover:text-signal">
          {pack.vault.codename}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{anomaly.codename}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-widest text-signal sm:text-xl">
          {anomaly.codename}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <TimerPill />
          <StreakPill streak={currentStreak} best={bestStreak} />
          <PointsBadge value={totalPoints} />
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] tracking-widest text-ink-dim uppercase">// Signal</span>
          <DifficultyBadge level={anomaly.threatLevel} />
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">{anomaly.signal}</p>
      </Card>

      <Card className="p-6">
        <span className="mb-4 block text-[10px] tracking-widest text-ink-dim uppercase">
          // Resolution key
        </span>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter your resolution key…"
          rows={3}
          className="w-full resize-y rounded border border-edge-bright bg-panel-raised p-3 font-mono text-sm placeholder:text-ink-dim/50 focus:border-signal focus:outline-none"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setHintOpen(true)}>
            ? Hints ({anomaly.hints.length})
          </Button>
          <Button size="lg" disabled={!answer.trim()} onClick={() => setSubmitModal(true)}>
            Submit key ▸
          </Button>
        </div>
      </Card>

      <HintDrawer
        open={hintOpen}
        hints={anomaly.hints}
        revealedCount={revealedHints}
        onReveal={() => setRevealedHints((n) => Math.min(n + 1, anomaly.hints.length))}
        onClose={() => setHintOpen(false)}
      />

      <Modal open={submitModal} title="Transmit resolution key?" onClose={() => setSubmitModal(false)}>
        <p className="mb-6 text-xs leading-relaxed text-ink-dim">
          Scoring protocols are not yet wired into this build. Transmission will be simulated.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setSubmitModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => setSubmitModal(false)}>Confirm</Button>
        </div>
      </Modal>
    </div>
  )
}
