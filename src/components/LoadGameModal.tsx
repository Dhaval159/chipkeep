import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { loadGame, clearSavedGame } from '../utils/storage'
import { Dialog } from './ui/Dialog'

function shouldShowLoadModal(): boolean {
  try {
    const roomRaw = localStorage.getItem('chipkeep-current-room')
    if (roomRaw) {
      const parsed = JSON.parse(roomRaw)
      if (parsed && parsed.roomId) {
        return false
      }
    }
  } catch { /* ignore */ }
  return Boolean(loadGame())
}

export function LoadGameModal() {
  const navigate = useNavigate()
  const { restoreGame } = useGame()
  const [show, setShow] = useState(shouldShowLoadModal)

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

  return (
    <Dialog
      open={show}
      title="Continue Previous Game?"
      description="A saved game was found."
      primaryLabel="Continue"
      primaryAction={handleContinue}
      secondaryLabel="Discard"
      secondaryAction={handleDiscard}
      onClose={handleDiscard}
    />
  )
}
