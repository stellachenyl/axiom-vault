import { PLACEHOLDER_PACKS } from '@/game/placeholderPacks'
import { useGameStore } from '@/stores/useGameStore'
import { VaultCard } from '@/components/VaultCard'
import { Card } from '@/components/Card'
import { ProgressBar } from '@/components/ProgressBar'
import { formatAp } from '@/lib/format'

export function HomePage() {
  const totalPoints = useGameStore((s) => s.totalPoints)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const bestStreak = useGameStore((s) => s.bestStreak)
  const completedProblems = useGameStore((s) => s.completedProblems)

  return (
    <div className="space-y-10">
      <section className="py-6 text-center sm:py-12">
        <p className="mb-3 text-[10px] tracking-[0.4em] text-ink-dim uppercase">
          containment grid online
        </p>
        <h1 className="text-4xl font-bold tracking-[0.2em] text-signal drop-shadow-[0_0_24px_rgba(53,224,184,0.35)] sm:text-6xl">
          AXIOM VAULT
        </h1>
        <p className="mt-4 text-sm tracking-widest text-ink-dim uppercase">
          High-signal trials. Hidden topics. No mercy.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section aria-label="Vault select" className="order-2 lg:order-1">
          <h2 className="mb-4 flex items-center gap-3 text-xs tracking-widest text-ink-dim uppercase">
            Select vault <span className="h-px flex-1 bg-edge" />
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PLACEHOLDER_PACKS.map((pack) => (
              <VaultCard
                key={pack.vault.id}
                vault={pack.vault}
                completedCount={
                  pack.anomalies.filter((a) => completedProblems.includes(a.id)).length
                }
              />
            ))}
          </div>
        </section>

        <aside className="order-1 lg:order-2">
          <h2 className="mb-4 text-xs tracking-widest text-ink-dim uppercase">Operative panel</h2>
          <Card className="p-5">
            <dl className="space-y-5">
              <div>
                <dt className="text-[10px] tracking-widest text-ink-dim uppercase">Total points</dt>
                <dd className="mt-1 text-2xl font-bold text-signal">◆ {formatAp(totalPoints)} AP</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-[10px] tracking-widest text-ink-dim uppercase">Streak</dt>
                  <dd className="mt-1 text-lg font-bold">{currentStreak}</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-widest text-ink-dim uppercase">Best streak</dt>
                  <dd className="mt-1 text-lg font-bold">{bestStreak}</dd>
                </div>
              </div>
              <ProgressBar value={Math.min(totalPoints, 3000)} max={3000} label="Clearance sync" />
              <p className="text-center text-[11px] tracking-[0.25em] text-warn uppercase">
                CLEARED · {clearanceName(totalPoints)}
              </p>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function clearanceName(points: number): string {
  if (points >= 3000) return 'Singularity'
  if (points >= 1500) return 'Architect'
  if (points >= 600) return 'Analyst'
  if (points >= 100) return 'Operator'
  return 'Initiate'
}
