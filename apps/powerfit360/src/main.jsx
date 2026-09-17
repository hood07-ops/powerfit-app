import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import PremiumMobileNav from './PremiumMobileNav.jsx'
import { registerPowerFitPwa } from './pwa'

registerPowerFitPwa()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <PremiumMobileNav />
    </ErrorBoundary>
  </StrictMode>,
)
