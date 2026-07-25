import { useState } from 'react'
import type { Player } from '../types/game'
import { validateBet } from '../utils/betting'
import { Button } from './ui/Button'

const QUICK_AMOUNTS = [10, 20, 50, 100, 500]

type Mode = 'menu' | 'bet'

interface ActionsModalProps {
  player: Player
  currentStake: number
  canSideShow: boolean
  canShow: boolean
  onSee: () => void
  onBet: (amount: number) => void
  onPack: () => void
  onRequestSideShow: () => void
  onRequestShow: () => void
  onClose: () => void
}

export function ActionsModal({
  player,
  currentStake,
  canSideShow,
  canShow,
  onSee,
  onBet,
  onPack,
  onRequestSideShow,
  onRequestShow,
  onClose,
}: ActionsModalProps) {
  const [mode, setMode] = useState<Mode>('menu')
  const [amount, setAmount] = useState<string>(
    currentStake > 0 ? String(currentStake) : '',
  )
  const [error, setError] = useState<string | null>(null)

  const addQuick = (delta: number) => {
    const base = Number(amount) || 0
    setAmount(String(base + delta))
    setError(null)
  }

  const handleConfirmBet = () => {
    const value = Number(amount)
    const result = validateBet(player, value, currentStake)
    if (!result.valid) {
      setError(result.error)
      return
    }
    onBet(value)
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="modal__title">{player.name}</h2>

        {mode === 'menu' && (
          <>
            <p className="subtitle">
              {player.chips.toLocaleString()} chips ·{' '}
              {player.seen ? 'Seen' : 'Blind'}
              {currentStake > 0 && ` · Stake ${currentStake.toLocaleString()}`}
            </p>
            <div className="bet-actions">
              {!player.seen && (
                <Button variant="secondary" fullWidth onClick={onSee}>
                  See Cards
                </Button>
              )}
              <Button variant="primary" fullWidth onClick={() => setMode('bet')}>
                Bet (Chaal)
              </Button>
              {canSideShow && (
                <Button variant="secondary" fullWidth onClick={onRequestSideShow}>
                  Side Show
                </Button>
              )}
              {canShow && (
                <Button variant="secondary" fullWidth onClick={onRequestShow}>
                  Show
                </Button>
              )}
              <Button variant="danger" fullWidth onClick={onPack}>
                Pack (Fold)
              </Button>
              <Button variant="secondary" fullWidth onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {mode === 'bet' && (
          <>
            <div className="field-group" style={{ margin: 0 }}>
              <label className="field-label" htmlFor="betAmount">
                Amount
              </label>
              <input
                id="betAmount"
                type="number"
                min={currentStake || 1}
                className="input"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError(null)
                }}
                placeholder="Enter amount"
                autoFocus
              />
            </div>

            <div className="quick-bets">
              {QUICK_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  variant="secondary"
                  onClick={() => addQuick(value)}
                  style={{ padding: '0.6rem 0.25rem', fontSize: '0.85rem', height: 'auto' }}
                >
                  +{value}
                </Button>
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="modal__actions">
              <Button variant="secondary" onClick={() => setMode('menu')}>
                Back
              </Button>
              <Button variant="primary" onClick={handleConfirmBet}>
                Confirm
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
