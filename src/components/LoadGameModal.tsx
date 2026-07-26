import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { loadGame, clearSavedGame } from '../utils/storage'
import { Dialog } from './ui/Dialog'

export function LoadGameModal() {
  const navigate = useNavigate()
  const { restoreGame } = useGame()
  const [show, setShow] = useState(() => Boolean(loadGame()))

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
