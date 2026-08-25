export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const THREAT_LABELS = ['STABLE', 'LOW', 'ELEVATED', 'SEVERE', 'CRITICAL'] as const

export function threatLabel(level: number): string {
  return THREAT_LABELS[Math.min(Math.max(level, 1), 5) - 1]
}

export function formatAp(value: number): string {
  return value.toLocaleString('en-US')
}
