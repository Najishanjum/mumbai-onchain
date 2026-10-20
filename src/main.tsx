import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PeopleProvider } from './lib/usePeopleStore'
import { SnapProvider } from './lib/useSnapStore'
import { InstallPage } from './app/InstallPage'
import { isAppMode } from './lib/pwa'

// /app in a browser is the install page; installed, it's the app like any other address.
const installPage = /^\/app\/?$/.test(window.location.pathname) && !isAppMode()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {installPage ? (
      <InstallPage />
    ) : (
      <PeopleProvider>
        <SnapProvider>
          <App />
        </SnapProvider>
      </PeopleProvider>
    )}
  </StrictMode>,
)
