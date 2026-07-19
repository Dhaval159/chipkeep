import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../types/game'
import { useGame } from '../hooks/useGame'

const CHIP_OPTIONS = [
  { value: '1000', label: '1,000' },
  { value: '5000', label: '5,000' },
  { value: '10000', label: '10,000' },
  { value: '25000', label: '25,000' },
  { value: '50000', label: '50,000' },
  { value: 'custom', label: 'Custom' },
]

const MAX_PLAYERS = 10

export default function CreateGame() {
  const navigate = useNavigate()
  const { startGame } = useGame()

  const [players, setPlayers] = useState<string[]>([])
  const [startingChips, setStartingChips] = useState<string>('1000')
  const [customChips, setCustomChips] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  const openModal = () => {
    setPlayerName('')
    setNameError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  const handleAddPlayer = () => {
    const trimmed = playerName.trim()

    if (!trimmed) {
      setNameError('Name cannot be empty')
      return
    }

    if (players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Name already exists')
      return
    }

    if (players.length >= MAX_PLAYERS) {
      setNameError(`Maximum ${MAX_PLAYERS} players`)
      return
    }

    setPlayers((prev) => [...prev, trimmed])
    closeModal()
  }

  const handleDeletePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStartGame = () => {
    if (players.length < 2) {
      return
    }

    const resolvedChips =
      startingChips === 'custom' ? Number(customChips) : Number(startingChips)

    if (!Number.isFinite(resolvedChips) || resolvedChips < 1) {
      return
    }

    const gamePlayers: Player[] = players.map((name, index) => ({
      id: `${index}-${name}`,
      name,
      chips: resolvedChips,
      status: 'waiting',
      seen: false,
    }))

    startGame({ players: gamePlayers, startingChips: resolvedChips })
    navigate('/game')
  }

  return (
    <div className="home-container">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>

      <header className="header" style={{ marginTop: 0, textAlign: 'left' }}>
        <h1 className="logo">Create Game</h1>
        <p className="subtitle">Set up your table</p>
      </header>

      <div className="field-group">
        <label className="field-label" htmlFor="startingChips">
          Starting Chips
        </label>
        <select
          id="startingChips"
          className="select"
          value={startingChips}
          onChange={(e) => setStartingChips(e.target.value)}
        >
          {CHIP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {startingChips === 'custom' && (
        <div className="field-group">
          <label className="field-label" htmlFor="customChips">
            Custom Amount
          </label>
          <input
            id="customChips"
            type="number"
            min="1"
            className="input"
            value={customChips}
            onChange={(e) => setCustomChips(e.target.value)}
            placeholder="Enter amount"
          />
        </div>
      )}

      <button type="button" className="btn btn-full" onClick={openModal}>
        Add Player
      </button>

      {players.length > 0 && (
        <div className="player-list">
          {players.map((name, index) => (
            <div className="player-card" key={`${name}-${index}`}>
              <span className="player-card__name">{name}</span>
              <button
                type="button"
                className="player-card__delete"
                onClick={() => handleDeletePlayer(index)}
                aria-label={`Delete ${name}`}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary btn-full"
        disabled={players.length < 2}
        onClick={handleStartGame}
      >
        Start Game
      </button>

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="modal__title">Add Player</h2>

            <div className="field-group" style={{ margin: 0 }}>
              <label className="field-label" htmlFor="playerName">
                Player Name
              </label>
              <input
                id="playerName"
                type="text"
                className="input"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter name"
                autoFocus
              />
            </div>

            {nameError && <p className="error-text">{nameError}</p>}

            <div className="modal__actions">
              <button type="button" className="btn" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddPlayer}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
