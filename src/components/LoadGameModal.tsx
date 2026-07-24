import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { loadGame, clearSavedGame } from '../utils/storage'

export function LoadGameModal() {
  const navigate = useNavigate()
  const { restoreGame } = useGame()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const saved = loadGame()
    if (saved) {
      setShow(true)
    }
  }, [])

  const handleContinue = () => {
    const saved = loadGame()
    if (saved) {
      restoreGame(saved)
      setShow(false)
      navigate('/game')
    }
  }

  const handleDiscard = () => {
    clearSavedGame()
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal" role="dialog" aria-modal="true">
        <h2 className="modal__title">Continue Previous Game?</h2>
        <p className="subtitle">A saved game was found.</p>

        <div className="modal__actions">
          <button type="button" className="btn" onClick={handleDiscard}>
            Discard
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
