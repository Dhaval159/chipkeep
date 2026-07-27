import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../types/game'
import { useGame } from '../hooks/useGame'
import { hasSavedGame, clearSavedGame } from '../utils/storage'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { Dialog } from '../components/ui/Dialog'
import { Avatar } from '../components/ui/Avatar'
import { ArrowLeft, Play, Plus, Trash2 } from 'lucide-react'

const STARTING_CHIPS_PRESETS = [
  { value: '5000', label: '₹5,000' },
  { value: '10000', label: '₹10,000' },
  { value: '20000', label: '₹20,000' },
  { value: '50000', label: '₹50,000' },
  { value: 'custom', label: 'Custom' },
]

const BOOT_AMOUNT_PRESETS = [
  { value: '10', label: '₹10' },
  { value: '20', label: '₹20' },
  { value: '50', label: '₹50' },
  { value: '100', label: '₹100' },
  { value: 'custom', label: 'Custom' },
]

const MAX_PLAYERS = 10

export default function CreateGame() {
  const navigate = useNavigate()
  const { startGame } = useGame()

  const [players, setPlayers] = useState<string[]>([])
  const [startingChips, setStartingChips] = useState<string>('10000')
  const [customChips, setCustomChips] = useState<string>('')
  const [bootAmount, setBootAmount] = useState<string>('20')
  const [customBoot, setCustomBoot] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [confirmNewGame, setConfirmNewGame] = useState(false)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const [recentlyAdded, setRecentlyAdded] = useState<Set<number>>(new Set())

  const openModal = () => {
    setPlayerName('')
    setNameError(null)
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)

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

    setPlayers((prev) => {
      const next = [...prev, trimmed]
      setRecentlyAdded((s) => new Set(s).add(next.length - 1))
      setTimeout(() => {
        setRecentlyAdded((s) => {
          const next2 = new Set(s)
          next2.delete(next.length - 1)
          return next2
        })
      }, 250)
      return next
    })
    closeModal()
  }

  const handleDeletePlayer = (index: number) => {
    setRemovingIndex(index)
    setTimeout(() => {
      setPlayers((prev) => prev.filter((_, i) => i !== index))
      setRemovingIndex(null)
    }, 150)
  }

  const doStartGame = () => {
    const resolvedChips =
      startingChips === 'custom' ? Number(customChips) : Number(startingChips)

    const gamePlayers: Player[] = players.map((name, index) => ({
      id: `${index}-${name}`,
      name,
      chips: resolvedChips,
      status: 'waiting',
      seen: false,
    }))

    clearSavedGame()
    startGame({ players: gamePlayers, startingChips: resolvedChips })
    navigate('/game')
  }

  const handleStartGame = () => {
    if (players.length < 2) return

    const resolvedChips =
      startingChips === 'custom' ? Number(customChips) : Number(startingChips)

    if (!Number.isFinite(resolvedChips) || resolvedChips < 1) return

    if (hasSavedGame()) {
      setConfirmNewGame(true)
      return
    }

    doStartGame()
  }

  return (
    <div className="ck-page ck-page--narrow" style={{ gap: 'var(--space-20)' }}>
      <button className="ck-back" onClick={() => navigate('/')} type="button">
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="ck-page-header">
        <h1 className="ck-page-header__title">Create Game</h1>
        <p className="ck-page-header__subtitle">Set up your table</p>
      </div>

      <div className="room-form__card">
        <div className="ck-full-width">
          <span className="ck-chip-label" id="starting-chips-label">Starting Chips</span>
          <div className="ck-chip-presets" role="group" aria-labelledby="starting-chips-label">
            {STARTING_CHIPS_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`ck-chip-preset${startingChips === preset.value ? ' ck-chip-preset--active' : ''}`}
                aria-pressed={startingChips === preset.value}
                onClick={() => setStartingChips(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {startingChips === 'custom' && (
            <div className="ck-mt-sm">
              <TextField
                label="Custom Amount"
                type="number"
                min="1"
                value={customChips}
                onChange={(e) => setCustomChips(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          )}
        </div>

        <div className="ck-full-width">
          <span className="ck-chip-label" id="boot-amount-label">Boot Amount</span>
          <div className="ck-chip-presets" role="group" aria-labelledby="boot-amount-label">
            {BOOT_AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`ck-chip-preset${bootAmount === preset.value ? ' ck-chip-preset--active' : ''}`}
                aria-pressed={bootAmount === preset.value}
                onClick={() => setBootAmount(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {bootAmount === 'custom' && (
            <div className="ck-mt-sm">
              <TextField
                label="Custom Boot"
                type="number"
                min="1"
                value={customBoot}
                onChange={(e) => setCustomBoot(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          )}
          <p className="ck-chip-helper">
            Every player contributes this amount at the beginning of each hand.
          </p>
        </div>
      </div>

      <div className="ck-full-width">
        <div className="home-section__header">
          <h2 className="home-section__title">Players</h2>
        </div>

        <div
          className={
            players.length === 0
              ? 'ck-create-players-card ck-create-players-card--empty'
              : 'ck-create-players-card'
          }
          aria-label="Player list"
        >
          {players.length === 0 && (
            <span className="ck-create-empty">No players added yet</span>
          )}

          {players.map((name, index) => (
            <div
              key={`${name}-${index}`}
              className={`ck-player-card ck-player-card--compact${recentlyAdded.has(index) ? ' ck-player-card--animate' : ''}${removingIndex === index ? ' ck-player-card--removing' : ''}`}
            >
              <Avatar name={name} size="sm" />
              <div className="ck-player-card__info">
                <span className="ck-player-card__name">{name}</span>
              </div>
              <button
                type="button"
                className="ck-compact-delete"
                onClick={() => handleDeletePlayer(index)}
                aria-label={`Remove ${name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="ck-mt-sm">
          <Button variant="secondary" fullWidth onClick={openModal}>
            <Plus size={18} />
            Add Player
          </Button>
        </div>
      </div>

      {players.length > 0 && players.length < 2 && (
        <p className="ck-validation-hint">Add at least 2 players to create a table</p>
      )}

      <div className="ck-create-bottom">
        <Button
          variant="primary"
          fullWidth
          disabled={players.length < 2}
          onClick={handleStartGame}
        >
          <Play size={18} />
          Create Table
        </Button>
      </div>

      <Dialog
        open={modalOpen}
        title="Add Player"
        primaryLabel="Add"
        primaryAction={handleAddPlayer}
        secondaryLabel="Cancel"
        secondaryAction={closeModal}
        onClose={closeModal}
      >
        <TextField
          label="Player Name"
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value)
            setNameError(null)
          }}
          placeholder="Enter name"
          autoFocus
          error={nameError}
        />
      </Dialog>

      <Dialog
        open={confirmNewGame}
        title="Start New Game?"
        description="Starting a new game will erase the previous saved game."
        primaryLabel="Start"
        primaryAction={() => {
          setConfirmNewGame(false)
          doStartGame()
        }}
        secondaryLabel="Cancel"
        secondaryAction={() => setConfirmNewGame(false)}
        onClose={() => setConfirmNewGame(false)}
      />
    </div>
  )
}
