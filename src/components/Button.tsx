import { cn } from '@/lib/format'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-signal text-void font-bold hover:bg-signal/85 border border-signal shadow-[0_0_12px_rgba(53,224,184,0.25)]',
  ghost: 'bg-transparent text-ink border border-edge-bright hover:border-signal hover:text-signal',
  danger: 'bg-alert text-void font-bold hover:bg-alert/85 border border-alert',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'cursor-pointer rounded uppercase tracking-widest transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
