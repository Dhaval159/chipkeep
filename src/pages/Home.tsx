import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { hasSavedGame, loadGame } from '../utils/storage'
import { timeline } from '../utils/timeline'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { Users, TrendingUp, Play, QrCode, Settings, History } from 'lucide-react'

export const Home: React.FC = () => {
  const navigate = useNavigate()
  const { restoreGame } = useGame()
  const { authLoading } = useMultiplayer()
  const [showConfirm, setShowConfirm] = useState(false)
  const savedGameExists = hasSavedGame()

  const stats = useMemo(() => {
    const hands = timeline.getCompletedHands()
    return {
      totalHands: hands.length,
      totalGames: new Set(hands.map(h => h.startTime)).size,
      lastPlayed: hands.length > 0 ? hands[hands.length - 1].startTime : null,
    }
  }, [])

  const handleResume = () => {
    const saved = loadGame()
    if (saved) {
      restoreGame(saved)
      navigate('/game')
    }
  }

  const handleNewGame = () => {
    if (savedGameExists) {
      setShowConfirm(true)
    } else {
      navigate('/create')
    }
  }

  return (
    <div className="home-page">
      <div className="home-main">
        <div className="home-hero">
          <div className="home-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <h1 className="home-title"><span>ChipKeep</span></h1>
            <p className="home-tagline">Your table. Your chips. Zero confusion.</p>
          </div>
        </div>

        {stats.totalHands > 0 && (
          <div className="home-stats">
            <div className="home-stat">
              <span className="home-stat__value">{stats.totalHands}</span>
              <span className="home-stat__label">Hands</span>
            </div>
            <div className="home-stat">
              <span className="home-stat__value">{stats.totalGames}</span>
              <span className="home-stat__label">Games</span>
            </div>
            <div className="home-stat">
              <span className="home-stat__value">
                {stats.lastPlayed
                  ? new Date(stats.lastPlayed).toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : '—'}
              </span>
              <span className="home-stat__label">Last Played</span>
            </div>
          </div>
        )}

        <div className="home-section">
          <div className="home-section__header">
            <Play size={16} className="home-section__icon" />
            <h2 className="home-section__title">Single Device</h2>
          </div>
          <div className="home-actions">
            {savedGameExists && (
              <Button variant="primary" fullWidth onClick={handleResume}>
                <TrendingUp size={18} />
                Resume Game
              </Button>
            )}
            <Button variant="primary" fullWidth onClick={handleNewGame}>
              <Play size={18} />
              New Game
            </Button>
          </div>
        </div>

        <div className="home-section">
          <div className="home-section__header">
            <Users size={16} className="home-section__icon" />
            <h2 className="home-section__title">Multiplayer</h2>
          </div>
          <div className="home-actions">
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/create-room')}
              disabled={authLoading}
            >
              <Users size={18} />
              Create Room
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate('/join-room')}
              disabled={authLoading}
            >
              <QrCode size={18} />
              Join Room
            </Button>
          </div>
        </div>

        <div className="home-actions">
          <Button variant="ghost" fullWidth onClick={() => navigate('/history')}>
            <History size={18} />
            History
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate('/settings')}>
            <Settings size={18} />
            Settings
          </Button>
        </div>
      </div>

      <p className="home-version">v1.0.0</p>

      <Dialog
        open={showConfirm}
        title="Start New Game?"
        description="Starting a new game will replace the saved game."
        primaryLabel="Continue"
        primaryAction={() => {
          setShowConfirm(false)
          navigate('/create')
        }}
        secondaryLabel="Cancel"
        secondaryAction={() => setShowConfirm(false)}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  )
}

export default Home
