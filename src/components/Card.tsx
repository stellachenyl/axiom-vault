import { cn } from '@/lib/format'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-edge bg-panel transition-colors',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
