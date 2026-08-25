/** Session-scoped flag for the cinematic CRT boot sequence. */

const SESSION_KEY = 'axiom-vault-booted'

export function hasBootedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return true // storage unavailable — skip the cinematic rather than trap users
  }
}

export function markBooted(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* non-fatal */
  }
}
