import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted rather than pulled from Google Fonts, because the normal
// condition for a wall served by a phone on the shelf is no internet at all.
// Latin subset only: three weights, about 75KB, bundled into the APK.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/wall.css'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
