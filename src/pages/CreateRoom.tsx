import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { createRoom } from '../lib/rooms'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { SectionHeader } from '../components/ui/SectionHeader'

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
    <div className="home-page">
      <Button variant="secondary" onClick={() => navigate('/')} className="ck-self-start">
        ← Back
      </Button>

      <SectionHeader title="Create Room" subtitle="Set up a multiplayer game" />

      <div className="room-form">
        <TextField
          label="Your Display Name"
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
          Create Room
        </Button>
      </div>
    </div>
  )
}
