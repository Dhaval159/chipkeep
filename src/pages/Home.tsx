import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { hasSavedGame, loadGame } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'

export const Home: React.FC = () => {
  const navigate = useNavigate()
  const { restoreGame } = useGame()
  const [showConfirm, setShowConfirm] = useState(false)
  const savedGameExists = hasSavedGame()

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
        <div className="home-logo-area">
          <h1 className="home-logo">ChipKeep</h1>
          <p className="home-tagline">Your Table. Your Chips. Zero Confusion.</p>
        </div>

        <div className="home-actions">
          {savedGameExists && (
            <Button variant="primary" fullWidth onClick={handleResume}>
              Resume Game
            </Button>
          )}
          <Button variant="primary" fullWidth onClick={handleNewGame}>
            New Game
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/history')}>
            History
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/settings')}>
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
