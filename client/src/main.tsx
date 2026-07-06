import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { VisualLab } from './lab/core/VisualLab.tsx'
import { frostedGlassStyle } from './lab/styles/frosted-glass/frostedGlassStyle.tsx'
import { logoSpecimen } from './lab/specimens/LogoSpecimen.tsx'
import { loginSpecimen } from './lab/specimens/LoginSpecimen.tsx'
import { calibrationSpecimen } from './lab/specimens/CalibrationSpecimen.tsx'
import { AuthProvider } from './context/AuthContext.js'

import { FistMosaicTest } from './presentation/components/FistMosaicTest.tsx'

const searchParams = new URLSearchParams(window.location.search)
const labName = searchParams.get('lab')?.trim()
const isFistTest = labName === 'fist-test' || labName === 'fist- test' || labName === 'custom-glass'
const isLab = searchParams.has('lab') && !isFistTest

const app = isFistTest ? (
  <FistMosaicTest />
) : isLab ? (
  <VisualLab 
    stylesDef={[frostedGlassStyle]} 
    specimens={[calibrationSpecimen, logoSpecimen, loginSpecimen]} 
    initialSpecimenId={labName && labName !== 'true' ? labName : undefined} 
  />
) : (
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(app)
