import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { BootSequence } from '@/components/BootSequence'
import { hasBootedThisSession } from '@/lib/bootSession'
import { DevAccess } from '@/components/DevAccess'
import { HomePage } from '@/pages/HomePage'
import { VaultPage } from '@/pages/VaultPage'
import { ProblemPage } from '@/pages/ProblemPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { DevPage } from '@/pages/DevPage'

export function App() {
  // Cinematic CRT boot — once per browser session (skippable via any input).
  const [booted, setBooted] = useState(hasBootedThisSession)

  return (
    <>
      {!booted && <BootSequence onComplete={() => setBooted(true)} />}
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/vault/:packId" element={<VaultPage />} />
          <Route path="/vault/:packId/problem/:problemId" element={<ProblemPage />} />
          <Route path="/results/:packId" element={<ResultsPage />} />
          <Route
            path="/dev"
            element={
              <DevAccess>
                <DevPage />
              </DevAccess>
            }
          />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </>
  )
}
