import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import App from './App.tsx'
import { GameProvider } from './context/GameProvider'
import { MultiplayerProvider } from './context/MultiplayerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MultiplayerProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </MultiplayerProvider>
    </BrowserRouter>
  </StrictMode>,
)
