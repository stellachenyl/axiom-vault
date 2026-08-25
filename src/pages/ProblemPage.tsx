import { useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ContentGate } from '@/components/ContentGate'
import { useContentStore } from '@/stores/useContentStore'
import { MathText } from '@/components/MathText'
import { PointsBadge } from '@/components/PointsBadge'
import { TimerPill } from '@/components/TimerPill'
import { StreakPill } from '@/components/StreakPill'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Modal } from '@/components/Modal'
import { HintDrawer } from '@/components/HintDrawer'
import { EmptyState } from '@/components/EmptyState'
import { useGameStore, type AttemptRecord } from '@/stores/useGameStore'
import { checkAnswer, type AnswerCheckResult } from '@/engine/answerChecker'
import { computeEarnedPoints } from '@/engine/scoring'
import { cn } from '@/lib/format'
import type { LoadedPack } from '@/engine/contentLoader'
import type { Problem } from '@/types/problem'

export function ProblemPage() {
  return (
    <ContentGate>
      <ProblemView />
    </ContentGate>
  )
}

function ProblemView() {
  const { packId, problemId } = useParams<{ packId: string; problemId: string }>()
  const packs = useContentStore((s) => s.packs)
  const loadedPack = packs.find((p) => p.entry.id === packId)
  const problemIndex =
    loadedPack && problemId ? loadedPack.pack.problems.findIndex((p) => p.id === problemId) : -1

  if (!loadedPack || problemIndex === -1) {
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

  const problem = loadedPack.pack.problems[problemIndex]

  return (
    <ProblemRunner
      key={problem.id}
      loadedPack={loadedPack}
      problem={problem}
      problemIndex={problemIndex}
    />
  )
}

interface Submission extends AnswerCheckResult {
  earnedPoints: number
}

function ProblemRunner({
  loadedPack,
  problem,
  problemIndex,
}: {
  loadedPack: LoadedPack
  problem: Problem
  problemIndex: number
}) {
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [hintOpen, setHintOpen] = useState(false)
  const [revealedHints, setRevealedHints] = useState(0)
  const [confirmModal, setConfirmModal] = useState(false)
  const [expired, setExpired] = useState(false)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const openedAt = useRef(Date.now())

  const totalPoints = useGameStore((s) => s.totalPoints)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const bestStreak = useGameStore((s) => s.bestStreak)
  const recordAttempt = useGameStore((s) => s.recordAttempt)

  const codename = problem.title ?? `NODE-${String(problemIndex + 1).padStart(3, '0')}`
  const locked = submission !== null || expired
  const canSubmit = !locked && resolveCanSubmit(problem, answer)

  const revealHint = () => {
    if (revealedHints >= problem.hints.length) return
    setRevealedHints((n) => n + 1)
    useGameStore.getState().useHint()
  }

  const transmit = () => {
    if (!canSubmit) return
    const secondsUsed = Math.floor((Date.now() - openedAt.current) / 1000)
    const result = checkAnswer(problem, answer)

    let earnedPoints = 0
    if (result.isCorrect) {
      earnedPoints = computeEarnedPoints({
        basePoints: problem.points,
        timeLimitSeconds: problem.timeLimitSeconds,
        secondsUsed,
        hintsRevealed: revealedHints,
        currentStreak,
      })
    }

    const attempt: AttemptRecord = {
      problemId: problem.id,
      packId: loadedPack.pack.packId,
      correct: result.isCorrect,
      pointsAwarded: earnedPoints,
      hintsUsed: revealedHints,
    }
    recordAttempt(attempt)
    setSubmission({ ...result, earnedPoints })
  }

  const goNext = () => {
    const problems = loadedPack.pack.problems
    const next = problems[problemIndex + 1]
    if (next) {
      navigate(`/vault/${loadedPack.pack.packId}/problem/${next.id}`)
    } else {
      navigate(`/results/${loadedPack.pack.packId}`)
    }
  }

  const feedback = submission && buildFeedback(submission, currentStreak, problem.points)

  return (
    <div className="relative space-y-6">
      <nav className="text-[11px] tracking-widest text-ink-dim uppercase">
        <Link to="/" className="hover:text-signal">
          Mission select
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/vault/${loadedPack.pack.packId}`} className="hover:text-signal">
          {loadedPack.pack.codename}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{codename}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-widest text-signal sm:text-xl">{codename}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <TimerPill
            limitSeconds={problem.timeLimitSeconds}
            running={!locked}
            onExpire={() => setExpired(true)}
          />
          <StreakPill streak={currentStreak} best={bestStreak} />
          <PointsBadge value={totalPoints} />
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[10px] tracking-widest text-ink-dim uppercase">// Signal</span>
          <PointsBadge value={problem.points} />
        </div>
        <MathText source={problem.statementMarkdown} className="text-sm text-ink" />
      </Card>

      <Card className="p-6">
        <span className="mb-4 block text-[10px] tracking-widest text-ink-dim uppercase">
          // Resolution key
        </span>

        <AnswerInput problem={problem} value={answer} onChange={setAnswer} disabled={locked} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setHintOpen(true)}>
            ? Hints ({revealedHints}/{problem.hints.length})
          </Button>
          {locked ? (
            <Button size="lg" onClick={goNext}>
              {problemIndex + 1 < loadedPack.pack.problems.length ? 'Next node ▸' : 'Run debrief ▸'}
            </Button>
          ) : (
            <Button size="lg" disabled={!canSubmit} onClick={() => setConfirmModal(true)}>
              Submit key ▸
            </Button>
          )}
        </div>

        {feedback && (
          <div
            role="status"
            className={cn(
              'mt-5 rounded border p-4 font-mono text-[11px] leading-relaxed',
              feedback.tone === 'good'
                ? 'border-signal bg-signal/5 text-signal'
                : feedback.tone === 'warn'
                  ? 'border-warn bg-warn/5 text-warn'
                  : 'border-alert bg-alert/5 text-alert',
            )}
          >
            {feedback.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
      </Card>

      <HintDrawer
        open={hintOpen}
        hints={problem.hints}
        revealedCount={revealedHints}
        onReveal={revealHint}
        onClose={() => setHintOpen(false)}
      />

      <Modal open={confirmModal} title="Transmit resolution key?" onClose={() => setConfirmModal(false)}>
        <p className="mb-6 text-xs leading-relaxed text-ink-dim">
          One transmission per anomaly. A mismatch will break your sync streak.
        </p>
        <pre className="mb-6 overflow-x-auto rounded border border-edge bg-panel-raised p-3 font-mono text-[11px] text-ink">
          {answer.trim() || '(empty)'}
        </pre>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmModal(false)
              transmit()
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function buildFeedback(
  submission: Submission,
  streakBefore: number,
  basePoints: number,
): { tone: 'good' | 'warn' | 'bad'; lines: string[] } {
  switch (submission.verdict) {
    case 'correct':
      return {
        tone: 'good',
        lines: [
          '▸ SIGNAL LOCKED — ANOMALY CONTAINED',
          `▸ +${submission.earnedPoints} AP awarded (base ${basePoints})`,
          `▸ Sync streak: ${streakBefore + 1}`,
        ],
      }
    case 'close':
      return {
        tone: 'warn',
        lines: ['▸ CLOSE SIGNAL — within double tolerance', '▸ No sync. Recalibrate and retry via next window.'],
      }
    case 'unparseable':
      return { tone: 'bad', lines: ['▸ KEY REJECTED — malformed numeric payload'] }
    default:
      return { tone: 'bad', lines: ['▸ NO SYNC — transmission rejected'] }
  }
}

function AnswerInput({
  problem,
  value,
  onChange,
  disabled,
}: {
  problem: Problem
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  if (problem.answer.type === 'choice') {
    return (
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="sr-only">Select an option</legend>
        {problem.answer.options.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex items-start gap-3 rounded border p-3 transition-colors',
              disabled ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-panel-raised',
              value === option.id ? 'border-signal bg-signal/5' : 'border-edge-bright',
            )}
          >
            <input
              type="radio"
              name={`option-${problem.id}`}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              disabled={disabled}
              className="mt-1 accent-[#35e0b8]"
            />
            <MathText source={option.labelMarkdown} className="text-xs text-ink" />
          </label>
        ))}
      </fieldset>
    )
  }

  const isNumeric = problem.answer.type === 'numeric'

  return (
    <input
      type="text"
      inputMode={isNumeric ? 'decimal' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isNumeric ? 'Enter numeric key…' : 'Enter resolution key…'}
      autoComplete="off"
      spellCheck={!isNumeric}
      disabled={disabled}
      className="w-full rounded border border-edge-bright bg-panel-raised p-3 font-mono text-sm placeholder:text-ink-dim/50 focus:border-signal focus:outline-none disabled:opacity-60"
    />
  )
}

function resolveCanSubmit(problem: Problem, answer: string): boolean {
  if (problem.answer.type === 'choice') return answer !== ''
  return answer.trim().length > 0
}
