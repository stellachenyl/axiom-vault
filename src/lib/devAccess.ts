import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * The dev console has no login system to hide behind, so access is gated by
 * an operator override flag instead of a visible link:
 *
 *   1. typing the secret code "axiom" on any page (outside of a text field)
 *      unlocks the console for this browser and navigates to /dev
 *   2. or setting localStorage["axiom-vault-dev"] = "granted" manually
 *
 * Everyone else — including direct visitors to /dev — sees a dead sector.
 */

const UNLOCK_KEY = 'axiom-vault-dev'
const SECRET_CODE = 'axiom'

export function isDevUnlocked(): boolean {
  return window.localStorage.getItem(UNLOCK_KEY) === 'granted'
}

export function unlockDev(): void {
  window.localStorage.setItem(UNLOCK_KEY, 'granted')
}

export function lockDev(): void {
  window.localStorage.removeItem(UNLOCK_KEY)
}

/** Listens for the secret operator code and unlocks + navigates on match. */
export function useDevCodeListener() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let buffer = ''
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.isComposing) {
        return // never trigger while typing into fields
      }
      if (event.key.length !== 1) return
      buffer = (buffer + event.key.toLowerCase()).slice(-SECRET_CODE.length)
      if (buffer === SECRET_CODE) {
        buffer = ''
        unlockDev()
        if (location.pathname !== '/dev') navigate('/dev')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, location.pathname])
}
