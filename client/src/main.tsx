import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LiquidGlassLab } from './lab/liquid-glass/index.js'
import { AuthProvider } from './context/AuthContext.js'

const searchParams = new URLSearchParams(window.location.search)
const labName = searchParams.get('lab')
const isLiquidGlassLab = labName === 'liquidglass' || labName === 'liquidglass-logo'

const app = isLiquidGlassLab ? (
  <LiquidGlassLab initialSpecimen={labName === 'liquidglass-logo' ? 'logo' : undefined} />
) : (
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(app)
