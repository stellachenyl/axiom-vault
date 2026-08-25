import { Card } from './Card'

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <span className="text-3xl text-edge-bright" aria-hidden>
        ▚▞
      </span>
      <h3 className="text-sm tracking-widest uppercase">{title}</h3>
      <p className="max-w-sm text-xs leading-relaxed text-ink-dim">{message}</p>
      {action}
    </Card>
  )
}
