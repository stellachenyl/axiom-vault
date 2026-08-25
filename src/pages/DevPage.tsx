import { PLACEHOLDER_PACKS } from '@/game/placeholderPacks'
import { useGameStore } from '@/stores/useGameStore'
import { Card } from '@/components/Card'
import { DifficultyBadge } from '@/components/DifficultyBadge'

interface EnvVar {
  key: string
  value: string
  source: 'import.meta.env' | 'runtime'
}

function getEnvVars(): EnvVar[] {
  const env = import.meta.env
  return Object.entries(env)
    .filter(([k]) => k.startsWith('VITE_') || ['MODE', 'DEV', 'PROD', 'BASE_URL'].includes(k))
    .map(([k, v]) => ({ key: k, value: String(v), source: 'import.meta.env' }))
}

export function DevPage() {
  const store = useGameStore()
  const envVars = getEnvVars()

  const totalAnomalies = PLACEHOLDER_PACKS.reduce((n, p) => n + p.anomalies.length, 0)
  const validationIssues: string[] = []
  for (const pack of PLACEHOLDER_PACKS) {
    if (pack.anomalies.length === 0) validationIssues.push(`${pack.vault.id}: no anomalies`)
    for (const a of pack.anomalies) {
      if (!a.signal.trim()) validationIssues.push(`${a.id}: empty signal`)
      if (a.hints.length === 0) validationIssues.push(`${a.id}: no hint channels`)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-bold tracking-widest text-warn">// DEV CONSOLE</h1>
        <p className="mt-1 text-[11px] tracking-widest text-ink-dim uppercase">
          internal diagnostics — do not expose publicly
        </p>
      </header>

      <section aria-label="Loaded packs">
        <h2 className="mb-3 text-xs tracking-widest text-ink-dim uppercase">Loaded problem packs</h2>
        <div className="space-y-3">
          {PLACEHOLDER_PACKS.map((pack) => (
            <Card key={pack.vault.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold tracking-widest">{pack.vault.codename}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-dim">id: {pack.vault.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <DifficultyBadge level={pack.vault.threatLevel} />
                  <span className="text-[11px] text-ink-dim">
                    {pack.anomalies.length} nodes · {totalAnomalies} total loaded
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Environment config">
        <h2 className="mb-3 text-xs tracking-widest text-ink-dim uppercase">Environment config</h2>
        <Card className="divide-y divide-edge">
          {envVars.map((v) => (
            <div key={v.key} className="flex justify-between gap-4 px-4 py-2 text-[11px]">
              <span className="text-signal">{v.key}</span>
              <span className="truncate text-ink-dim">{v.value}</span>
            </div>
          ))}
        </Card>
      </section>

      <section aria-label="Validation status">
        <h2 className="mb-3 text-xs tracking-widest text-ink-dim uppercase">Validation status</h2>
        <Card className="p-4">
          {validationIssues.length === 0 ? (
            <p className="text-xs text-signal">✓ All packs pass placeholder validation.</p>
          ) : (
            <ul className="space-y-1 text-xs text-alert">
              {validationIssues.map((issue) => (
                <li key={issue}>⚠ {issue}</li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section aria-label="Store state">
        <h2 className="mb-3 text-xs tracking-widest text-ink-dim uppercase">useGameStore state</h2>
        <Card className="overflow-x-auto p-4">
          <pre className="font-mono text-[11px] leading-relaxed text-ink-dim">
            {JSON.stringify(
              {
                totalPoints: store.totalPoints,
                currentStreak: store.currentStreak,
                bestStreak: store.bestStreak,
                unlockedVaults: store.unlockedVaults,
                completedProblems: store.completedProblems,
                hintsUsed: store.hintsUsed,
                lastPlayedPackId: store.lastPlayedPackId,
              },
              null,
              2,
            )}
          </pre>
        </Card>
      </section>
    </div>
  )
}
