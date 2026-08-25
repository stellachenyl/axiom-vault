import { describe, expect, it } from 'vitest'
import { deriveClearance, deriveRunRank } from './progression'
import { cn, formatAp, threatLabel } from '@/lib/format'

describe('deriveClearance', () => {
  it('maps point totals to tiers', () => {
    expect(deriveClearance(0)).toBe('INITIATE')
    expect(deriveClearance(99)).toBe('INITIATE')
    expect(deriveClearance(100)).toBe('OPERATOR')
    expect(deriveClearance(600)).toBe('ANALYST')
    expect(deriveClearance(1500)).toBe('ARCHITECT')
    expect(deriveClearance(3000)).toBe('SINGULARITY')
  })
})

describe('deriveRunRank', () => {
  it('grants clearance only for full sync with high accuracy', () => {
    expect(deriveRunRank({ completion: 1, accuracy: 0.9 })).toBe('CLEARANCE GRANTED')
    expect(deriveRunRank({ completion: 1, accuracy: 1 })).toBe('CLEARANCE GRANTED')
  })

  it('seals the vault for full sync without high accuracy', () => {
    expect(deriveRunRank({ completion: 1, accuracy: 0.5 })).toBe('VAULT SEALED')
  })

  it('labels partial strong runs as contained', () => {
    expect(deriveRunRank({ completion: 0.75, accuracy: 0.8 })).toBe('ANOMALY CONTAINED')
  })

  it('labels weak-but-nonzero runs as stable sync', () => {
    expect(deriveRunRank({ completion: 0.2, accuracy: 0.3 })).toBe('SYNC STABLE')
  })

  it('returns SIGNAL LOST for empty runs', () => {
    expect(deriveRunRank({ completion: 0, accuracy: 0 })).toBe('SIGNAL LOST')
  })

  it('clamps out-of-range inputs', () => {
    expect(deriveRunRank({ completion: 5, accuracy: 1 })).toBe('CLEARANCE GRANTED')
    expect(deriveRunRank({ completion: 1, accuracy: -3 })).toBe('VAULT SEALED')
    expect(deriveRunRank({ completion: -1, accuracy: -1 })).toBe('SIGNAL LOST')
  })
})

describe('lib/format', () => {
  it('cn joins truthy classes only', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
    expect(cn()).toBe('')
  })

  it('formatAp groups thousands', () => {
    expect(formatAp(1234)).toBe('1,234')
    expect(formatAp(0)).toBe('0')
  })

  it('threatLabel clamps to known labels', () => {
    expect(threatLabel(1)).toBe('STABLE')
    expect(threatLabel(5)).toBe('CRITICAL')
    expect(threatLabel(0)).toBe('STABLE')
    expect(threatLabel(99)).toBe('CRITICAL')
  })
})
