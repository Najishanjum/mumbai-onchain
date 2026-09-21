import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PeopleProvider } from './lib/usePeopleStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PeopleProvider>
      <App />
    </PeopleProvider>
  </StrictMode>,
)
