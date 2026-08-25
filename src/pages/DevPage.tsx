import { useContentLoaded } from '@/stores/useContentStore'
import { getContentSource } from '@/engine/contentLoader'
import { useGameStore } from '@/stores/useGameStore'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { DifficultyBadge } from '@/components/DifficultyBadge'
import { LoadingState } from '@/components/LoadingState'

interface EnvVar {
  key: string
  value: string
}

function getEnvVars(): EnvVar[] {
  const env = import.meta.env
  return Object.entries(env)
    .filter(([k]) => k.startsWith('VITE_') || ['MODE', 'DEV', 'PROD', 'BASE_URL'].includes(k))
    .map(([k, v]) => ({ key: k, value: String(v) }))
}

export function DevPage() {
  const { status, source, packs, warnings, error, load } = useContentLoaded()
  const store = useGameStore()
  const contentSource = source ?? getContentSource()

  const totalProblems = packs.reduce((n, p) => n + p.pack.problems.length, 0)

  if (status === 'idle' || status === 'loading') {
    return <LoadingState label="LOADING CONTENT DIAGNOSTICS" />
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-bold tracking-widest text-warn">// DEV CONSOLE</h1>
        <p className="mt-1 text-[11px] tracking-widest text-ink-dim uppercase">
          internal diagnostics — do not expose publicly
        </p>
      </header>

      <section aria-label="Content status">
        <h2 className="mb-3 text-xs tracking-widest text-ink-dim uppercase">Content pipeline</h2>
        <Card className="divide-y divide-edge">
          <div className="flex justify-between gap-4 px-4 py-2 text-[11px]">
            <span className="text-signal">SOURCE MODE</span>
            <span className={contentSource.remote ? 'text-warn' : 'text-signal'}>
              {contentSource.remote ? 'REMOTE (VITE_PROBLEM_BASE_URL)' : 'LOCAL FALLBACK'}
            </span>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2 text-[11px]">
            <span className="text-signal">BASE URL</span>
            <span className="truncate text-ink-dim">{contentSource.baseUrl}</span>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2 text-[11px]">
            <span className="text-signal">LOAD STATUS</span>
            <span className={status === 'ready' ? 'text-signal' : 'text-alert'}>
              {status === 'ready' ? '✓ LOADED' : `✗ ${error ?? 'FAILED'}`}
            </span>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2 text-[11px]">
            <span className="text-signal">PACKS / PROBLEMS</span>
            <span className="text-ink-dim">
              {packs.length} packs · {totalProblems} problems
            </span>
          </div>
          <div className="flex justify-end px-4 py-2">
            <button
              onClick={() => void load({ fresh: true })}
              className="cursor-pointer rounded border border-edge-bright px-3 py-1 text-[10px] tracking-widest uppercase transition-colors hover:border-signal hover:text-signal"
            >
              Force reload
            </button>
          </div>
        </Card>
      </section>

      <section aria-label="Loaded packs">
        <h2 className="mb-3 text-xs tracking-widest text-ink-dim uppercase">Loaded problem packs</h2>
        {packs.length === 0 ? (
          <Card className="border-alert/40 p-4">
            <p className="text-xs text-alert">⚠ No packs loaded.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {packs.map(({ pack }) => (
              <Card key={pack.packId} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold tracking-widest">{pack.codename}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-dim">
                      id: {pack.packId} · file ok · schema valid
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <DifficultyBadge difficulty={pack.difficulty} />
                    <span className="text-[11px] text-ink-dim">
                      {pack.problems.length} nodes · {totalProblems} total loaded
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Environment config">
        <h2 className="mb-3 text-xs tracking-widest text-ink-dim uppercase">Environment config</h2>
        <Card className="divide-y divide-edge">
          {getEnvVars().map((v) => (
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
          {warnings.length === 0 ? (
            <p className="text-xs text-signal">✓ All loaded packs pass schema validation.</p>
          ) : (
            <ul className="space-y-1 font-mono text-xs text-alert">
              {warnings.map((issue) => (
                <li key={issue}>⚠ {issue}</li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section aria-label="Store state">
        <h2 className="mb-3 flex items-center justify-between gap-3 text-xs tracking-widest text-ink-dim uppercase">
          useGameStore state
        </h2>
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
                attemptLog: `${store.attemptLog.length} entries`,
              },
              null,
              2,
            )}
          </pre>
        </Card>
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-alert/40 bg-panel p-4">
          <div>
            <p className="text-[11px] tracking-widest text-alert uppercase">Danger zone</p>
            <p className="mt-1 text-[11px] text-ink-dim">
              Wipes local progress (points, streaks, telemetry) from this browser. Cannot be undone.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => store.resetRun()}>
            Purge progress
          </Button>
        </div>
      </section>
    </div>
  )
}
