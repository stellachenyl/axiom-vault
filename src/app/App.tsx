import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { HomePage } from '@/pages/HomePage'
import { VaultPage } from '@/pages/VaultPage'
import { ProblemPage } from '@/pages/ProblemPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { DevPage } from '@/pages/DevPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/vault/:packId" element={<VaultPage />} />
        <Route path="/vault/:packId/problem/:problemId" element={<ProblemPage />} />
        <Route path="/results/:packId" element={<ResultsPage />} />
        <Route path="/dev" element={<DevPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}
