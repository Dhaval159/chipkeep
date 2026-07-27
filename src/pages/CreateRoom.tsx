import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { createRoom } from '../lib/rooms'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ArrowLeft, Users } from 'lucide-react'

export default function CreateRoom() {
  const navigate = useNavigate()
  const { uid, displayName, setDisplayName, setCurrentRoom } = useMultiplayer()
  const [name, setName] = useState(displayName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a display name')
      return
    }
    if (!uid) {
      setError('Not authenticated. Please wait...')
      return
    }

    setLoading(true)
    setError(null)

    try {
      setDisplayName(trimmed)
      const { roomId, roomCode } = await createRoom(uid, trimmed)
      setCurrentRoom({ roomId, roomCode })
      navigate(`/lobby/${roomId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create room'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ck-page ck-page--narrow">
      <button className="ck-back" onClick={() => navigate('/')} type="button">
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="ck-page-header">
        <h1 className="ck-page-header__title">Create Room</h1>
        <p className="ck-page-header__subtitle">Set up a multiplayer game</p>
      </div>

      <div className="room-form">
        <div className="room-form__card">
          <TextField
            label="Display Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="Enter your name"
            autoFocus
            maxLength={20}
          />

          {error && <p className="room-error">{error}</p>}

          <Button
            variant="primary"
            fullWidth
            onClick={handleCreate}
            loading={loading}
            disabled={loading || !uid}
          >
            <Users size={18} />
            Create Room
          </Button>
        </div>
      </div>
    </div>
  )
}
