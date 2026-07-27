import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { leaveRoom, markDisconnected, reconnectToRoom, subscribeToRoom, startGameInRoom } from '../lib/rooms'
import type { Room, RoomPlayer } from '../types/multiplayer'
import type { Player } from '../types/game'
import { GameEngineImpl } from '../engine/GameEngine'
import { clearSavedGame } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Copy, Check, LogOut, Play, Users, ArrowLeft } from 'lucide-react'

const DEFAULT_STARTING_CHIPS = 10000
const engine = new GameEngineImpl()

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { uid, setCurrentRoom } = useMultiplayer()

  const missingRoomId = !roomId
  const [room, setRoom] = useState<(Room & { id: string }) | null>(null)
  const [loading, setLoading] = useState(!missingRoomId)
  const [error, setError] = useState<string | null>(missingRoomId ? 'No room ID provided' : null)
  const [copied, setCopied] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [navigated, setNavigated] = useState(false)

  const uidRef = useRef(uid)

  useEffect(() => {
    uidRef.current = uid
  }, [uid])

  useEffect(() => {
    if (!roomId) return

    const unsub = subscribeToRoom(roomId, (updatedRoom) => {
      if (updatedRoom) {
        setRoom(updatedRoom)
        setLoading(false)

        if (updatedRoom.status === 'playing' && updatedRoom.gameState && uidRef.current && !navigated) {
          setNavigated(true)
          clearSavedGame()
          navigate(`/game/${roomId}`, { replace: true })
        }
      } else {
        setError('Room not found')
        setLoading(false)
      }
    })

    return unsub
  }, [roomId, navigate, navigated])

  useEffect(() => {
    const currentUid = uidRef.current
    if (roomId && currentUid) {
      reconnectToRoom(roomId, currentUid)
    }
  }, [roomId])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentUid = uidRef.current
      if (roomId && currentUid) {
        markDisconnected(roomId, currentUid)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [roomId])

  const playerList: (RoomPlayer & { key: string })[] = room
    ? Object.entries(room.players)
        .filter(([, p]) => p && typeof p === 'object' && 'playerId' in p)
        .map(([key, p]) => ({ ...p, key }))
    : []

  const isHost = uid ? room?.hostId === uid : false
  const onlineCount = playerList.filter((p) => p.isConnected).length

  const handleCopyCode = async () => {
    if (!room) return
    try {
      await navigator.clipboard.writeText(room.roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = room.roomCode
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLeave = async () => {
    if (!roomId || !uid) return
    setLeaving(true)
    try {
      await leaveRoom(roomId, uid)
    } catch { /* ok */ }
    setCurrentRoom(null)
    navigate('/', { replace: true })
  }

  const handleStartGame = async () => {
    if (!roomId || !isHost || !room) return
    setStarting(true)
    try {
      const rawPlayers = Object.values(room.players).filter(
        (p): p is RoomPlayer & { playerId: string } =>
          Boolean(p && typeof p === 'object' && 'playerId' in p),
      )

      const gamePlayers: Player[] = rawPlayers.map((p) => ({
        id: p.playerId,
        name: p.displayName,
        chips: DEFAULT_STARTING_CHIPS,
        status: 'waiting' as const,
        seen: false,
      }))

      let gameState = engine.createInitialState({
        players: gamePlayers,
        startingChips: DEFAULT_STARTING_CHIPS,
      })

      gameState = engine.createNewHandState(gameState)

      await startGameInRoom(roomId, gameState)

      clearSavedGame()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="ck-page ck-page--narrow">
        <div className="lobby-loading">
          <div className="ck-spinner ck-spinner--primary ck-spinner--lg" />
          <p>Loading room...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="ck-page ck-page--narrow">
        <div className="lobby-error">
          <p>{error ?? 'Room not found'}</p>
          <Button variant="primary" fullWidth onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="ck-page ck-page--narrow">
      <button className="ck-back" onClick={handleLeave} type="button">
        <ArrowLeft size={16} />
        Leave
      </button>

      <div className="lobby-page">
        <div className="lobby-header">
          <div className="lobby-room-code-section">
            <span className="lobby-room-code-label">Room Code</span>
            <div className="lobby-room-code-row">
              <span className="lobby-room-code">{room.roomCode}</span>
              <button
                className="lobby-copy-btn"
                onClick={handleCopyCode}
                aria-label="Copy room code"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            {copied && <span className="lobby-copied-text">Copied!</span>}
          </div>

          <div className="lobby-status-section">
            <span className={`lobby-status-badge ${room.status === 'waiting' ? 'lobby-status-badge--waiting' : 'lobby-status-badge--playing'}`}>
              {room.status === 'waiting' ? 'Waiting for Players' : 'Game Started'}
            </span>
            <span className="lobby-player-count">
              <Users size={16} />
              {onlineCount} / {playerList.length} online
            </span>
          </div>
        </div>

        <div className="lobby-players-section">
          <h3 className="lobby-players-title">Players</h3>
          <div className="lobby-players-list">
            {playerList.map((player) => (
              <div
                key={player.key}
                className={`lobby-player-card${!player.isConnected ? ' lobby-player-card--disconnected' : ''}`}
              >
                <Avatar name={player.displayName} size="md" />
                <div className="lobby-player-card__info">
                  <div className="lobby-player-card__name-row">
                    <span className="lobby-player-card__name">{player.displayName}</span>
                    {player.isHost && <span className="lobby-player-card__host-badge">Host</span>}
                  </div>
                  <div className="lobby-player-card__meta">
                    <span className={`lobby-player-card__status${player.isConnected ? ' lobby-player-card__status--online' : ' lobby-player-card__status--offline'}`}>
                      {player.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    {player.playerId === uid && <span className="lobby-player-card__you">You</span>}
                  </div>
                </div>
                <div className={`lobby-player-card__status-dot ${player.isConnected ? 'lobby-player-card__status-dot--online' : 'lobby-player-card__status-dot--offline'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-actions">
          {isHost && room.status === 'waiting' && (
            <Button
              variant="primary"
              fullWidth
              onClick={handleStartGame}
              loading={starting}
              disabled={starting}
            >
              <Play size={18} />
              Start Game
            </Button>
          )}
          {!isHost && room.status === 'waiting' && (
            <div className="lobby-waiting-host">
              <p>Waiting for host to start</p>
              <div className="ck-waiting-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          {room.status === 'playing' && (
            <div className="lobby-game-started">
              <p>Game has started!</p>
            </div>
          )}

          <Button
            variant="secondary"
            fullWidth
            onClick={handleLeave}
            loading={leaving}
            disabled={leaving}
          >
            <LogOut size={18} />
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  )
}
