import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { getRoomByCode, joinRoom } from '../lib/rooms'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ArrowLeft, LogIn } from 'lucide-react'

export default function JoinRoom() {
  const navigate = useNavigate()
  const { uid, displayName, setDisplayName, setCurrentRoom } = useMultiplayer()
  const [code, setCode] = useState('')
  const [name, setName] = useState(displayName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(upper)
    setError(null)
  }

  const handleJoin = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a display name')
      return
    }
    if (code.length !== 6) {
      setError('Room code must be 6 characters')
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

      const room = await getRoomByCode(code)
      if (!room) {
        setError('Room not found. Check the code and try again.')
        setLoading(false)
        return
      }
      if (room.status !== 'waiting') {
        setError('This room has already started.')
        setLoading(false)
        return
      }

      await joinRoom(room.id, uid, trimmed)
      setCurrentRoom({ roomId: room.id, roomCode: room.roomCode })
      navigate(`/lobby/${room.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join room'
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
        <h1 className="ck-page-header__title">Join Room</h1>
        <p className="ck-page-header__subtitle">Enter the room code to join</p>
      </div>

      <div className="room-form">
        <div className="room-form__card">
          <TextField
            label="Room Code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="AB7XKQ"
            maxLength={6}
            autoFocus
            wrapperClassName="room-code-input"
          />

          <TextField
            label="Display Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            placeholder="Enter your name"
            maxLength={20}
          />

          {error && <p className="room-error">{error}</p>}

          <Button
            variant="primary"
            fullWidth
            onClick={handleJoin}
            loading={loading}
            disabled={loading || !uid || code.length !== 6}
          >
            <LogIn size={18} />
            Join Room
          </Button>
        </div>
      </div>
    </div>
  )
}
