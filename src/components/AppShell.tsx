import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="scanlines flex min-h-full flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-edge py-4">
        <p className="text-center text-[10px] tracking-widest text-ink-dim uppercase">
          Axiom Vault · build 0.1.0 · all systems nominal
        </p>
      </footer>
    </div>
  )
}
