import type { ReactNode } from 'react'
import { useContentLoaded } from '@/stores/useContentStore'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'

/** Renders children once problem content is loaded; handles loading/error UI. */
export function ContentGate({ children }: { children: ReactNode }) {
  const { status, error, load } = useContentLoaded()

  if (status === 'idle' || status === 'loading') {
    return <LoadingState label="SYNCING VAULT REGISTRY" />
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="CONTENT LINK DOWN"
        message={error ?? 'The vault registry could not be reached.'}
        onRetry={() => void load()}
      />
    )
  }

  return <>{children}</>
}
