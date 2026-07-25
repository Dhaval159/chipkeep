import type { Player } from '../types/game'
import { Button } from './ui/Button'

interface EndHandDialogProps {
  winner: Player | null
  potWon: number
  players: Player[]
  onNextHand: () => void
  onReturn: () => void
}

export function EndHandDialog({
  winner,
  potWon,
  players,
  onNextHand,
  onReturn,
}: EndHandDialogProps) {
  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal" role="dialog" aria-modal="true">
        <h2 className="modal__title">Hand Complete</h2>

        <div className="end-hand__winner">
          <span className="end-hand__label">Winner</span>
          <span className="end-hand__value">{winner?.name ?? '—'}</span>
          <span className="end-hand__pot">
            +{potWon.toLocaleString()} Chips
          </span>
        </div>

        <div className="end-hand__standings">
          {players.map((player) => (
            <div className="end-hand__row" key={player.id}>
              <span>{player.name}</span>
              <span>{player.chips.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="modal__actions">
          <Button variant="secondary" onClick={onReturn}>
            Return to Game
          </Button>
          <Button variant="primary" onClick={onNextHand}>
            Start Next Hand
          </Button>
        </div>
      </div>
    </div>
  )
}
