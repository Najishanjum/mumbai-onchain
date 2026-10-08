import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PeopleProvider } from './lib/usePeopleStore'
import { SnapProvider } from './lib/useSnapStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PeopleProvider>
      <SnapProvider>
        <App />
      </SnapProvider>
    </PeopleProvider>
  </StrictMode>,
)
