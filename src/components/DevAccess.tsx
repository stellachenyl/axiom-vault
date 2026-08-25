import type { ReactNode } from 'react'
import { isDevUnlocked } from '@/lib/devAccess'
import { EmptyState } from './EmptyState'

/** Route-level gate: renders children only when the operator override is active. */
export function DevAccess({ children }: { children: ReactNode }) {
  if (!isDevUnlocked()) {
    return (
      <EmptyState
        title="SECTOR OFFLINE"
        message="This containment sector is not part of the public grid."
        action={
          <a
            href="/"
            className="rounded border border-edge-bright px-3 py-1.5 text-xs tracking-widest uppercase transition-colors hover:border-signal hover:text-signal"
          >
            Return to mission select
          </a>
        }
      />
    )
  }
  return <>{children}</>
}
