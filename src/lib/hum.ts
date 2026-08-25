/**
 * Ambient "system hum" generated entirely with the Web Audio API — no audio
 * files, no bandwidth.
 *
 * Graph:
 *   oscA (sine) ─┐
 *   oscB (sine,  ├─► lowpass ──► master gain ──► destination
 *   detuned)  ───┘                 ▲
 *   heartbeatLFO ──────────────────┘ (depth > 0 only in critical phase)
 *
 * Browser autoplay policy: the AudioContext is created/resumed lazily on the
 * first user gesture (see initFromPreference). Enabling the hum from a click
 * always counts as a gesture; restoring a saved preference waits for one.
 */

export type HumPhase = 'idle' | 'elevated' | 'critical'

const PREF_KEY = 'axiom-vault-hum'

interface PhaseTuning {
  baseFreq: number
  detune: number
  filterFreq: number
  level: number
  lfoRate: number
  lfoDepth: number
}

const TUNING: Record<HumPhase, PhaseTuning> = {
  // Low and steady.
  idle: { baseFreq: 54, detune: 1.5, filterFreq: 220, level: 0.05, lfoRate: 0.15, lfoDepth: 0.015 },
  // Timer active, plenty of headroom — pitch up slightly.
  elevated: { baseFreq: 66, detune: 2.2, filterFreq: 320, level: 0.06, lfoRate: 0.25, lfoDepth: 0.02 },
  // Under 20% remaining — rhythmic heartbeat-like pulse.
  critical: { baseFreq: 71, detune: 3, filterFreq: 420, level: 0.07, lfoRate: 1.1, lfoDepth: 0.09 },
}

class HumEngine {
  private ctx: AudioContext | null = null
  private oscA: OscillatorNode | null = null
  private oscB: OscillatorNode | null = null
  private filter: BiquadFilterNode | null = null
  private master: GainNode | null = null
  private lfo: OscillatorNode | null = null
  private lfoGain: GainNode | null = null
  private enabled = false
  private phase: HumPhase = 'idle'

  /** True when a preference says the hum should play (even pre-gesture). */
  get preferred(): boolean {
    try {
      return window.localStorage.getItem(PREF_KEY) === 'on'
    } catch {
      return false
    }
  }

  get isEnabled(): boolean {
    return this.enabled
  }

  setPreference(on: boolean): void {
    try {
      if (on) window.localStorage.setItem(PREF_KEY, 'on')
      else window.localStorage.removeItem(PREF_KEY)
    } catch {
      /* non-fatal */
    }
  }

  /**
   * If the saved preference is "on", start the hum at the first user gesture
   * anywhere on the page (autoplay-policy compliant).
   */
  initFromPreference(): void {
    if (!this.preferred || this.enabled) return
    const kickOff = () => {
      document.removeEventListener('pointerdown', kickOff)
      document.removeEventListener('keydown', kickOff)
      if (this.preferred && !this.enabled) void this.setEnabled(true)
    }
    document.addEventListener('pointerdown', kickOff, { once: true })
    document.addEventListener('keydown', kickOff, { once: true })
  }

  async setEnabled(on: boolean): Promise<void> {
    this.setPreference(on)
    if (on === this.enabled) return
    this.enabled = on
    if (on) {
      if (!this.ensureCtx()) return // no Web Audio — stay silent, keep pref
      await this.startGraph()
      this.applyPhase()
    } else {
      await this.teardownGraph()
    }
  }

  setPhase(phase: HumPhase): void {
    if (phase === this.phase) return
    this.phase = phase
    if (this.enabled && this.ctx && this.master) this.applyPhase()
  }

  /** Returns the context, or null when the Web Audio API is unavailable. */
  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) {
      return null
    }
    this.ctx = new Ctor()
    return this.ctx
  }

  private async startGraph(): Promise<void> {
    const ctx = this.ctx
    if (!ctx) return

    await ctx.resume().catch(() => undefined)

    const now = ctx.currentTime
    const tuning = TUNING[this.phase]

    this.oscA = ctx.createOscillator()
    this.oscB = ctx.createOscillator()
    this.oscA.type = 'sine'
    this.oscB.type = 'triangle'
    this.oscA.frequency.value = tuning.baseFreq
    this.oscB.frequency.value = tuning.baseFreq + tuning.detune

    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = tuning.filterFreq
    this.filter.Q.value = 0.8

    this.master = ctx.createGain()
    this.master.gain.setValueAtTime(0.0001, now)

    // Slow breathing LFO for organic movement.
    this.lfo = ctx.createOscillator()
    this.lfo.type = 'sine'
    this.lfo.frequency.value = tuning.lfoRate
    this.lfoGain = ctx.createGain()
    this.lfoGain.gain.value = tuning.lfoDepth
    this.lfo.connect(this.lfoGain).connect(this.master.gain)

    this.oscA.connect(this.filter)
    this.oscB.connect(this.filter)
    this.filter.connect(this.master)
    this.master.connect(ctx.destination)

    this.oscA.start(now)
    this.oscB.start(now)
    this.lfo.start(now)

    // Gentle fade-in so enabling never clicks.
    this.master.gain.exponentialRampToValueAtTime(tuning.level, now + 1.2)
  }

  private async teardownGraph(): Promise<void> {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now)
    this.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    const nodes = [this.oscA, this.oscB, this.lfo]
    window.setTimeout(() => {
      for (const node of nodes) node?.stop()
      void ctx.suspend().catch(() => undefined)
    }, 500)
    this.oscA = null
    this.oscB = null
    this.lfo = null
    this.lfoGain = null
    this.master = null
    this.filter = null
  }

  private applyPhase(): void {
    const ctx = this.ctx
    if (!ctx || !this.master || !this.oscA || !this.oscB || !this.filter || !this.lfo || !this.lfoGain) {
      return
    }
    const t = ctx.currentTime
    const tuning = TUNING[this.phase]
    const ramp = (param: AudioParam, value: number, time = 0.6) => {
      param.cancelScheduledValues(t)
      param.setTargetAtTime(value, t, time / 3)
    }
    ramp(this.oscA.frequency, tuning.baseFreq)
    ramp(this.oscB.frequency, tuning.baseFreq + tuning.detune)
    ramp(this.filter.frequency, tuning.filterFreq)
    ramp(this.lfo.frequency, tuning.lfoRate, 0.3)
    ramp(this.lfoGain.gain, tuning.lfoDepth, 0.4)
    ramp(this.master.gain, tuning.level, 0.8)
  }

  /** Test hook / cleanup: forget all graph state without touching prefs. */
  resetForTest(): void {
    this.enabled = false
    this.phase = 'idle'
    this.ctx = null
    this.oscA = this.oscB = this.lfo = null
    this.lfoGain = null
    this.master = null
    this.filter = null
  }
}

export const humEngine = new HumEngine()
