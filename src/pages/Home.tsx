import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import '../styles/globals.css'

export const Home: React.FC = () => {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <div className="home-container">
        <header className="header">
          <h1 className="logo">ChipKeep</h1>
          <p className="subtitle">Smart chip tracking for card nights</p>
        </header>

        <div className="button-grid">
          <button
            className="button button-primary"
            type="button"
            onClick={() => navigate('/create')}
          >
            <span className="button-icon" aria-hidden="true">🃏</span>
            <span className="button-text">New Game</span>
          </button>

          <button className="button" type="button" disabled>
            <span className="button-icon" aria-hidden="true">📂</span>
            <span className="button-text">Continue</span>
          </button>

          <button
            className="button"
            type="button"
            onClick={() => navigate('/history')}
          >
            <span className="button-icon" aria-hidden="true">📊</span>
            <span className="button-text">History</span>
          </button>

          <button
            className="button"
            type="button"
            onClick={() => navigate('/settings')}
          >
            <span className="button-icon" aria-hidden="true">⚙</span>
            <span className="button-text">Settings</span>
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

export default Home
