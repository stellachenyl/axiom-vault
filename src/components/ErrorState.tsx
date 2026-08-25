import { Card } from './Card'
import { Button } from './Button'

export function ErrorState({
  title = 'SIGNAL LOST',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <Card className="flex flex-col items-center gap-3 border-alert/40 p-12 text-center">
      <span className="text-3xl text-alert" aria-hidden>
        ⚠
      </span>
      <h3 className="text-sm tracking-widest text-alert uppercase">{title}</h3>
      <p className="max-w-sm text-xs leading-relaxed text-ink-dim">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry uplink
        </Button>
      )}
    </Card>
  )
}
