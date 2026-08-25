import { Link, useLocation } from 'react-router-dom'
import { formatAp } from '@/lib/format'
import { useGameStore } from '@/stores/useGameStore'
import { StreakPill } from './StreakPill'

const NAV_ITEMS = [
  { to: '/', label: 'MISSION SELECT' },
  { to: '/dev', label: 'DEV CONSOLE' },
]

export function TopBar() {
  const location = useLocation()
  const totalPoints = useGameStore((s) => s.totalPoints)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const bestStreak = useGameStore((s) => s.bestStreak)

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-panel/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="text-sm font-bold tracking-[0.3em] text-signal uppercase">
          AXIOM<span className="text-ink">::</span>VAULT
        </Link>

        <nav className="hidden gap-6 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-[11px] tracking-widest uppercase transition-colors ${
                location.pathname === item.to ? 'text-signal' : 'text-ink-dim hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <StreakPill streak={currentStreak} best={bestStreak} className="hidden sm:inline-flex" />
          <span className="rounded border border-signal-dim px-2 py-0.5 text-[11px] tracking-widest text-signal">
            ◆ {formatAp(totalPoints)} AP
          </span>
        </div>
      </div>
    </header>
  )
}
