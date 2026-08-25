/**
 * Maps a running trial timer onto the ambient hum's tension phases:
 *
 *   idle     — no time limit (or clock stopped): low, steady drone
 *   elevated — timer active with >20% remaining: pitch up slightly
 *   critical — under 20% remaining: rhythmic heartbeat-like pulse
 */
export type TimerPhase = 'idle' | 'elevated' | 'critical'

export function timerPhase(hasLimit: boolean, remainingFraction: number): TimerPhase {
  if (!hasLimit) return 'idle'
  if (remainingFraction < 0.2) return 'critical'
  return 'elevated' // includes the >50% "pitch up" band and the 20–50% band
}
