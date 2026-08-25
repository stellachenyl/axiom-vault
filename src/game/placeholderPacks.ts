import type { Anomaly, ProblemPack, ThreatLevel } from '@/types'

function makeAnomalies(
  vaultId: string,
  count: number,
  baseAp: number,
  baseThreat: ThreatLevel,
): Anomaly[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${vaultId}-n${i + 1}`,
    vaultId,
    index: i + 1,
    codename: `NODE-${String(i + 1).padStart(3, '0')}`,
    signal:
      'SIGNAL INTERCEPTED. PAYLOAD ENCRYPTED. Decrypt the pattern and submit a resolution key. Full protocol text will be injected here once the content pipeline is online.',
    threatLevel: baseThreat,
    apValue: baseAp + i * 10,
    hints: [
      'HINT ALPHA :: structure repeats every N iterations.',
      'HINT BETA :: reduce the system before expanding it.',
    ],
  }))
}

export const PLACEHOLDER_PACKS: ProblemPack[] = [
  {
    vault: {
      id: 'vault-alpha',
      codename: 'VAULT // ALPHA',
      sector: 'SECTOR 01 — FRACTURE LINE',
      description:
        'Entry-tier containment. Patterns are stable but deceptively layered. Recommended first breach.',
      threatLevel: 1,
      apTotal: 450,
    },
    anomalies: makeAnomalies('vault-alpha', 6, 60, 1),
  },
  {
    vault: {
      id: 'vault-bravo',
      codename: 'VAULT // BRAVO',
      sector: 'SECTOR 02 — SIGNAL DRIFT',
      description:
        'Intermediate containment. Signals drift between states mid-trial. Precision required.',
      threatLevel: 3,
      apTotal: 900,
    },
    anomalies: makeAnomalies('vault-bravo', 6, 130, 3),
  },
  {
    vault: {
      id: 'vault-omega',
      codename: 'VAULT // OMEGA',
      sector: 'SECTOR 07 — ANOMALY CORE',
      description:
        'Deep containment. No mercy protocols active. Only cleared operatives should attempt entry.',
      threatLevel: 5,
      apTotal: 1800,
    },
    anomalies: makeAnomalies('vault-omega', 5, 320, 5),
  },
]

export function findPack(packId: string): ProblemPack | undefined {
  return PLACEHOLDER_PACKS.find((p) => p.vault.id === packId)
}

export function findAnomaly(packId: string, problemId: string): Anomaly | undefined {
  return findPack(packId)?.anomalies.find((a) => a.id === problemId)
}
